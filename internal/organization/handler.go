package organization

import (
	"errors"
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

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
	var req createOrganizationRequest
	err := c.ShouldBindBodyWithJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}

	if !slugPattern.MatchString(req.Slug) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slug"})
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
	}

	_, err = h.queries.GetOrganizationBySlug(c, req.Slug)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "an organizaiton with this slug is already settled"})
	}

	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check this slug"})
	}

	org, err := h.queries.CreateOrganization(c.Request.Context(), sqlc.CreateOrganizationParams{
		Name: req.Name,
		Slug: req.Slug,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt create organization"})
	}

	_, err = h.queries.AddOrganizationMember(c.Request.Context(), sqlc.AddOrganizationMemberParams{
		OrganizationID: org.ID,
		UserID:         uuid.UUID(userID),
		Role:           "owner",
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "organization created but couldnt add you as owner"})
	}

	//TODO : DELETE ORG IF COULDNT ADD OWNER OR NO? : FUTURE

	c.JSON(http.StatusCreated, organizationResponse{
		ID:        org.ID.String(),
		Name:      org.Name,
		Slug:      org.Slug,
		Role:      "owner",
		CreatedAt: org.CreatedAt,
	})
}

func (h *Handler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")

	if !slugPattern.MatchString(slug) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slug"})
	}

}

func (h *Handler) ListMembers(c *gin.Context) {
	//TODO : LISTING ALL EMPLOYEES
}

func (h *Handler) RemoveMember(c *gin.Context) {
	//TODO : DELETE MEMBERS OF ORGANIZATION
}
