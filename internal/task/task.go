package task

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kiarash86/mitra/internal/convert"
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

type createTaskRequest struct {
	Title       string     `json:"title" binding:"required,min=2,max=255"`
	Description string     `json:"description" binding:"max=10000"`
	Priority    string     `json:"priority"`
	DueDate     *time.Time `json:"due_date"`
}

type updateTaskRequest struct {
	Title       string     `json:"title" binding:"required,min=2,max=255"`
	Description string     `json:"description" binding:"max=10000"`
	Priority    string     `json:"priority" binding:"required"`
	DueDate     *time.Time `json:"due_date"`
}

type updateTaskStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type assignTaskToUserRequest struct {
	UserID string `json:"user_id" binding:"required,uuid"`
}
type assignTaskToTeamRequest struct {
	TeamID string `json:"team_id" binding:"required,uuid"`
}

type taskResponse struct {
	ID               string     `json:"id"`
	ProjectID        string     `json:"project_id"`
	Title            string     `json:"title"`
	Description      string     `json:"description,omitempty"`
	Status           string     `json:"status"`
	Priority         string     `json:"priority"`
	AssignedToUserID *string    `json:"assigned_to_user_id,omitempty"`
	AssignedToTeamID *string    `json:"assigned_to_team_id,omitempty"`
	DueDate          *time.Time `json:"due_date,omitempty"`
	CreatedBy        string     `json:"created_by"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

var allowedTaskStatuses = map[string]bool{
	"todo":        true,
	"in_progress": true,
	"review":      true,
	"done":        true,
}

var allowedTaskPriorities = map[string]bool{
	"low":    true,
	"medium": true,
	"high":   true,
	"urgent": true,
}

func taskToResponse(task sqlc.Task) taskResponse {
	return taskResponse{
		ID:               task.ID.String(),
		ProjectID:        task.ProjectID.String(),
		Title:            task.Title,
		Description:      convert.TextToString(task.Description),
		Status:           task.Status,
		Priority:         task.Priority,
		AssignedToUserID: convert.PgtypeUUIDToStringPtr(task.AssignedToUserID),
		AssignedToTeamID: convert.PgtypeUUIDToStringPtr(task.AssignedToTeamID),
		DueDate:          convert.TimestamptzToTime(task.DueDate),
		CreatedBy:        task.CreatedBy.String(),
		CreatedAt:        task.CreatedAt,
		UpdatedAt:        task.UpdatedAt,
	}
}

func (h *Handler) Create(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	var req createTaskRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
		return
	}

	task, err := h.queries.CreateTask(c.Request.Context(), sqlc.CreateTaskParams{
		ProjectID:   projectID,
		Title:       req.Title,
		Description: convert.StringToText(req.Description),
		Priority:    req.Priority,
		DueDate:     convert.TimeToTimestamptz(req.DueDate),
		CreatedBy:   userID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt create task"})
		return
	}

	c.JSON(http.StatusCreated, taskToResponse(task))

}

func (h *Handler) ListByProject(c *gin.Context) {
	// TODO : LIST TASKS OF PROJECT
}

func (h *Handler) ListAssignedToMe(c *gin.Context) {
	// TODO : LIST TASKS OF MINE
}

func (h *Handler) GetByID(c *gin.Context) {
	// TODO : GET TASK USING ID
}

func (h *Handler) Update(c *gin.Context) {
	// TODO : UPDATE ENTIRE OF TASK
}

func (h *Handler) UpdateStatus(c *gin.Context) {
	// TODO : UPDATE STATUS
}

func (h *Handler) AssignToUser(c *gin.Context) {
	// TODO : ASSIGN TASK TO SOMEONE
}

func (h *Handler) AssignToTeam(c *gin.Context) {
	// TODO : ASSIGN TASK TO TEAM
}

func (h *Handler) Unassign(c *gin.Context) {
	// TODO : UNASSIGNING TASK
}

func (h *Handler) Delete(c *gin.Context) {
	// TODO : SOFT DELETE TASK
}
