package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kiarash86/mitra/internal/auth"
	"github.com/kiarash86/mitra/internal/config"
	sqlc "github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
	"github.com/kiarash86/mitra/internal/organization"
	"github.com/kiarash86/mitra/internal/project"
	"github.com/kiarash86/mitra/internal/task"
	"github.com/kiarash86/mitra/internal/comment"
)

func main() {

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("couldnt load config : %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("couldnt create db pool : %v", err)

	}
	defer pool.Close()

	ping, pingCancel := context.WithTimeout(ctx, 5*time.Second)
	defer pingCancel()
	err = pool.Ping(ping)
	if err != nil {
		log.Fatalf("couldnt ping db : %v", err)

	}
	log.Println("connected to db seccesfully")

	switch cfg.AppEnv {
	case "production":
		gin.SetMode(gin.ReleaseMode)

	case "development":
		gin.SetMode(gin.DebugMode)

	case "test":
		gin.SetMode(gin.TestMode)

	default:
		log.Fatalf("something is wrong with this AppEnv: %s", cfg.AppEnv)
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	router.GET("/health", func(ctx *gin.Context) {
		err = pool.Ping(ctx.Request.Context())
		if err != nil {
			ctx.JSON(http.StatusServiceUnavailable, gin.H{"status": "down", "error": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"status": "ok"})

	})

	queries := sqlc.New(pool)
	tokens := auth.NewTokenManager(cfg.JWTSecret, cfg.JWTAccessTokenTTL, cfg.JWTRefreshTokenTTL)

	authHandler := auth.NewAuthHandler(queries, tokens)
	orgHandler := organization.NewHandler(queries)
	projectHandler := project.NewHandler(queries)
	taskHandler := task.NewHandler(queries)
	commentHandler := comment.NewHandler(queries)

	api := router.Group("/api/v1")
	authGroup := api.Group("/auth")

	authGroup.POST("/login", authHandler.Login)
	authGroup.POST("/register", authHandler.Register)

	protected := api.Group("")
	protected.Use(middleware.RequireAuth(tokens))

	orgGroup := protected.Group("/organizations")
	orgGroup.POST("", orgHandler.Create)
	orgGroup.GET("/by-slug/:slug", orgHandler.GetBySlug)
	orgGroup.GET("/:id/members", orgHandler.ListMembers)
	orgGroup.DELETE("/:id/members/:user_id", orgHandler.RemoveMember)
	orgGroup.POST("/:id/projects", projectHandler.Create)
	orgGroup.GET("/:id/projects", projectHandler.ListByOrganization)

	projectGroup := protected.Group("/projects")
	projectGroup.GET("/:id", projectHandler.GetByID)
	projectGroup.PUT("/:id", projectHandler.Update)
	projectGroup.DELETE("/:id", projectHandler.Delete)
	projectGroup.GET("/:id/members", projectHandler.ListMembers)
	projectGroup.POST("/:id/members", projectHandler.AddMember)
	projectGroup.DELETE("/:id/members/:user_id", projectHandler.RemoveMember)
	projectGroup.POST("/:id/tasks", taskHandler.Create)
	projectGroup.GET("/:id/tasks", taskHandler.ListByProject)

	taskGroup := protected.Group("/tasks")
	taskGroup.GET("/assigned-to-me", taskHandler.ListAssignedToMe)
	taskGroup.GET("/:id", taskHandler.GetByID)
	taskGroup.PUT("/:id", taskHandler.Update)
	taskGroup.DELETE("/:id", taskHandler.Delete)
	taskGroup.PATCH("/:id/status", taskHandler.UpdateStatus)
	taskGroup.POST("/:id/assign/user", taskHandler.AssignToUser)
	taskGroup.POST("/:id/unassign", taskHandler.Unassign)
	taskGroup.GET("/:id/comments", commentHandler.ListByTask)
	taskGroup.POST("/:id/comments", commentHandler.Create)

	commentGroup := protected.Group("/comments")
	commentGroup.PUT("/:id", commentHandler.Update)
	commentGroup.DELETE("/:id", commentHandler.Delete)

	srv := &http.Server{
		Addr:    ":" + cfg.AppPort,
		Handler: router,
	}

	go func() {
		log.Printf("api is listening! on port %v  and on mode: %v", cfg.AppPort, cfg.AppEnv)

		err = srv.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("something went wrong : %v", err)

		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down server...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	err = srv.Shutdown(shutdownCtx)
	if err != nil {
		log.Fatalf("server forced to shutdown: %v", err)

	}

	log.Println("server exited")

}
