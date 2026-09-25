package chat

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/gin-gonic/gin"

	"github.com/kiarash86/mitra/internal/auth"
	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
	"github.com/kiarash86/mitra/internal/rbac"
)

type Handler struct {
	queries sqlc.Querier
	hub     *Hub
	tokens  *auth.TokenManager
}

type UpdateMessageRequest struct {
	Body string `json:"body" binding:"required"`
}

func NewHandler(queries sqlc.Querier, hub *Hub, tokens *auth.TokenManager) *Handler {
	return &Handler{queries: queries, hub: hub, tokens: tokens}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // TODO: restrict this to known origins in production
	},
}

func (h *Handler) ListMessages(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	isMember, err := rbac.IsProjectMember(c.Request.Context(), h.queries, projectID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check project membership"})
		return
	}
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this project"})
		return
	}

	limitStr := c.DefaultQuery("limit", "50")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	beforeStr := c.Query("before")

	var before pgtype.Timestamptz
	if beforeStr != "" {
		parsed, err := time.Parse(time.RFC3339, beforeStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid before timestamp"})
			return
		}
		before = pgtype.Timestamptz{Time: parsed, Valid: true}
	}

	messages, err := h.queries.ListMessagesByProject(c.Request.Context(), sqlc.ListMessagesByProjectParams{
		ProjectID: projectID,
		Before:    before,
		Limit:     int32(limit),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt list messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})

}

func (h *Handler) UpdateMessage(c *gin.Context) {
	messageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid message id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	var req UpdateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	body, err := SanitizeMessageBody(req.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg, err := h.queries.GetMessageByID(c.Request.Context(), messageID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldn't get message"})
		return
	}

	if msg.SenderID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only edit your own messages"})
		return
	}

	isMember, err := rbac.CanWriteProject(c.Request.Context(), h.queries, msg.ProjectID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check project membership"})
		return
	}
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "you dont have permission to modify this project"})
		return
	}

	message, err := h.queries.UpdateMessage(c.Request.Context(), sqlc.UpdateMessageParams{
		ID:   msg.ID,
		Body: body,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldn't update message"})
		return
	}

	event := OutboundEvent{
		Type: "message.updated",
		Payload: MessagePayload{
			ID:        message.ID,
			ProjectID: message.ProjectID,
			SenderID:  message.SenderID,
			Body:      message.Body,
			CreatedAt: message.CreatedAt,
		},
	}
	if data, err := json.Marshal(event); err == nil {
		h.hub.Broadcast(message.ProjectID, data)
	}

	c.JSON(http.StatusOK, gin.H{"message": message})
}

func (h *Handler) DeleteMessage(c *gin.Context) {
	messageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid message id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	message, err := h.queries.GetMessageByID(c.Request.Context(), messageID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldn't get message"})
		return
	}

	if message.SenderID != userID {
		isAdmin, err := rbac.IsProjectOwnerOrAdmin(c.Request.Context(), h.queries, message.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "couldn't get message"})
			return
		}
		if !isAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "you can only edit your own messages"})
			return
		}
	} else {
		canWrite, err := rbac.CanWriteProject(c.Request.Context(), h.queries, message.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "couldn't get message"})
			return
		}
		if !canWrite {
			c.JSON(http.StatusForbidden, gin.H{"error": "you dont have permission to modify this project"})
			return
		}
	}

	if err := h.queries.SoftDeleteMessage(c.Request.Context(), message.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt delete message"})
		return
	}

	event := OutboundEvent{
		Type:    "message.deleted",
		Payload: DeletedMessagePayload{ID: message.ID},
	}

	if data, err := json.Marshal(event); err == nil {
		h.hub.Broadcast(message.ProjectID, data)
	}

	c.Status(http.StatusNoContent)
}

func (h *Handler) ServeWS(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
		return
	}

	claims, err := h.tokens.ParseAccessToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}
	userID := claims.UserID

	isMember, err := rbac.IsProjectMember(c.Request.Context(), h.queries, projectID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldn't check project membership"})
		return
	}
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this project"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("websocket upgrade failed:", err)
		return
	}

	client := NewClient(h.hub, conn, userID, projectID)
	h.hub.Register(client)

	go client.WritePump()
	client.ReadPump(h.queries)
}
