package task

import (
	"context"
	"net/http"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/testutil"
)

// roleFixture wires up a FakeQuerier for a single project/task pair, with
// one caller whose project role is configurable per sub-test. Every method
// a test doesn't need stays unset (and will panic loudly if unexpectedly
// called), which is the point: it makes the test say exactly what
// authorization path it's exercising.
type roleFixture struct {
	projectID uuid.UUID
	taskID    uuid.UUID
	callerID  uuid.UUID
}

func newFixture() roleFixture {
	return roleFixture{
		projectID: uuid.New(),
		taskID:    uuid.New(),
		callerID:  uuid.New(),
	}
}

func (f roleFixture) baseQuerier(role string) *testutil.FakeQuerier {
	return &testutil.FakeQuerier{
		GetProjectByIDFn: func(ctx context.Context, id uuid.UUID) (sqlc.Project, error) {
			if id != f.projectID {
				return sqlc.Project{}, pgx.ErrNoRows
			}
			return sqlc.Project{ID: f.projectID}, nil
		},
		GetTaskByIDFn: func(ctx context.Context, id uuid.UUID) (sqlc.Task, error) {
			if id != f.taskID {
				return sqlc.Task{}, pgx.ErrNoRows
			}
			return sqlc.Task{ID: f.taskID, ProjectID: f.projectID, Status: "todo", Priority: "medium"}, nil
		},
		GetProjectMemberRoleFn: func(ctx context.Context, arg sqlc.GetProjectMemberRoleParams) (string, error) {
			if arg.ProjectID != f.projectID || arg.UserID != f.callerID {
				return "", pgx.ErrNoRows
			}
			if role == "" {
				return "", pgx.ErrNoRows
			}
			return role, nil
		},
	}
}

// roles exercised by every mutation sub-test below: viewer must be
// forbidden, every other role's existing behavior must be unchanged.
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
			q := f.baseQuerier(tc.role)
			q.CreateTaskFn = func(ctx context.Context, arg sqlc.CreateTaskParams) (sqlc.Task, error) {
				return sqlc.Task{ID: uuid.New(), ProjectID: f.projectID, Title: arg.Title, Status: "todo", Priority: arg.Priority}, nil
			}
			h := NewHandler(q)

			body := []byte(`{"title":"do the thing"}`)
			c, w := testutil.NewGinContext(http.MethodPost, "/api/v1/projects/x/tasks", body, gin.Params{{Key: "id", Value: f.projectID.String()}})
			testutil.SetCurrentUser(c, f.callerID)

			h.Create(c)

			if got := testutil.StatusCode(w); got != tc.wantStatus {
				t.Errorf("role=%s: Create() status = %d, want %d, body=%s", tc.role, got, tc.wantStatus, w.Body.String())
			}
			if tc.role == "viewer" && !strings.Contains(w.Body.String(), "permission") {
				t.Errorf("expected a permission-denied error body for viewer, got %s", w.Body.String())
			}
		})
	}
}

func TestUpdate_ViewerForbidden_OthersAllowed(t *testing.T) {
	for _, tc := range roleCases {
		t.Run(tc.role, func(t *testing.T) {
			f := newFixture()
			q := f.baseQuerier(tc.role)
			q.UpdateTaskFn = func(ctx context.Context, arg sqlc.UpdateTaskParams) (sqlc.Task, error) {
				return sqlc.Task{ID: f.taskID, ProjectID: f.projectID, Title: arg.Title, Status: "todo", Priority: arg.Priority}, nil
			}
			h := NewHandler(q)

			body := []byte(`{"title":"updated","priority":"high"}`)
			c, w := testutil.NewGinContext(http.MethodPut, "/api/v1/tasks/x", body, gin.Params{{Key: "id", Value: f.taskID.String()}})
			testutil.SetCurrentUser(c, f.callerID)

			h.Update(c)

			if got := testutil.StatusCode(w); got != tc.wantStatus {
				t.Errorf("role=%s: Update() status = %d, want %d, body=%s", tc.role, got, tc.wantStatus, w.Body.String())
			}
		})
	}
}

