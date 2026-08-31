package rbac

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kiarash86/mitra/internal/db/sqlc"
)

func IsOrganizationMember(ctx context.Context, queries *sqlc.Queries, orgID, userID uuid.UUID) (bool, error) {

	_, err := queries.GetOrganizationMemberRole(ctx, sqlc.GetOrganizationMemberRoleParams{
		OrganizationID: orgID,
		UserID:         userID,
	})

	if err == nil {
		return true, nil
	}

	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}

	return false, err
}

func IsOrganizationOwnerOrAdmin(ctx context.Context, queries *sqlc.Queries, orgID, userID uuid.UUID) (bool, error) {

	role, err := queries.GetOrganizationMemberRole(ctx, sqlc.GetOrganizationMemberRoleParams{
		OrganizationID: orgID,
		UserID:         userID,
	})

	if err != nil {

		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	if role == "owner" || role == "admin" {
		return true, nil
	}
	return false, nil
}

func IsProjectMember(ctx context.Context, queries *sqlc.Queries, projectID, userID uuid.UUID) (bool, error) {
	_, err := queries.GetProjectMemberRole(ctx, sqlc.GetProjectMemberRoleParams{
		ProjectID: projectID,
		UserID:    userID,
	})

	if err == nil {
		return true, nil
	}

	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}

	return false, err
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
