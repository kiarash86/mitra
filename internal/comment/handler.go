package comment

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiarash86/mitra/internal/db/sqlc"
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
	//TODO : CREATE COMMENT UNDER A TASK
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
