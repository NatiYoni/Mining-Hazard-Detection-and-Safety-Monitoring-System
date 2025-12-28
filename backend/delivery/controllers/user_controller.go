package controllers

import (
	"minesense-backend/infrastructure/utils"
	"minesense-backend/usecases"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserController struct {
	UserUseCase *usecases.UserUseCase
	JWTSecret   string
}

func NewUserController(uc *usecases.UserUseCase, secret string) *UserController {
	return &UserController{
		UserUseCase: uc,
		JWTSecret:   secret,
	}
}

type RegisterInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required"`
}

func (c *UserController) Register(ctx *gin.Context) {
	var input RegisterInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := c.UserUseCase.Register(input.Username, input.Password, input.Role)
	if err != nil {
		// Return the actual error message to help with debugging (e.g., "duplicate key value violates unique constraint")
		// In a production app, you might want to map this to a user-friendly message
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

type LoginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (c *UserController) Login(ctx *gin.Context) {
	var input LoginInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := c.UserUseCase.Login(input.Username, input.Password)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Role, c.JWTSecret)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

type ChangePasswordInput struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

func (c *UserController) ChangePassword(ctx *gin.Context) {
	var input ChangePasswordInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get username from context (set by AuthMiddleware)
	username, exists := ctx.Get("username")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	err := c.UserUseCase.ChangePassword(username.(string), input.OldPassword, input.NewPassword)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "invalid old password" {
			status = http.StatusUnauthorized
		}
		ctx.JSON(status, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}
