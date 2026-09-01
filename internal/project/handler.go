package project

import (
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/gin-gonic/gin"
	"github.com/kiarash86/mitra/internal/convert"
	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
	"github.com/kiarash86/mitra/internal/rbac"
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

	isAdminOrOwner, err := rbac.IsOrganizationOwnerOrAdmin(c.Request.Context(), h.queries, organizationID, uuid.UUID(userID))
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not member of this organization"})
		return
	}

	if !isAdminOrOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "you dont have enough permission for this process"})

		return
	}

	project, err := h.queries.CreateProject(c.Request.Context(), sqlc.CreateProjectParams{
		OrganizationID: organizationID,
		Name:           req.Name,
		Description:    convert.StringToText(req.Description),
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
		Description:    convert.TextToString(project.Description),
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

	isMemberOfOrganization, err := rbac.IsOrganizationMember(c.Request.Context(), h.queries, organizationID, uuid.UUID(userID))

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "couldnt check your role"})
		return
	}
	if !isMemberOfOrganization {
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

	isMemberOfOrganization, err := rbac.IsOrganizationMember(c.Request.Context(), h.queries, project.OrganizationID, uuid.UUID(userID))

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "couldnt check your role"})
		return
	}
	if !isMemberOfOrganization {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not member of this organization"})
		return
	}

	c.JSON(http.StatusOK, project)

}

func (h *Handler) Update(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	var req updateProjectRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	isProjectAdminOwner, err := rbac.IsProjectOwnerOrAdmin(c.Request.Context(), h.queries, project.ID, uuid.UUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
	}

	isOrgAdmin, err := rbac.IsOrganizationOwnerOrAdmin(c.Request.Context(), h.queries, project.OrganizationID, uuid.UUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your organization role"})
	}
	if !isOrgAdmin && !isProjectAdminOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "only a project owner/admin or an organization owner/admin can do this"})
	}

	updatedProject, err := h.queries.UpdateProject(c.Request.Context(), sqlc.UpdateProjectParams{
		ID:          projectID,
		Name:        req.Name,
		Description: convert.StringToText(req.Description),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt update project"})
		return
	}

	c.JSON(http.StatusOK, projectResponse{
		ID:             updatedProject.ID.String(),
		OrganizationID: updatedProject.OrganizationID.String(),
		Name:           updatedProject.Name,
		Description:    convert.TextToString(updatedProject.Description),
		CreatedAt:      updatedProject.CreatedAt})

}

func (h *Handler) Delete(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type of projectID"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized id or something like that"})
		return
	}
	project, err := h.queries.GetProjectByID(c.Request.Context(), projectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	isProjectAdminOwner, err := rbac.IsProjectOwnerOrAdmin(c.Request.Context(), h.queries, project.ID, uuid.UUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
	}

	isOrgAdmin, err := rbac.IsOrganizationOwnerOrAdmin(c.Request.Context(), h.queries, project.OrganizationID, uuid.UUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your organization role"})
	}
	if !isOrgAdmin && !isProjectAdminOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "only a project owner/admin or an organization owner/admin can do this"})
	}

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

	isMemberOfOrganization, err := rbac.IsOrganizationMember(c.Request.Context(), h.queries, project.OrganizationID, uuid.UUID(userID))

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "couldnt check your role"})
		return
	}
	if !isMemberOfOrganization {
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
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type of projectID"})
		return
	}

	var req addProjectMemberRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	targetID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized id or something like that"})
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

	isProjectAdminOwner, err := rbac.IsProjectOwnerOrAdmin(c.Request.Context(), h.queries, project.ID, uuid.UUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
	}

	isOrgAdmin, err := rbac.IsOrganizationOwnerOrAdmin(c.Request.Context(), h.queries, project.OrganizationID, uuid.UUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your organization role"})
	}
	if !isOrgAdmin && !isProjectAdminOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "only a project owner/admin or an organization owner/admin can do this"})
	}

	member, err := h.queries.AddProjectMember(c.Request.Context(), sqlc.AddProjectMemberParams{
		ProjectID: projectID,
		UserID:    targetID,
		Role:      req.Role,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt add member"})
		return
	}

	c.JSON(http.StatusCreated, projectMemberResponse{
		UserID:    member.UserID.String(),
		Role:      member.Role,
		CreatedAt: member.CreatedAt,
	})
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

	project, err := h.queries.GetProjectByID(c.Request.Context(), projectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	isProjectAdminOwner, err := rbac.IsProjectOwnerOrAdmin(c.Request.Context(), h.queries, projectID, uuid.UUID(requesterID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
	}

	isOrgAdmin, err := rbac.IsOrganizationOwnerOrAdmin(c.Request.Context(), h.queries, project.OrganizationID, uuid.UUID(requesterID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your organization role"})
	}
	if !isOrgAdmin && !isProjectAdminOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "only a project owner/admin or an organization owner/admin can do this"})
	}
	if targetID == uuid.UUID(requesterID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you cant remove yourself"})
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
