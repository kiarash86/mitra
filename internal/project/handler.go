package project

import (
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/gin-gonic/gin"
	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
)

type Handler struct {
	queries *sqlc.Queries
}

func NewHandler(queries *sqlc.Queries) *Handler {
	return &Handler{
		queries: queries,
	}
}

type createProjectRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=255"`
	Description string `json:"description" binding:"max=10000"`
}

type updateProjectRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=255"`
	Description string `json:"description" binding:"max=10000"`
}

type addProjectMemberRequest struct {
	UserID string `json:"user_id" binding:"required,uuid"`
	Role   string `json:"role" binding:"required,min=2,max=50"`
}
type projectResponse struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organization_id"`
	Name           string    `json:"name"`
	Description    string    `json:"description,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type projectMemberResponse struct {
	UserID    string    `json:"user_id"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *Handler) Create(c *gin.Context) {

	organizationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organizatinID type"})
	}

	var req createProjectRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
		return
	}

	requesterRole, err := h.queries.GetOrganizationMemberRole(c.Request.Context(), sqlc.GetOrganizationMemberRoleParams{
		OrganizationID: uuid.UUID(organizationID),
		UserID:         uuid.UUID(userID),
	})
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not member of this organization"})
		return
	}

	if requesterRole != "admin" && requesterRole != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "you dont have enough permission for this process"})

		return
	}

	project, err := h.queries.CreateProject(c.Request.Context(), sqlc.CreateProjectParams{
		OrganizationID: organizationID,
		Name:           req.Name,
		Description:    req.Description,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt create project"})
		return
	}

	_, err = h.queries.AddProjectMember(c.Request.Context(), sqlc.AddProjectMemberParams{
		ProjectID: project.ID,
		UserID:    uuid.UUID(userID),
		Role:      "owner",
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "project created but i couldnt add u as owner"})
		return
	}

	c.JSON(http.StatusCreated, projectResponse{
		ID:             project.ID.String(),
		OrganizationID: project.OrganizationID.String(),
		Name:           project.Name,
		Description:    project.Description,
		CreatedAt:      project.CreatedAt,
	})

}

func (h *Handler) ListByOrganization(c *gin.Context) {
	organizationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organizatinID type"})
	}
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
		return
	}

	_, err = h.queries.GetOrganizationMemberRole(c.Request.Context(), sqlc.GetOrganizationMemberRoleParams{
		OrganizationID: uuid.UUID(organizationID),
		UserID:         uuid.UUID(userID),
	})
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not member of this organization"})
		return
	}

	list, err := h.queries.ListProjectsByOrganization(c.Request.Context(), organizationID)

	projects := make([]projectResponse, 0, len(list))
	for _, project := range list {
		projects = append(projects, projectResponse{
			ID:             project.ID.String(),
			OrganizationID: project.OrganizationID.String(),
			Name:           project.Name,
			Description:    project.Description.String,
			CreatedAt:      project.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"projects": projects})

}

func (h *Handler) GetByID(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
		return
	}
	project, err := h.queries.GetProjectByID(c.Request.Context(), projectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	_, err = h.queries.GetOrganizationMemberRole(c.Request.Context(), sqlc.GetOrganizationMemberRoleParams{
		OrganizationID: project.OrganizationID,
		UserID:         uuid.UUID(userID),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not member of this organization"})
		return
	}
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not member of this organization"})
		return
	}

	c.JSON(http.StatusOK, project)

}

func (h *Handler) Update(c *gin.Context) {
	// TODO : UPDATE PROJECT INFO
}

func (h *Handler) Delete(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type of projectID"})
		return
	}

	requesterID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized id or something like that"})
		return
	}
	project, err := ph.queries.GetProjectByID(c.Request.Context(), projectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	//TODO : CHECK WHO IS IT?
	if err := h.queries.SoftDeleteProject(c.Request.Context(), projectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt delete project"})
		return
	}

	c.Status(http.StatusNoContent)
}
func (h *Handler) ListMembers(c *gin.Context) {
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

	project, err := h.queries.GetProjectByID(c.Request.Context(), projectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project wasnt there"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	_, err = h.queries.GetOrganizationMemberRole(c.Request.Context(), sqlc.GetOrganizationMemberRoleParams{
		OrganizationID: project.OrganizationID,
		UserID:         uuid.UUID(userID),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not member of this organization"})
		return
	}
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not member of this organization"})
		return
	}

	list, err := h.queries.ListProjectMembers(c.Request.Context(), projectID)

	projectMembers := make([]projectMemberResponse, 0, len(list))
	for _, member := range list {
		projectMembers = append(projectMembers, projectMemberResponse{
			UserID:    member.UserID.String(),
			FullName:  member.FullName,
			Email:     member.Email,
			Role:      member.Role,
			CreatedAt: member.CreatedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{"members": projectMembers})

}

func (h *Handler) AddMember(c *gin.Context) {
	//TODO : ADD MEMBER TO PROJECT
}

func (h *Handler) RemoveMember(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type of projectID"})
		return
	}

	targetID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type of user_id"})
		return
	}

	requesterID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized id or something like that"})
		return
	}

	requesterRole, err := h.queries.GetProjectMemberRole(c.Request.Context(), sqlc.GetProjectMemberRoleParams{
		ProjectID: projectID,
		UserID:    uuid.UUID(requesterID),
	})
	if err != nil || (requesterRole != "lead" && requesterRole != "admin") {
		c.JSON(http.StatusForbidden, gin.H{"error": "only an owner or admin can remove members"})
		return
	}

	if targetID == uuid.UUID(requesterID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you cant remove yourself"})
		return
	}

	targetRole, err := h.queries.GetProjectMemberRole(c.Request.Context(), sqlc.GetProjectMemberRoleParams{
		ProjectID: projectID,
		UserID:    targetID,
	})
	if err == nil && targetRole == "owner" && requesterRole != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only an owner can remove another owner"})
		return
	}

	err = h.queries.RemoveProjectMember(c.Request.Context(), sqlc.RemoveProjectMemberParams{
		ProjectID: projectID,
		UserID:    targetID,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt remove member"})
		return
	}
	c.Status(http.StatusNoContent)

}
