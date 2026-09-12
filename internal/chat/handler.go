package chat

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"

	"github.com/gin-gonic/gin"

	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
	"github.com/kiarash86/mitra/internal/rbac"
)

// Handler exposes the REST endpoints for chat message history.
// Real-time delivery/broadcast is handled separately by Hub/Client (see hub.go, client.go).
type Handler struct {
	queries *sqlc.Queries
	hub     *Hub
}

func NewHandler(queries *sqlc.Queries, hub *Hub) *Handler {
	return &Handler{queries: queries, hub: hub}
}

// ListMessages handles GET /api/v1/projects/:id/messages
// Query params: before (RFC3339 timestamp, optional), limit (optional, default/max enforced server-side).
// Requires the caller to be a project member (rbac.IsProjectMember), same as comment.Handler.ListByTask.
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

	var before time.Time
	if beforeStr != "" {
		before, err = time.Parse(time.RFC3339, beforeStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid before timestamp"})
			return
		}
	}

	messages, err := h.queries.ListMessagesByProject(c.Request.Context(), sqlc.ListMessagesByProjectParams{
		ProjectID: projectID,
		Column2:   before,
		Limit:     int32(limit),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt list messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"msg": messages})

}

// UpdateMessage handles PATCH /api/v1/messages/:id
// Only the original sender may edit their own message (check message.SenderID == current user).
func (h *Handler) UpdateMessage(c *gin.Context) {
	messageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid message id"})
		return
	}
	// TODO: bind request body { body string }
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}
	// TODO: h.queries.GetMessageByID(...) to check ownership
	// TODO: h.queries.UpdateMessage(...)
	// TODO: broadcast the edit to the room via h.hub, c.JSON(...)
}

// DeleteMessage handles DELETE /api/v1/messages/:id
// Soft-delete only; sender or project owner/admin may delete.
func (h *Handler) DeleteMessage(c *gin.Context) {
	// TODO: parse message id from c.Param("id")
	// TODO: get current user id
	// TODO: h.queries.GetMessageByID(...) to check ownership
	// TODO: rbac.IsProjectOwnerOrAdmin fallback if not the sender
	// TODO: h.queries.SoftDeleteMessage(...)
	// TODO: broadcast the deletion to the room via h.hub, c.JSON(...)
}

// ServeWS handles GET /ws/projects/:id/chat — upgrades the HTTP connection to a WebSocket
// and registers the client with the Hub for that project's room.
// Auth note: WebSocket requests can't send an Authorization header, so the access token
// must be read from a query param (?token=...) instead of middleware.RequireAuth.
func (h *Handler) ServeWS(c *gin.Context) {
	// TODO: parse project id from c.Param("id")
	// TODO: read token from c.Query("token"), validate via auth.TokenManager
	// TODO: rbac.IsProjectMember check before upgrading
	// TODO: upgrader.Upgrade(c.Writer, c.Request, nil)
	// TODO: construct *Client, h.hub.Register(client)
	// TODO: go client.ReadPump(h.queries), go client.WritePump()
}
