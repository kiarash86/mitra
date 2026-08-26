package handlers

import (
	"github.com/kiarash86/mitra/internal/auth"
	sqlc "github.com/kiarash86/mitra/internal/db/sqlc"
)







type AuthHandler struct {
	queries * sqlc.Queries
	tokens * auth.TokenManager
}



func NewAuthHandler(queries * sqlc.Queries , tokens * auth.TokenManager) *AuthHandler {
	return  &AuthHandler{
		queries: queries,
		tokens: tokens,
	}
}


