package organization

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
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

type createOrganizationRequest struct {
	Name string `json:"name" binding:"required,min=2,max=255"`
	Slug string `json:"slug" binding:"required,min=2,max=255"`
}

type organizationResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Role      string    `json:"role,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type organizationMemberResponse struct {
	UserID    string    `json:"user_id"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *Handler) Create(c *gin.Context) {
	//TODO : CREATE NEW ORGANIZATION
}

func (h *Handler) GetBySlug(c *gin.Context) {
	//TODO : GET BY BACKED NAME NOT FRONT ONE
}

func (h *Handler) ListMembers(c *gin.Context) {
	//TODO : LISTING ALL EMPLOYEES
}

func (h *Handler) RemoveMember(c *gin.Context) {
	//TODO : DELETE MEMBERS OF ORGANIZATION
}
