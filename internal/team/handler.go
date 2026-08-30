package team

import (
	"time"

	"github.com/kiarash86/mitra/internal/db/sqlc"
)

// teams (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
//     name VARCHAR(255) NOT NULL,
//     organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
//     created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
//     updated_at TIMESTAMPTZ NOT NULL DEFAULT now (),
//     deleted_at TIMESTAMPTZ

type Handler struct {
	queries *sqlc.Queries
}

func NewHandler(queries *sqlc.Queries) *Handler {
	return &Handler{
		queries: queries,
	}
}

type createTeamRequest struct {
	Name string `json:"name" binding:"required,min=2,max=255"`
}

type teamResponse struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	OrganizationID string    `json:"organization_id"`
	CreatedAt      time.Time `json:"created_at"`
}
