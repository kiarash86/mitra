package rbac

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kiarash86/mitra/internal/db/sqlc"
)

func GetUserRole(ctx context.Context, queries *sqlc.Queries, userID uuid.UUID) (string, error) {
	user, err := queries.GetUserByID(ctx, userID)
	if err != nil {
		return "", err
	}
	return user.Role, nil
}

func IsOwnerOrAdmin(ctx context.Context, queries *sqlc.Queries, userID uuid.UUID) (bool, error) {
	role, err := GetUserRole(ctx, queries, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	return role == "owner" || role == "admin", nil
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
	role, err := queries.GetProjectMemberRole(ctx, sqlc.GetProjectMemberRoleParams{
		ProjectID: projectID,
		UserID:    userID,
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
