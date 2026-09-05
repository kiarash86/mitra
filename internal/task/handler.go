package task

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

type createTaskRequest struct {
	Title       string  `json:"title" binding:"required,min=2,max=255"`
	Description string  `json:"description" binding:"max=10000"`
	Priority    string  `json:"priority"`
	DueDate     *string `json:"due_date"`
}

type updateTaskRequest struct {
	Title       string  `json:"title" binding:"required,min=2,max=255"`
	Description string  `json:"description" binding:"max=10000"`
	Priority    string  `json:"priority" binding:"required"`
	DueDate     *string `json:"due_date"`
}

type updateTaskStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type assignTaskToUserRequest struct {
	UserID string `json:"user_id" binding:"required,uuid"`
}

type taskResponse struct {
	ID               string     `json:"id"`
	ProjectID        string     `json:"project_id"`
	Title            string     `json:"title"`
	Description      string     `json:"description,omitempty"`
	Status           string     `json:"status"`
	Priority         string     `json:"priority"`
	AssignedToUserID *string    `json:"assigned_to_user_id,omitempty"`
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
	if req.Priority == "" {
		req.Priority = "medium"
	}
	if !allowedTaskPriorities[req.Priority] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "priority must be one of [low, medium, high, urgent]"})
		return
	}

	dueDate, err := convert.ParseDate(req.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

	projectMember, err := rbac.IsProjectMember(c.Request.Context(), h.queries, project.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
		return
	}
	if !projectMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this project"})
		return
	}

	task, err := h.queries.CreateTask(c.Request.Context(), sqlc.CreateTaskParams{
		ProjectID:   projectID,
		Title:       req.Title,
		Description: convert.StringToText(req.Description),
		Priority:    req.Priority,
		DueDate:     convert.TimeToTimestamptz(dueDate),
		CreatedBy:   userID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt create task"})
		return
	}

	c.JSON(http.StatusCreated, taskToResponse(task))

}

func (h *Handler) ListByProject(c *gin.Context) {
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
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	isMemberOfProject, err := rbac.IsProjectMember(c.Request.Context(), h.queries, project.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
		return
	}
	if !isMemberOfProject {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this project"})
		return
	}

	tasks, err := h.queries.ListTasksByProject(c.Request.Context(), projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt list tasks"})
		return
	}

	resp := make([]taskResponse, 0, len(tasks))
	for _, task := range tasks {
		resp = append(resp, taskToResponse(task))
	}

	c.JSON(http.StatusOK, gin.H{"tasks": resp})

}

func (h *Handler) ListAssignedToMe(c *gin.Context) {
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
		return
	}

	list, _ := h.queries.ListTasksAssignedToUser(c.Request.Context(), convert.UUIDToPgtypeUUID(userID))
	tasks := make([]taskResponse, 0, len(list))

	for _, taskk := range list {
		tasks = append(tasks, taskToResponse(taskk))
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasks})

}

