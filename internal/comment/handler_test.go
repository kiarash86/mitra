package comment

import (
	"context"
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/testutil"
)

type fixture struct {
	projectID uuid.UUID
	taskID    uuid.UUID
	commentID uuid.UUID
	callerID  uuid.UUID
}

func newFixture() fixture {
	return fixture{
		projectID: uuid.New(),
		taskID:    uuid.New(),
		commentID: uuid.New(),
		callerID:  uuid.New(),
	}
}

// baseQuerier wires GetTaskByID/GetProjectByID/GetProjectMemberRole for the
// caller only; the comment itself (authored by authorID, or the caller if
// authorID is uuid.Nil) is served by GetCommentByIDFn.
func (f fixture) baseQuerier(role string, authorID uuid.UUID) *testutil.FakeQuerier {
	if authorID == uuid.Nil {
		authorID = f.callerID
	}
	return &testutil.FakeQuerier{
		GetTaskByIDFn: func(ctx context.Context, id uuid.UUID) (sqlc.Task, error) {
			if id != f.taskID {
				return sqlc.Task{}, pgx.ErrNoRows
			}
			return sqlc.Task{ID: f.taskID, ProjectID: f.projectID}, nil
		},
		GetProjectByIDFn: func(ctx context.Context, id uuid.UUID) (sqlc.Project, error) {
			if id != f.projectID {
				return sqlc.Project{}, pgx.ErrNoRows
			}
			return sqlc.Project{ID: f.projectID}, nil
		},
		GetProjectMemberRoleFn: func(ctx context.Context, arg sqlc.GetProjectMemberRoleParams) (string, error) {
			if arg.ProjectID != f.projectID || arg.UserID != f.callerID || role == "" {
				return "", pgx.ErrNoRows
			}
			return role, nil
		},
		GetCommentByIDFn: func(ctx context.Context, id uuid.UUID) (sqlc.Comment, error) {
			if id != f.commentID {
				return sqlc.Comment{}, pgx.ErrNoRows
			}
			return sqlc.Comment{ID: f.commentID, TaskID: f.taskID, AuthorID: authorID, Body: "hi"}, nil
		},
	}
}

var roleCases = []struct {
	role       string
	wantStatus int
}{
	{"owner", http.StatusOK},
	{"admin", http.StatusOK},
	{"member", http.StatusOK},
	{"viewer", http.StatusForbidden},
}

func TestCreate_ViewerForbidden_OthersAllowed(t *testing.T) {
	for _, tc := range roleCases {
		t.Run(tc.role, func(t *testing.T) {
			f := newFixture()
			q := f.baseQuerier(tc.role, uuid.Nil)
			q.CreateCommentFn = func(ctx context.Context, arg sqlc.CreateCommentParams) (sqlc.Comment, error) {
				return sqlc.Comment{ID: uuid.New(), TaskID: f.taskID, AuthorID: f.callerID, Body: arg.Body}, nil
			}
			h := NewHandler(q)

			body := []byte(`{"body":"a comment"}`)
			c, w := testutil.NewGinContext(http.MethodPost, "/api/v1/tasks/x/comments", body, gin.Params{{Key: "id", Value: f.taskID.String()}})
			testutil.SetCurrentUser(c, f.callerID)

			h.Create(c)

			if got := testutil.StatusCode(w); got != tc.wantStatus {
				t.Errorf("role=%s: Create() status = %d, want %d, body=%s", tc.role, got, tc.wantStatus, w.Body.String())
			}
		})
	}
}

func TestListByTask_ViewerCanRead(t *testing.T) {
	f := newFixture()
	q := f.baseQuerier("viewer", uuid.Nil)
	q.ListCommentsByTaskFn = func(ctx context.Context, taskID uuid.UUID) ([]sqlc.ListCommentsByTaskRow, error) {
		return nil, nil
	}
	h := NewHandler(q)

	c, w := testutil.NewGinContext(http.MethodGet, "/api/v1/tasks/x/comments", nil, gin.Params{{Key: "id", Value: f.taskID.String()}})
	testutil.SetCurrentUser(c, f.callerID)

	h.ListByTask(c)

	if got := testutil.StatusCode(w); got != http.StatusOK {
		t.Errorf("viewer ListByTask() status = %d, want %d, body=%s", got, http.StatusOK, w.Body.String())
	}
}

