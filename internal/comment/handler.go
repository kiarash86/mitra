package comment

import "github.com/kiarash86/mitra/internal/db/sqlc"

type Handler struct {
	queries *sqlc.Queries
}

func NewHandler(queries *sqlc.Queries) *Handler {
	return &Handler{}
}

type createCommentRequest struct {
	Body string `json:"body" binding:"required,min=1,max=10000"`
}
