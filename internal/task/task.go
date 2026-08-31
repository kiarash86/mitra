package task

import (
	"time"

	"github.com/kiarash86/mitra/internal/convert"
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
