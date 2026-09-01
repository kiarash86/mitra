package comment

import "github.com/kiarash86/mitra/internal/db/sqlc"

type Handler struct {
	queries *sqlc.Queries
}

func NewHandler(queries *sqlc.Queries) *Handler {
	return &Handler{}
}