func TestUpdateStatus_ViewerForbidden_OthersAllowed(t *testing.T) {
	for _, tc := range roleCases {
		t.Run(tc.role, func(t *testing.T) {
			f := newFixture()
			q := f.baseQuerier(tc.role)
			q.UpdateTaskStatusFn = func(ctx context.Context, arg sqlc.UpdateTaskStatusParams) (sqlc.Task, error) {
				return sqlc.Task{ID: f.taskID, ProjectID: f.projectID, Status: arg.Status, Priority: "medium"}, nil
			}
			h := NewHandler(q)

			body := []byte(`{"status":"in_progress"}`)
			c, w := testutil.NewGinContext(http.MethodPatch, "/api/v1/tasks/x/status", body, gin.Params{{Key: "id", Value: f.taskID.String()}})
			testutil.SetCurrentUser(c, f.callerID)

			h.UpdateStatus(c)

			if got := testutil.StatusCode(w); got != tc.wantStatus {
				t.Errorf("role=%s: UpdateStatus() status = %d, want %d, body=%s", tc.role, got, tc.wantStatus, w.Body.String())
			}
		})
	}
}

func TestUnassign_ViewerForbidden_MemberStillAllowed(t *testing.T) {
	// Unassign is the one case where "member" behavior is deliberately
	// preserved (flagged as NEEDS DECISION in the audit): a plain member
	// could unassign before this fix and still can. Only viewer changes.
	for _, tc := range roleCases {
		t.Run(tc.role, func(t *testing.T) {
			f := newFixture()
			q := f.baseQuerier(tc.role)
			q.UnassignTaskFn = func(ctx context.Context, id uuid.UUID) (sqlc.Task, error) {
				return sqlc.Task{ID: f.taskID, ProjectID: f.projectID, Status: "todo", Priority: "medium"}, nil
			}
			h := NewHandler(q)

			c, w := testutil.NewGinContext(http.MethodPost, "/api/v1/tasks/x/unassign", nil, gin.Params{{Key: "id", Value: f.taskID.String()}})
			testutil.SetCurrentUser(c, f.callerID)

			h.Unassign(c)

			if got := testutil.StatusCode(w); got != tc.wantStatus {
				t.Errorf("role=%s: Unassign() status = %d, want %d, body=%s", tc.role, got, tc.wantStatus, w.Body.String())
			}
		})
	}
}

// --- Read endpoints: viewer must NOT be blocked (regression guard against
// over-correcting the fix above). ---

func TestGetByID_ViewerCanRead(t *testing.T) {
	f := newFixture()
	q := f.baseQuerier("viewer")
	h := NewHandler(q)

	c, w := testutil.NewGinContext(http.MethodGet, "/api/v1/tasks/x", nil, gin.Params{{Key: "id", Value: f.taskID.String()}})
	testutil.SetCurrentUser(c, f.callerID)

	h.GetByID(c)

	if got := testutil.StatusCode(w); got != http.StatusOK {
		t.Errorf("viewer GetByID() status = %d, want %d, body=%s", got, http.StatusOK, w.Body.String())
	}
}

func TestListByProject_ViewerCanRead(t *testing.T) {
	f := newFixture()
	q := f.baseQuerier("viewer")
	q.ListTasksByProjectFn = func(ctx context.Context, projectID uuid.UUID) ([]sqlc.Task, error) {
		return []sqlc.Task{{ID: f.taskID, ProjectID: f.projectID, Status: "todo", Priority: "medium"}}, nil
	}
	h := NewHandler(q)

	c, w := testutil.NewGinContext(http.MethodGet, "/api/v1/projects/x/tasks", nil, gin.Params{{Key: "id", Value: f.projectID.String()}})
	testutil.SetCurrentUser(c, f.callerID)

	h.ListByProject(c)

	if got := testutil.StatusCode(w); got != http.StatusOK {
		t.Errorf("viewer ListByProject() status = %d, want %d, body=%s", got, http.StatusOK, w.Body.String())
	}
}

