package chat

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
	messageID uuid.UUID
	callerID  uuid.UUID
}

func newFixture() fixture {
	return fixture{
		projectID: uuid.New(),
		messageID: uuid.New(),
		callerID:  uuid.New(),
	}
}

// baseQuerier wires GetProjectMemberRole for the caller and GetMessageByID
// for a message sent by senderID (defaults to the caller if uuid.Nil).
func (f fixture) baseQuerier(role string, senderID uuid.UUID) *testutil.FakeQuerier {
	if senderID == uuid.Nil {
		senderID = f.callerID
	}
	return &testutil.FakeQuerier{
		GetProjectMemberRoleFn: func(ctx context.Context, arg sqlc.GetProjectMemberRoleParams) (string, error) {
			if arg.ProjectID != f.projectID || arg.UserID != f.callerID || role == "" {
				return "", pgx.ErrNoRows
			}
			return role, nil
		},
		GetMessageByIDFn: func(ctx context.Context, id uuid.UUID) (sqlc.Message, error) {
			if id != f.messageID {
				return sqlc.Message{}, pgx.ErrNoRows
			}
			return sqlc.Message{ID: f.messageID, ProjectID: f.projectID, SenderID: senderID, Body: "hi"}, nil
		},
	}
}

// newTestHub returns a running Hub so h.Broadcast (called on the success
// path of Update/DeleteMessage) doesn't block on its unbuffered channel.
func newTestHub() *Hub {
	h := NewHub()
	go h.Run()
	return h
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

// TestUpdateMessage_SenderButViewer_Forbidden is the key regression:
// UpdateMessage previously checked project membership (IsProjectMember,
// which treats viewer as member) rather than write capability.
func TestUpdateMessage_SenderButViewer_Forbidden(t *testing.T) {
	for _, tc := range roleCases {
		t.Run(tc.role, func(t *testing.T) {
			f := newFixture()
			q := f.baseQuerier(tc.role, uuid.Nil) // sender == caller
			q.UpdateMessageFn = func(ctx context.Context, arg sqlc.UpdateMessageParams) (sqlc.Message, error) {
				return sqlc.Message{ID: f.messageID, ProjectID: f.projectID, SenderID: f.callerID, Body: arg.Body}, nil
			}
			h := NewHandler(q, newTestHub(), nil)

			body := []byte(`{"body":"edited"}`)
			c, w := testutil.NewGinContext(http.MethodPut, "/api/v1/messages/x", body, gin.Params{{Key: "id", Value: f.messageID.String()}})
			testutil.SetCurrentUser(c, f.callerID)

			h.UpdateMessage(c)

			if got := testutil.StatusCode(w); got != tc.wantStatus {
				t.Errorf("sender-role=%s: UpdateMessage() status = %d, want %d, body=%s", tc.role, got, tc.wantStatus, w.Body.String())
			}
		})
	}
}

func TestUpdateMessage_NonSender_AlwaysForbidden(t *testing.T) {
	// Unchanged pre-existing rule: only the sender may ever edit their own
	// message, regardless of role — there is no admin-override for edit
	// (only for delete). Pinned so it isn't accidentally loosened.
	f := newFixture()
	otherSender := uuid.New()
	q := f.baseQuerier("admin", otherSender)
	h := NewHandler(q, newTestHub(), nil)

	body := []byte(`{"body":"edited"}`)
	c, w := testutil.NewGinContext(http.MethodPut, "/api/v1/messages/x", body, gin.Params{{Key: "id", Value: f.messageID.String()}})
	testutil.SetCurrentUser(c, f.callerID)

	h.UpdateMessage(c)

	if got := testutil.StatusCode(w); got != http.StatusForbidden {
		t.Errorf("non-sender admin UpdateMessage() status = %d, want %d (unchanged, pre-existing rule), body=%s", got, http.StatusForbidden, w.Body.String())
	}
}

// TestDeleteMessage_SenderButViewer_Forbidden is the Delete-side
// counterpart: the sender-only bypass previously had no role check at all.
func TestDeleteMessage_SenderButViewer_Forbidden(t *testing.T) {
	for _, tc := range roleCases {
		t.Run(tc.role, func(t *testing.T) {
			f := newFixture()
			q := f.baseQuerier(tc.role, uuid.Nil)
			q.SoftDeleteMessageFn = func(ctx context.Context, id uuid.UUID) error { return nil }
			h := NewHandler(q, newTestHub(), nil)

			c, w := testutil.NewGinContext(http.MethodDelete, "/api/v1/messages/x", nil, gin.Params{{Key: "id", Value: f.messageID.String()}})
			testutil.SetCurrentUser(c, f.callerID)

			h.DeleteMessage(c)

			wantStatus := tc.wantStatus
			if wantStatus == http.StatusOK {
				wantStatus = http.StatusNoContent
			}
			if got := testutil.StatusCode(w); got != wantStatus {
				t.Errorf("sender-role=%s: DeleteMessage() status = %d, want %d, body=%s", tc.role, got, wantStatus, w.Body.String())
			}
		})
	}
}

func TestDeleteMessage_NonSender_ProjectAdminAllowed_MemberForbidden(t *testing.T) {
	// Unchanged pre-existing rule: a project owner/admin may delete someone
	// else's message; a plain member may not (no global-admin fallback
	// exists here — noted separately as a pre-existing inconsistency, not
	// part of this fix).
	otherSender := uuid.New()

	f := newFixture()
	adminQ := f.baseQuerier("admin", otherSender)
	adminQ.SoftDeleteMessageFn = func(ctx context.Context, id uuid.UUID) error { return nil }
	h := NewHandler(adminQ, newTestHub(), nil)
	c, w := testutil.NewGinContext(http.MethodDelete, "/api/v1/messages/x", nil, gin.Params{{Key: "id", Value: f.messageID.String()}})
	testutil.SetCurrentUser(c, f.callerID)
	h.DeleteMessage(c)
	if got := testutil.StatusCode(w); got != http.StatusNoContent {
		t.Errorf("non-sender admin DeleteMessage() status = %d, want %d, body=%s", got, http.StatusNoContent, w.Body.String())
	}

	f2 := newFixture()
	memberQ := f2.baseQuerier("member", otherSender)
	h2 := NewHandler(memberQ, newTestHub(), nil)
	c2, w2 := testutil.NewGinContext(http.MethodDelete, "/api/v1/messages/x", nil, gin.Params{{Key: "id", Value: f2.messageID.String()}})
	testutil.SetCurrentUser(c2, f2.callerID)
	h2.DeleteMessage(c2)
	if got := testutil.StatusCode(w2); got != http.StatusForbidden {
		t.Errorf("non-sender member DeleteMessage() status = %d, want %d (unchanged, pre-existing rule), body=%s", got, http.StatusForbidden, w2.Body.String())
	}
}

func TestListMessages_ViewerCanRead(t *testing.T) {
	f := newFixture()
	q := f.baseQuerier("viewer", uuid.Nil)
	q.ListMessagesByProjectFn = func(ctx context.Context, arg sqlc.ListMessagesByProjectParams) ([]sqlc.ListMessagesByProjectRow, error) {
		return nil, nil
	}
	h := NewHandler(q, newTestHub(), nil)

	c, w := testutil.NewGinContext(http.MethodGet, "/api/v1/projects/x/messages", nil, gin.Params{{Key: "id", Value: f.projectID.String()}})
	testutil.SetCurrentUser(c, f.callerID)

	h.ListMessages(c)

	if got := testutil.StatusCode(w); got != http.StatusOK {
		t.Errorf("viewer ListMessages() status = %d, want %d, body=%s", got, http.StatusOK, w.Body.String())
	}
}
