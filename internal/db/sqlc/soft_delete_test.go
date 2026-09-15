package sqlc

import (
	"strings"
	"testing"
)

// These tests guard against soft-delete regressions in the generated SQL
// query strings. They intentionally do not require a live database: their
// job is to fail loudly if a future hand-edit, or a `sqlc generate` re-run
// from an un-fixed .sql source file, drops the `deleted_at IS NULL` guard
// that keeps soft-deleted rows out of authentication and authorization
// paths.
//
// This is not a substitute for integration tests against a real Postgres
// instance (there is currently no test-database harness in this repo to
// run those against). It is the smallest practical safety net available
// given that constraint.

func assertContainsAll(t *testing.T, name, query string, substrs ...string) {
	t.Helper()
	for _, s := range substrs {
		if !strings.Contains(query, s) {
			t.Errorf("%s: expected query to contain %q, but it did not.\nquery:\n%s", name, s, query)
		}
	}
}

func TestSoftDeleteFilters_Users(t *testing.T) {
	assertContainsAll(t, "GetUserByEmail", getUserByEmail, "WHERE email=$1 AND deleted_at IS NULL")
	assertContainsAll(t, "GetUserByID", getUserByID, "WHERE id=$1 AND deleted_at IS NULL")
	assertContainsAll(t, "ListUsers", listUsers, "WHERE deleted_at IS NULL")
}

func TestSoftDeleteFilters_Projects(t *testing.T) {
	assertContainsAll(t, "GetProjectByID", getProjectByID, "WHERE id = $1 AND deleted_at IS NULL")
	assertContainsAll(t, "ListProjects", listProjects, "WHERE deleted_at IS NULL")
	assertContainsAll(t, "ListProjectsForUser", listProjectsForUser, "AND p.deleted_at IS NULL")
}

func TestSoftDeleteFilters_Tasks(t *testing.T) {
	assertContainsAll(t, "GetTaskByID", getTaskByID, "WHERE id = $1 AND deleted_at IS NULL")
	assertContainsAll(t, "ListTasksByProject", listTasksByProject, "WHERE project_id = $1 AND deleted_at IS NULL")
	assertContainsAll(t, "ListTasksAssignedToUser", listTasksAssignedToUser, "WHERE assigned_to_user_id = $1 AND deleted_at IS NULL")
}

func TestSoftDeleteFilters_Comments(t *testing.T) {
	assertContainsAll(t, "GetCommentByID", getCommentByID, "WHERE id = $1 AND deleted_at IS NULL")
	assertContainsAll(t, "ListCommentsByTask", listCommentsByTask, "WHERE c.task_id= $1 AND c.deleted_at IS NULL")
}

func TestSoftDeleteFilters_Messages(t *testing.T) {
	assertContainsAll(t, "GetMessageByID", getMessageByID, "WHERE id = $1 AND deleted_at IS NULL")
	assertContainsAll(t, "ListMessagesByProject", listMessagesByProject, "AND m.deleted_at IS NULL")
}

func TestSoftDeleteFilters_ProjectMembership(t *testing.T) {
	// A soft-deleted user must not resolve to a valid project role: this is
	// what keeps a deleted account's still-live (pre-expiry) access token,
	// or a stale membership row, from continuing to pass project-scoped
	// authorization checks (rbac.IsProjectMember / IsProjectOwnerOrAdmin).
	assertContainsAll(t, "GetProjectMemberRole", getProjectMemberRole,
		"JOIN users u ON u.id = pm.user_id",
		"AND u.deleted_at IS NULL",
	)
	// A soft-deleted user must not appear in a project's member roster.
	assertContainsAll(t, "ListProjectMembers", listProjectMembers,
		"JOIN users u ON u.id = pm.user_id",
		"AND u.deleted_at IS NULL",
	)
}
