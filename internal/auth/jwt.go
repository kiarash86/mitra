package auth

import (
	"time"
	"uuid"

	"github.com/golang-jwt/jwt/v5"
)


type TokenManager struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	TokenType string    `json:"token_type"` // "access" | "refresh"
	jwt.RegisteredClaims
}