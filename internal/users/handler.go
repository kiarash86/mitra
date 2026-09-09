package users

import (

	"github.com/kiarash86/mitra/internal/db/sqlc"

)

type Handler struct {
	queries *sqlc.Queries
}

func NewHandler(queries *sqlc.Queries) *Handler {
	return &Handler{
		queries: queries,
	}
}

type createUserRequest struct {
	Email    string `json:"email" binding:"required,email"`
	FullName string `json:"full_name" binding:"required,min=2,max=255"`
	Role     string `json:"role" binding:"required,oneof=owner admin member viewer"`
}

