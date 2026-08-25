package auth

import (
	"errors"
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

func NewTokenManager(secret string, accessTTL time.Duration, refreshTTL time.Duration) *TokenManager {
	return &TokenManager{
		secret:     []byte(secret),
		accessTTL:  accessTTL,
		refreshTTL: refreshTTL,
	}
}

func (tm *TokenManager) generate(userID uuid.UUID, tokenType string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:    userID,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(tm.secret)
}

func (tm *TokenManager) GenerateRefreshToken(userID uuid.UUID, tokenType string, ttl time.Duration) (string, error) {
	return tm.generate(userID, TokenTypeRefresh, ttl)
}

func (tm *TokenManager) GenerateAccessToken(userID uuid.UUID, tokenType string, ttl time.Duration) (string, error) {
	return tm.generate(userID, TokenTypeAccess, ttl)

}

func (tm *TokenManager) Parse(tokenS string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenS, claims, func(t *jwt.Token) (interface{}, error) {
		_, ok := t.Method.(*jwt.SigningMethodHMAC)
		if ok {
			return tm.secret, nil
		}
		return nil, errors.New("JWT: invalid or expired token")
	})
	if err != nil || !token.Valid {
		return nil, errors.New("JWT: invalid or expired token")
	}
	return claims, nil
}



func (tm *TokenManager) ParseAccessToken(tokenS string) (*Claims, error) {
	claims , err := tm.Parse(tokenS)
	if err != nil {
		return nil, err
	}

	if claims.TokenType == TokenTypeRefresh {
		return  nil , errors.New("JWT: not correct type of token")
	}

	return claims , nil
}