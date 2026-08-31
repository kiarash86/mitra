package task

import (
	"time"

	"github.com/kiarash86/mitra/internal/db/sqlc"
)

type Handler struct {
	queries *sqlc.Queries
}

func NewHandler(queries *sqlc.Queries) *Handler {
	return &Handler{
		queries: queries,
	}
}

type createTaskRequest struct {
	Title       string     `json:"title" binding:"required,min=2,max=255"`
	Description string     `json:"description" binding:"max=10000"`
	Priority    string     `json:"priority"`
	DueDate     *time.Time `json:"due_date"`
}
