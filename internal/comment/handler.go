package comment

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
	"github.com/kiarash86/mitra/internal/rbac"
)

type Handler struct {
	queries *sqlc.Queries
}

func NewHandler(queries *sqlc.Queries) *Handler {
	return &Handler{}
}

type createCommentRequest struct {
	Body string `json:"body" binding:"required,min=1,max=10000"`
}

type updateCommentRequest struct {
	Body string `json:"body" binding:"required,min=1,max=10000"`
}

type commentResponse struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"task_id"`
	AuthorID  string    `json:"author_id"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type commentWithAuthorResponse struct {
	commentResponse
	AuthorFullName string `json:"author_full_name"`
	AuthorEmail    string `json:"author_email"`
}

func (h *Handler) Create(c *gin.Context) {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}
	var req createCommentRequest
	err = c.ShouldBindBodyWithJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
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

	member, err := rbac.IsProjectMember(c.Request.Context(), h.queries, task.ProjectID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check project role"})
		return
	}
	if !member {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this task's project"})
		return
	}

	comment, err := h.queries.CreateComment(c.Request.Context(), sqlc.CreateCommentParams{
		TaskID:   taskID,
		AuthorID: userID,
		Body:     req.Body,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt create comment"})
		return
	}

	c.JSON(http.StatusCreated, commentResponse{
		ID:        comment.ID.String(),
		TaskID:    comment.TaskID.String(),
		AuthorID:  comment.AuthorID.String(),
		Body:      comment.Body,
		CreatedAt: comment.CreatedAt,
		UpdatedAt: comment.UpdatedAt,
	})

}

func (h *Handler) ListByTask(c *gin.Context) {
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

	member, err := rbac.IsProjectMember(c.Request.Context(), h.queries, task.ProjectID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check project role"})
		return
	}
	if !member {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this task's project"})
		return
	}

	list, err := h.queries.ListCommentsByTask(c.Request.Context(), taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt list comments"})
		return
	}
	comments := make([]commentWithAuthorResponse, 0, len(list))
	for _, comment := range list {

		comments = append(comments, commentWithAuthorResponse{
			commentResponse: commentResponse{
				ID:        comment.ID.String(),
				TaskID:    comment.TaskID.String(),
				AuthorID:  comment.AuthorID.String(),
				Body:      comment.Body,
				CreatedAt: comment.CreatedAt,
				UpdatedAt: comment.UpdatedAt,
			},
			AuthorFullName: comment.FullName,
			AuthorEmail:    comment.Email,
		})
	}
	c.JSON(http.StatusOK, gin.H{"comments": comments})

}

func (h *Handler) Update(c *gin.Context) {
	commentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid comment id"})
		return
	}
	var req updateCommentRequest
	err = c.ShouldBindBodyWithJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}


}

func (h *Handler) Delete(c *gin.Context) {
	//TODO : SOFT DELETE COMMENT
}
