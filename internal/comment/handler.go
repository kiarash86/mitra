package comment

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
)

type Handler struct {
	queries *sqlc.Queries
}

func NewHandler(queries *sqlc.Queries) *Handler {
	return &Handler{}
}

type createCommentRequest struct {
	Body string `json:"body" binding:"required,min=1,max=10000"`
}

type updateCommentRequest struct {
	Body string `json:"body" binding:"required,min=1,max=10000"`
}

type commentResponse struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"task_id"`
	AuthorID  string    `json:"author_id"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (h *Handler) Create(c *gin.Context) {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}
	var req createCommentRequest
	err = c.ShouldBindBodyWithJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
		return
	}
}

func (h *Handler) ListByTask(c *gin.Context) {
	//TODO : LIST OF COMMENTS UNDER TASK
}

func (h *Handler) Update(c *gin.Context) {
	//TODO : EDIT COMMENT
}

func (h *Handler) Delete(c *gin.Context) {
	//TODO : SOFT DELETE COMMENT
}
