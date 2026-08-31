package team

import (
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/gin-gonic/gin"
	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
	// "github.com/kiarash86/mitra/internal/team"
)

// teams (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
//     name VARCHAR(255) NOT NULL,
//     organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
//     created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
//     updated_at TIMESTAMPTZ NOT NULL DEFAULT now (),
//     deleted_at TIMESTAMPTZ

// CREATE TABLE
//
//	team_members (
//	    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
//	    team_id UUID NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
//	    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
//	    role VARCHAR(50) NOT NULL DEFAULT 'member',
//	    created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
//	    UNIQUE (team_id, user_id)
//	);
type Handler struct {
	queries *sqlc.Queries
}

func NewHandler(queries *sqlc.Queries) *Handler {
	return &Handler{
		queries: queries,
	}
}

type createTeamRequest struct {
	Name string `json:"name" binding:"required,min=2,max=255"`
}

type teamResponse struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	OrganizationID string    `json:"organization_id"`
	CreatedAt      time.Time `json:"created_at"`
}

type teamMemberResponse struct {
	UserID    string    `json:"user_id"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}
type addTeamMemberRequest struct {
	UserID string `json:"user_id" binding:"required,uuid"`
	Role   string `json:"role" binding:"required,min=2,max=50"`
}

func (h *Handler) Create(c *gin.Context) {
	var req createTeamRequest
	err := c.ShouldBindBodyWithJSON(&req)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "couldnt get req body"})
		return
	}

	organizationID, err := uuid.Parse(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization went wrong"})
		return
	}

	requesterRole, err := h.queries.GetOrganizationMemberRole(c.Request.Context(), sqlc.GetOrganizationMemberRoleParams{
		OrganizationID: organizationID,
		UserID:         uuid.UUID(userID),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get your role"})
		return
	}
	if requesterRole != "owner" && requesterRole != "admin" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "you dont have enough permision for creating teams"})
		return
	}

	team, err := h.queries.CreateTeam(c.Request.Context(), sqlc.CreateTeamParams{
		OrganizationID: organizationID,
		Name:           req.Name,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt create team"})
		return
	}

	_, err = h.queries.AddTeamMember(c.Request.Context(), sqlc.AddTeamMemberParams{
		TeamID: team.ID,

		UserID: uuid.UUID(userID),
		Role:   "lead"})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "team created but couldnt add you to team"})
		return
	}

	c.JSON(http.StatusCreated, teamResponse{
		ID:             team.ID.String(),
		Name:           team.Name,
		OrganizationID: team.OrganizationID.String(),
		CreatedAt:      team.CreatedAt,
	})
}

func (h *Handler) ListByOrganization(c *gin.Context) {
	organizationID, err := uuid.Parse(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid organization id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization went wrong"})
		return
	}

	_, err = h.queries.GetOrganizationMemberRole(c.Request.Context(), sqlc.GetOrganizationMemberRoleParams{
		OrganizationID: organizationID,
		UserID:         uuid.UUID(userID),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get your role"})
		return
	}
	//NOTE : should add if for requesterRole== nil or no?

	list, err := h.queries.ListTeamsByOrganization(c.Request.Context(), organizationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get list of teams"})
		return
	}
	teams := make([]teamResponse, 0, len(list))
	for _, team := range list {
		teams = append(teams, teamResponse{
			ID:             team.ID.String(),
			Name:           team.Name,
			OrganizationID: team.OrganizationID.String(),
			CreatedAt:      team.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"teams": teams})

}

func (h *Handler) ListMembers(c *gin.Context) {
	teamid, err := uuid.Parse(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team id"})
		return
	}

	userid, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization went wrong"})
		return
	}

	requesterRole, err := h.queries.GetTeamMemberRole(c.Request.Context(), sqlc.GetTeamMemberRoleParams{
		TeamID: teamid,
		UserID: uuid.UUID(userid),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get your role"})
		return
	}
	if requesterRole != "owner" && requesterRole != "admin" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "you dont have enough permision for creating teams"})
		return
	}

	memberlist, err := h.queries.ListTeamMembers(c.Request.Context(), teamid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get list of teams"})
		return
	}

	teams := make([]teamMemberResponse, 0, len(memberlist))

	for _, teammember := range memberlist {
		teams = append(teams, teamMemberResponse{
			UserID:    teammember.UserID.String(),
			FullName:  teammember.FullName,
			Email:     teammember.Email,
			Role:      teammember.Role,
			CreatedAt: teammember.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"teams": teams})

}

func (h *Handler) AddMember(c *gin.Context) {
	teamid, err := uuid.Parse(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team id"})
		return
	}

	targetid, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team id"})
		return
	}

	userid, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization went wrong"})
		return
	}

	requesterRole, err := h.queries.GetTeamMemberRole(c.Request.Context(), sqlc.GetTeamMemberRoleParams{
		TeamID: teamid,
		UserID: uuid.UUID(userid),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get your role"})
		return
	}
	if requesterRole != "owner" && requesterRole != "admin" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "you dont have enough permision for creating teams"})
		return
	}

	teammember, err := h.queries.AddTeamMember(c.Request.Context(), sqlc.AddTeamMemberParams{
		TeamID: teamid,
		UserID: targetid,
		Role:   requesterRole,
	})

	respone := teamMemberResponse{
		UserID:    teammember.ID.String(),
		Role:      teammember.Role,
		CreatedAt: teammember.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{"teams": respone})

}

func (h *Handler) RemoveMember(c *gin.Context) {
	teamid, err := uuid.Parse(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team id"})
		return
	}

	targetid, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team id"})
		return
	}

	userid, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization went wrong"})
		return
	}

	requesterRole, err := h.queries.GetTeamMemberRole(c.Request.Context(), sqlc.GetTeamMemberRoleParams{
		TeamID: teamid,
		UserID: uuid.UUID(userid),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get your role"})
		return
	}
	if requesterRole != "owner" && requesterRole != "admin" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "you dont have enough permision for creating teams"})
		return
	}

	err = h.queries.RemoveTeamMember(c.Request.Context(), sqlc.RemoveTeamMemberParams{
		UserID: targetid,
		TeamID: teamid,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt Remove the member"})
	}

	c.Status(http.StatusNoContent)

}

func (h *Handler) SoftDelete(c *gin.Context) {
	teamid, err := uuid.Parse(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team id"})
		return
	}

}
