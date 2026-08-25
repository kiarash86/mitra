package auth

import (
	"time"
	"uuid"

	"github.com/golang-jwt/jwt/v5"
)

const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)
type TokenManager struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	TokenType string    `json:"token_type"`
	jwt.RegisteredClaims
}


func NewTokenManager(secret string , accessTTL time.Duration , refreshTTL time.Duration) *TokenManager {
	return &TokenManager{
		secret: []byte(secret),
		accessTTL: accessTTL,
		refreshTTL: refreshTTL,
	}
}