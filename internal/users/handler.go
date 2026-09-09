package users

import (

	"time"

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

type updateMeRequest struct {
	FullName string `json:"full_name" binding:"required,min=2,max=255"`
}

type userResponse struct {
	ID                 string    `json:"id"`
	FullName           string    `json:"full_name"`
	Email              string    `json:"email"`
	Role               string    `json:"role"`
	MustChangePassword bool      `json:"must_change_password"`
	CreatedAt          time.Time `json:"created_at"`
}

type createUserResponse struct {
	UserID       string `json:"user_id"`
	Email        string `json:"email"`
	FullName     string `json:"full_name"`
	Role         string `json:"role"`
	TempPassword string `json:"temp_password"`
}

func toUserResponse(u sqlc.User) userResponse {
	return userResponse{
		ID:                 u.ID.String(),
		FullName:           u.FullName,
		Email:              u.Email,
		Role:               u.Role,
		MustChangePassword: u.MustChangePassword,
		CreatedAt:          u.CreatedAt,
	}
}