func TestAssignToUser_ViewerForbidden_AdminAllowed(t *testing.T) {
	// Assign was already project-owner/admin-only before this task
	// (requester side); this test pins that existing, unmodified behavior.
	assigneeID := uuid.New()

	f := newFixture()
	adminQ := f.baseQuerier("admin")
	adminQ.GetProjectMemberRoleFn = func(ctx context.Context, arg sqlc.GetProjectMemberRoleParams) (string, error) {
		if arg.UserID == f.callerID {
			return "admin", nil
		}
		if arg.UserID == assigneeID {
			return "member", nil
		}
		return "", pgx.ErrNoRows
	}
	adminQ.AssignTaskToUserFn = func(ctx context.Context, arg sqlc.AssignTaskToUserParams) (sqlc.Task, error) {
		return sqlc.Task{ID: f.taskID, ProjectID: f.projectID, Status: "todo", Priority: "medium"}, nil
	}
	h := NewHandler(adminQ)
	body := []byte(`{"user_id":"` + assigneeID.String() + `"}`)
	c, w := testutil.NewGinContext(http.MethodPost, "/api/v1/tasks/x/assign/user", body, gin.Params{{Key: "id", Value: f.taskID.String()}})
	testutil.SetCurrentUser(c, f.callerID)
	h.AssignToUser(c)
	if got := testutil.StatusCode(w); got != http.StatusOK {
		t.Errorf("admin AssignToUser() status = %d, want %d, body=%s", got, http.StatusOK, w.Body.String())
	}

	f2 := newFixture()
	viewerQ := f2.baseQuerier("viewer")
	h2 := NewHandler(viewerQ)
	body2 := []byte(`{"user_id":"` + assigneeID.String() + `"}`)
	c2, w2 := testutil.NewGinContext(http.MethodPost, "/api/v1/tasks/x/assign/user", body2, gin.Params{{Key: "id", Value: f2.taskID.String()}})
	testutil.SetCurrentUser(c2, f2.callerID)
	h2.AssignToUser(c2)
	if got := testutil.StatusCode(w2); got != http.StatusForbidden {
		t.Errorf("viewer AssignToUser() status = %d, want %d (unchanged, pre-existing rule), body=%s", got, http.StatusForbidden, w2.Body.String())
	}
}

// --- Delete/Assign: already-safe endpoints (owner/admin-only). Documented
// here as SAFE/INTENTIONAL, not re-derived from scratch, per instructions
// not to blindly add tests where the existing rule was already correct. ---

func TestDelete_MemberForbidden_AdminAllowed(t *testing.T) {
	// Delete was already project-owner/admin-only before this task; this
	// test only pins that existing, unmodified behavior so a future change
	// can't silently regress it.
	f := newFixture()
	adminQ := f.baseQuerier("admin")
	adminQ.SoftDeleteTaskFn = func(ctx context.Context, id uuid.UUID) error { return nil }
	h := NewHandler(adminQ)
	c, w := testutil.NewGinContext(http.MethodDelete, "/api/v1/tasks/x", nil, gin.Params{{Key: "id", Value: f.taskID.String()}})
	testutil.SetCurrentUser(c, f.callerID)
	h.Delete(c)
	if got := testutil.StatusCode(w); got != http.StatusNoContent {
		t.Errorf("admin Delete() status = %d, want %d, body=%s", got, http.StatusNoContent, w.Body.String())
	}

	f2 := newFixture()
	memberQ := f2.baseQuerier("member")
	// Delete falls back to a *global* owner/admin check when the caller
	// isn't a project owner/admin; give it a non-privileged global role so
	// that fallback is exercised (and correctly still denies) rather than
	// panicking on an unset fake method.
	memberQ.GetUserByIDFn = func(ctx context.Context, id uuid.UUID) (sqlc.User, error) {
		return sqlc.User{ID: id, Role: "member"}, nil
	}
	h2 := NewHandler(memberQ)
	c2, w2 := testutil.NewGinContext(http.MethodDelete, "/api/v1/tasks/x", nil, gin.Params{{Key: "id", Value: f2.taskID.String()}})
	testutil.SetCurrentUser(c2, f2.callerID)
	h2.Delete(c2)
	if got := testutil.StatusCode(w2); got != http.StatusForbidden {
		t.Errorf("member Delete() status = %d, want %d (unchanged, pre-existing rule), body=%s", got, http.StatusForbidden, w2.Body.String())
	}
}
