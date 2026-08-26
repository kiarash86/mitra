package handlers

import (
	"github.com/kiarash86/mitra/internal/auth"
	sqlc "github.com/kiarash86/mitra/internal/db/sqlc"
)

type AuthHandler struct {
	queries *sqlc.Queries
	tokens  *auth.TokenManager
}

type registerRequest struct {
	FullName string `json:"full_name" binding:"required,min=2,max=255"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type userResponse struct {
	ID       string `json:"id"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
}

type authResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         userResponse `json:"user"`
}

func NewAuthHandler(queries *sqlc.Queries, tokens *auth.TokenManager) *AuthHandler {
	return &AuthHandler{
		queries: queries,
		tokens:  tokens,
	}
}
