package rbac

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/testutil"
)

// fakeQueriesWithRole returns a FakeQuerier whose GetProjectMemberRole
// always answers with the given role (or pgx.ErrNoRows if role is "").
func fakeQueriesWithRole(role string) *testutil.FakeQuerier {
	return &testutil.FakeQuerier{
		GetProjectMemberRoleFn: func(ctx context.Context, arg sqlc.GetProjectMemberRoleParams) (string, error) {
			if role == "" {
				return "", pgx.ErrNoRows
			}
			return role, nil
		},
	}
}

func TestCanWriteProject(t *testing.T) {
	projectID := uuid.New()
	userID := uuid.New()

	tests := []struct {
		name      string
		role      string // "" means: not a project member at all
		wantWrite bool
	}{
		{"owner can write", "owner", true},
		{"admin can write", "admin", true},
		{"member can write", "member", true},
		{"viewer cannot write", "viewer", false},
		{"non-member cannot write", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := fakeQueriesWithRole(tt.role)
			got, err := CanWriteProject(context.Background(), q, projectID, userID)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.wantWrite {
				t.Errorf("CanWriteProject() with role %q = %v, want %v", tt.role, got, tt.wantWrite)
			}
		})
	}
}

func TestCanWriteProject_PropagatesUnexpectedError(t *testing.T) {
	projectID := uuid.New()
	userID := uuid.New()
	boom := errors.New("boom")

	q := &testutil.FakeQuerier{
		GetProjectMemberRoleFn: func(ctx context.Context, arg sqlc.GetProjectMemberRoleParams) (string, error) {
			return "", boom
		},
	}

	_, err := CanWriteProject(context.Background(), q, projectID, userID)
	if !errors.Is(err, boom) {
		t.Fatalf("expected the underlying error to propagate, got %v", err)
	}
}

// TestIsProjectMember_TreatsViewerAsMember documents, deliberately, the
// existing (and intentionally unchanged) behavior of IsProjectMember: it
// answers "is this a project member at all", not "can this role write".
// This is why every mutating handler must use CanWriteProject instead —
// see the handler-level tests in internal/task, internal/comment and
// internal/chat for the actual viewer-cannot-mutate regression coverage.
func TestIsProjectMember_TreatsViewerAsMember(t *testing.T) {
	projectID := uuid.New()
	userID := uuid.New()
	q := fakeQueriesWithRole("viewer")

	isMember, err := IsProjectMember(context.Background(), q, projectID, userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !isMember {
		t.Fatalf("IsProjectMember should still return true for a viewer (read-access gate); got false")
	}
}
