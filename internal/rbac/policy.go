package rbac

import (
	"context"

	"github.com/google/uuid"
	"github.com/kiarash86/mitra/internal/db/sqlc"
)

func IsOrganizationMember(ctx context.Context, queries *sqlc.Queries, orgID, userID uuid.UUID) (bool, error) {
	//TODO : IS ORGANIZATION MEMBER?
}

func IsOrganizationOwnerOrAdmin(ctx context.Context, queries *sqlc.Queries, orgID, userID uuid.UUID) (bool, error) {
	//TODO : IS OWNER OR ADMIN OF THIS ORGANIZATION?
}

func IsProjectMember(ctx context.Context, queries *sqlc.Queries, projectID, userID uuid.UUID) (bool, error) {
	//TODO : IS THIS USER ONE OF THE PROJECT MEMBERS?
}

func IsProjectOwnerOrAdmin(ctx context.Context, queries *sqlc.Queries, projectID, userID uuid.UUID) (bool, error) {
	//TODO : IS OWNER OR ADMIN OF THIS PROJECT?
}

func IsTeamMember(ctx context.Context, queries *sqlc.Queries, teamID, userID uuid.UUID) (bool, error) {
	//TODO : IS THIS USER ONE OF THIS THE TEAM MEMBERS?
}

func IsTeamLeader(ctx context.Context, queries *sqlc.Queries, teamID, userID uuid.UUID) (bool, error) {
	//TODO : IS THIS USER TEAM LEADER OF THIS TEAM?
}
