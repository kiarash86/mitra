package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const ContextUserIDKey = "user_id"

func CurrentUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get(ContextUserIDKey)
	if !exists {
		return uuid.UUID{}, false
	}
	userID, ok := val.(uuid.UUID)
	return userID, ok
}