// TestUpdate_AuthorButViewer_Forbidden is the key regression: authorship
// alone used to be sufficient to edit a comment, with no role check at
// all. A viewer who somehow authored (or previously authored, before a
// role downgrade) a comment must still be blocked now.
func TestUpdate_AuthorButViewer_Forbidden(t *testing.T) {
	for _, tc := range roleCases {
		t.Run(tc.role, func(t *testing.T) {
			f := newFixture()
			q := f.baseQuerier(tc.role, uuid.Nil) // authorID == callerID
			q.UpdateCommentFn = func(ctx context.Context, arg sqlc.UpdateCommentParams) (sqlc.Comment, error) {
				return sqlc.Comment{ID: f.commentID, TaskID: f.taskID, AuthorID: f.callerID, Body: arg.Body}, nil
			}
			h := NewHandler(q)

			body := []byte(`{"body":"edited"}`)
			c, w := testutil.NewGinContext(http.MethodPut, "/api/v1/comments/x", body, gin.Params{{Key: "id", Value: f.commentID.String()}})
			testutil.SetCurrentUser(c, f.callerID)

			h.Update(c)

			if got := testutil.StatusCode(w); got != tc.wantStatus {
				t.Errorf("author-role=%s: Update() status = %d, want %d, body=%s", tc.role, got, tc.wantStatus, w.Body.String())
			}
		})
	}
}

func TestUpdate_NonAuthor_AlwaysForbidden(t *testing.T) {
	// Unchanged pre-existing rule: only the author may ever edit, regardless
	// of role. Pinned here so the new write-access check can't accidentally
	// loosen it (e.g. by letting a project admin edit someone else's text).
	f := newFixture()
	otherAuthor := uuid.New()
	q := f.baseQuerier("admin", otherAuthor)
	h := NewHandler(q)

	body := []byte(`{"body":"edited"}`)
	c, w := testutil.NewGinContext(http.MethodPut, "/api/v1/comments/x", body, gin.Params{{Key: "id", Value: f.commentID.String()}})
	testutil.SetCurrentUser(c, f.callerID)

	h.Update(c)

	if got := testutil.StatusCode(w); got != http.StatusForbidden {
		t.Errorf("non-author admin Update() status = %d, want %d (unchanged, pre-existing rule), body=%s", got, http.StatusForbidden, w.Body.String())
	}
}

// TestDelete_AuthorButViewer_Forbidden is the Delete-side counterpart of
// the Update regression above: the author-only bypass previously had no
// role check whatsoever.
func TestDelete_AuthorButViewer_Forbidden(t *testing.T) {
	for _, tc := range roleCases {
		t.Run(tc.role, func(t *testing.T) {
			f := newFixture()
			q := f.baseQuerier(tc.role, uuid.Nil)
			q.SoftDeleteCommentFn = func(ctx context.Context, id uuid.UUID) error { return nil }
			h := NewHandler(q)

			c, w := testutil.NewGinContext(http.MethodDelete, "/api/v1/comments/x", nil, gin.Params{{Key: "id", Value: f.commentID.String()}})
			testutil.SetCurrentUser(c, f.callerID)

			h.Delete(c)

			wantStatus := tc.wantStatus
			if wantStatus == http.StatusOK {
				wantStatus = http.StatusNoContent // Delete returns 204, not 200, on success
			}
			if got := testutil.StatusCode(w); got != wantStatus {
				t.Errorf("author-role=%s: Delete() status = %d, want %d, body=%s", tc.role, got, wantStatus, w.Body.String())
			}
		})
	}
}

func TestDelete_NonAuthor_ProjectAdminAllowed_MemberForbidden(t *testing.T) {
	// Unchanged pre-existing rule: a project owner/admin (or global
	// owner/admin) may delete someone else's comment; a plain member may
	// not. Pinned so the author-path fix above doesn't touch this branch.
	otherAuthor := uuid.New()

	f := newFixture()
	adminQ := f.baseQuerier("admin", otherAuthor)
	adminQ.SoftDeleteCommentFn = func(ctx context.Context, id uuid.UUID) error { return nil }
	h := NewHandler(adminQ)
	c, w := testutil.NewGinContext(http.MethodDelete, "/api/v1/comments/x", nil, gin.Params{{Key: "id", Value: f.commentID.String()}})
	testutil.SetCurrentUser(c, f.callerID)
	h.Delete(c)
	if got := testutil.StatusCode(w); got != http.StatusNoContent {
		t.Errorf("non-author admin Delete() status = %d, want %d, body=%s", got, http.StatusNoContent, w.Body.String())
	}

	f2 := newFixture()
	memberQ := f2.baseQuerier("member", otherAuthor)
	memberQ.GetUserByIDFn = func(ctx context.Context, id uuid.UUID) (sqlc.User, error) {
		return sqlc.User{ID: id, Role: "member"}, nil
	}
	h2 := NewHandler(memberQ)
	c2, w2 := testutil.NewGinContext(http.MethodDelete, "/api/v1/comments/x", nil, gin.Params{{Key: "id", Value: f2.commentID.String()}})
	testutil.SetCurrentUser(c2, f2.callerID)
	h2.Delete(c2)
	if got := testutil.StatusCode(w2); got != http.StatusForbidden {
		t.Errorf("non-author member Delete() status = %d, want %d (unchanged, pre-existing rule), body=%s", got, http.StatusForbidden, w2.Body.String())
	}
}