func (h *Handler) GetByID(c *gin.Context) {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	task, err := h.queries.GetTaskByID(c.Request.Context(), taskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get task"})
		return
	}

	project, err := h.queries.GetProjectByID(c.Request.Context(), task.ProjectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	isMemberOfProject, err := rbac.IsProjectMember(c.Request.Context(), h.queries, project.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
		return
	}
	if !isMemberOfProject {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this project"})
		return
	}

	c.JSON(http.StatusOK, taskToResponse(task))

}

func (h *Handler) Update(c *gin.Context) {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	var req updateTaskRequest
	err = c.ShouldBindBodyWithJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !allowedTaskPriorities[req.Priority] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "priority must be one of low, medium, high, urgent"})
		return
	}

	dueDate, err := convert.ParseDate(req.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.queries.GetTaskByID(c.Request.Context(), taskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get task"})
		return
	}

	project, err := h.queries.GetProjectByID(c.Request.Context(), task.ProjectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	isMemberOfProject, err := rbac.IsProjectMember(c.Request.Context(), h.queries, project.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
		return
	}
	if !isMemberOfProject {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this project"})
		return
	}

	task, err = h.queries.UpdateTask(c.Request.Context(), sqlc.UpdateTaskParams{
		ID:          taskID,
		Title:       req.Title,
		Description: convert.StringToText(req.Description),
		Priority:    req.Priority,
		DueDate:     convert.TimeToTimestamptz(dueDate),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt update task"})
		return
	}

	c.JSON(http.StatusOK, taskToResponse(task))

}

func (h *Handler) UpdateStatus(c *gin.Context) {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	var req updateTaskStatusRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !allowedTaskStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status must be one of todo, in_progress, review, done"})
		return
	}

	task, err := h.queries.GetTaskByID(c.Request.Context(), taskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get task"})
		return
	}

	project, err := h.queries.GetProjectByID(c.Request.Context(), task.ProjectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	isMemberOfProject, err := rbac.IsProjectMember(c.Request.Context(), h.queries, project.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
		return
	}
	if !isMemberOfProject {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this project"})
		return
	}

	task, err = h.queries.UpdateTaskStatus(c.Request.Context(), sqlc.UpdateTaskStatusParams{
		ID:     taskID,
		Status: req.Status,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt update task status"})
		return
	}

	c.JSON(http.StatusOK, taskToResponse(task))

}

func (h *Handler) AssignToUser(c *gin.Context) {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	var req assignTaskToUserRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	assignID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	task, err := h.queries.GetTaskByID(c.Request.Context(), taskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get task"})
		return
	}

	project, err := h.queries.GetProjectByID(c.Request.Context(), task.ProjectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	isAdminOrOwnerProject, err := rbac.IsProjectOwnerOrAdmin(c.Request.Context(), h.queries, project.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
		return
	}
	if !isAdminOrOwnerProject {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this project"})
		return
	}

	isProjectMember, err := rbac.IsProjectMember(c.Request.Context(), h.queries, project.ID, assignID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check asignee  role"})
		return
	}
	if !isProjectMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "assignee is not member of this project"})
		return
	}
	task, err = h.queries.AssignTaskToUser(c.Request.Context(), sqlc.AssignTaskToUserParams{
		ID:               taskID,
		AssignedToUserID: convert.UUIDToPgtypeUUID(assignID),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt assign task"})
		return
	}

	c.JSON(http.StatusOK, taskToResponse(task))

}

func (h *Handler) Unassign(c *gin.Context) {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	task, err := h.queries.GetTaskByID(c.Request.Context(), taskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get task"})
		return
	}

	project, err := h.queries.GetProjectByID(c.Request.Context(), task.ProjectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	isMemberOfProject, err := rbac.IsProjectMember(c.Request.Context(), h.queries, project.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
		return
	}
	if !isMemberOfProject {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this project"})
		return
	}

	task, err = h.queries.UnassignTask(c.Request.Context(), taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt unassign task"})
		return
	}

	c.JSON(http.StatusOK, taskToResponse(task))

}

func (h *Handler) Delete(c *gin.Context) {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	task, err := h.queries.GetTaskByID(c.Request.Context(), taskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get task"})
		return
	}

	project, err := h.queries.GetProjectByID(c.Request.Context(), task.ProjectID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt get project"})
		return
	}

	isprojectAdminOrOwner, err := rbac.IsProjectOwnerOrAdmin(c.Request.Context(), h.queries, project.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your project role"})
		return
	}
	if !isprojectAdminOrOwner {
		orgAdmin, err := rbac.IsOrganizationOwnerOrAdmin(c.Request.Context(), h.queries, project.OrganizationID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your organization role"})
			return
		}
		if !orgAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "only a project owner/admin or an org owner/admin can delete a task"})
			return
		}
	}

	if err := h.queries.SoftDeleteTask(c.Request.Context(), task.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt delete task"})
		return
	}

	c.Status(http.StatusNoContent)

}
