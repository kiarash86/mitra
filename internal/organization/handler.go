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
		return
	}

	if !slugPattern.MatchString(req.Slug) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slug"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
		return
	}

	_, err = h.queries.GetOrganizationBySlug(c, req.Slug)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "an organizaiton with this slug is already settled"})
		return
	}

	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check this slug"})
		return
	}

	org, err := h.queries.CreateOrganization(c.Request.Context(), sqlc.CreateOrganizationParams{
		Name: req.Name,
		Slug: req.Slug,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt create organization"})
		return
	}

	_, err = h.queries.AddOrganizationMember(c.Request.Context(), sqlc.AddOrganizationMemberParams{
		OrganizationID: org.ID,
		UserID:         uuid.UUID(userID),
		Role:           "owner",
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "organization created but couldnt add you as owner"})
		return
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
		return
	}
	org, err := h.queries.GetOrganizationBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get organization by slug"})
		return
	}

	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "couldnt find organization with this slug"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "something went wrong with user authorization"})
		return
	}

	role, err := h.queries.GetOrganizationMemberRole(c.Request.Context(), sqlc.GetOrganizationMemberRoleParams{
		OrganizationID: org.ID,
		UserID:         uuid.UUID(userID),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "in the process we have a problem"})
		return
	}

	c.JSON(http.StatusFound, organizationResponse{
		ID:        org.ID.String(),
		Name:      org.Name,
		Slug:      org.Slug,
		Role:      role,
		CreatedAt: org.CreatedAt,
	})
}

func (h *Handler) ListMembers(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type of id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized id or something like that"})
		return
	}

	_, err = h.queries.GetOrganizationMemberRole(c.Request.Context(), sqlc.GetOrganizationMemberRoleParams{
		OrganizationID: id,
		UserID:         uuid.UUID(userID),
	})
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not member of this organization or you dont have permission"})
		return
	}

	list, err := h.queries.ListOrganizationMembers(c.Request.Context(), id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt list members of this organization"})
		return
	}
	members := make([]organizationMemberResponse, 0, len(list))
	for _, l := range list {
		members = append(members, organizationMemberResponse{
			UserID:    l.UserID.String(),
			FullName:  l.FullName,
			Email:     l.Email,
			Role:      l.Role,
			CreatedAt: l.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"members": members})

}

func (h *Handler) RemoveMember(c *gin.Context) {
	//TODO : DELETE MEMBERS OF ORGANIZATION
}
