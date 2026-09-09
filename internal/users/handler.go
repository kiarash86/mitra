package users

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/kiarash86/mitra/internal/auth"
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

type createUserRequest struct {
	Email    string `json:"email" binding:"required,email"`
	FullName string `json:"full_name" binding:"required,min=2,max=255"`
	Role     string `json:"role" binding:"required,oneof=owner admin member viewer"`
}

type updateMeRequest struct {
	FullName string `json:"full_name" binding:"required,min=2,max=255"`
}

type userResponse struct {
	ID                 string    `json:"id"`
	FullName           string    `json:"full_name"`
	Email              string    `json:"email"`
	Role               string    `json:"role"`
	MustChangePassword bool      `json:"must_change_password"`
	CreatedAt          time.Time `json:"created_at"`
}

type createUserResponse struct {
	UserID       string `json:"user_id"`
	Email        string `json:"email"`
	FullName     string `json:"full_name"`
	Role         string `json:"role"`
	TempPassword string `json:"temp_password"`
}

func toUserResponse(u sqlc.User) userResponse {
	return userResponse{
		ID:                 u.ID.String(),
		FullName:           u.FullName,
		Email:              u.Email,
		Role:               u.Role,
		MustChangePassword: u.MustChangePassword,
		CreatedAt:          u.CreatedAt,
	}
}

func (h *Handler) List(c *gin.Context) {
	_, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	list, err := h.queries.ListUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt list users"})
		return
	}

	users := make([]userResponse, 0, len(list))
	for _, u := range list {
		users = append(users, toUserResponse(u))
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

func (h *Handler) Create(c *gin.Context) {
	requesterID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized id or something like that"})
		return
	}

	var req createUserRequest
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	requesterRole, err := rbac.GetUserRole(c.Request.Context(), h.queries, uuid.UUID(requesterID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check your role"})
		return
	}
	if requesterRole != "owner" && requesterRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only an owner or admin can add users"})
		return
	}
	if req.Role == "owner" && requesterRole != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only an owner can make someone owner"})
		return
	}

	_, err = h.queries.GetUserByEmail(c.Request.Context(), req.Email)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "user with this email already exists"})
		return
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check this email"})
		return
	}

	tempPassword, err := auth.GenerateTempPassword()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt generate password"})
		return
	}

	hashedPassword, err := auth.HashPassword(tempPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong with hashing"})
		return
	}

	user, err := h.queries.CreateUser(c.Request.Context(), sqlc.CreateUserParams{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		FullName:     req.FullName,
		Role:         req.Role,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt create user"})
		return
	}

	c.JSON(http.StatusCreated, createUserResponse{
		UserID:       user.ID.String(),
		Email:        user.Email,
		FullName:     user.FullName,
		Role:         user.Role,
		TempPassword: tempPassword,
	})
}

func (h *Handler) Delete(c *gin.Context) {
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type of id"})
		return
	}


}
