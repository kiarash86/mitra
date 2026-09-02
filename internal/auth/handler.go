package auth

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	sqlc "github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
)

type AuthHandler struct {
	queries *sqlc.Queries
	tokens  *TokenManager
}

// type registerRequest struct {
// 	FullName string `json:"full_name" binding:"required,min=2,max=255"`
// 	Email    string `json:"email" binding:"required,email"`
// 	Password string `json:"password" binding:"required,min=8"`
// }

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
type changePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

type userResponse struct {
	ID                 string `json:"id"`
	FullName           string `json:"full_name"`
	Email              string `json:"email"`
	MustChangePassword bool   `json:"must_change_password"`
}

type authResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         userResponse `json:"user"`
}

func NewAuthHandler(queries *sqlc.Queries, tokens *TokenManager) *AuthHandler {
	return &AuthHandler{
		queries: queries,
		tokens:  tokens,
	}
}

// func (ah *AuthHandler) Register(c *gin.Context) {

// 	var req registerRequest
// 	err := c.ShouldBindBodyWithJSON(&req)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err})
// 		return
// 	}
// 	_, err = ah.queries.GetUserByEmail(c, req.Email)
// 	if err == nil {
// 		c.JSON(http.StatusConflict, gin.H{"error": "user with this email already exists"})
// 		return
// 	}

// 	if !errors.Is(err, pgx.ErrNoRows) {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt check this user"})
// 		return
// 	}

// 	pass, err := HashPassword(req.Password)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong with hashing"})
// 		return
// 	}

// 	user, err := ah.queries.CreateUser(c.Request.Context(), sqlc.CreateUserParams{
// 		Email:        req.Email,
// 		PasswordHash: pass,
// 		FullName:     req.FullName,
// 	})

// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong with creating user"})
// 		return
// 	}

// 	ah.respondWithTokens(c, http.StatusCreated, user.ID, user.FullName, user.Email)
// }

func (ah *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	err := c.ShouldBindBodyWithJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}
	user, err := ah.queries.GetUserByEmail(c, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid pass or email"})
		return
	}

	if !CheckPassword(user.PasswordHash, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	ah.respondWithTokens(c, http.StatusOK, user.ID, user.FullName, user.Email, user.MustChangePassword)

}

func (ah *AuthHandler) ChangePassword(c *gin.Context) {
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization"})
		return
	}

	var req changePasswordRequest
	err := c.ShouldBindBodyWithJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
	}
	user, err := ah.queries.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt load user"})
		return
	}

	if !CheckPassword(user.PasswordHash, req.CurrentPassword) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "current password is incorrect"})
		return
	}

	password, err := HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong with hashing"})
		return
	}

	err = ah.queries.UpdateUserPassword(c.Request.Context(), sqlc.UpdateUserPasswordParams{
		ID:           userID,
		PasswordHash: password,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "couldnt update password"})
		return
	}
}

func (h *AuthHandler) respondWithTokens(c *gin.Context, status int, userID uuid.UUID, fullName, email string, mustChangePassword bool) {
	accessToken, err := h.tokens.GenerateAccessToken(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue access token"})
		return
	}

	refreshToken, err := h.tokens.GenerateRefreshToken(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue refresh token"})
		return
	}

	c.JSON(status, authResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: userResponse{
			ID:                 userID.String(),
			FullName:           fullName,
			Email:              email,
			MustChangePassword: mustChangePassword,
		},
	})
}
