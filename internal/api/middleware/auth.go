package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/kiarash86/mitra/internal/auth"
)

const ContextUserIDKey = "user_id"

func RequireAuth(tokens *auth.TokenManager) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		header := ctx.GetHeader("Authorization")
		if header == "" {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
			return
		}
		slice := strings.SplitN(header, " ", 2)
		if len(slice) != 2 || !strings.EqualFold(slice[0], "Bearer") {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
			return
		}

		claims, err := tokens.ParseAccessToken(slice[1])
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})

			return
		}

		ctx.Set(ContextUserIDKey, claims.UserID)

	}
}
