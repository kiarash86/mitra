package cmd

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/spf13/cobra"

	"github.com/kiarash86/mitra/internal/auth"
	"github.com/kiarash86/mitra/internal/comment"
	"github.com/kiarash86/mitra/internal/config"
	"github.com/kiarash86/mitra/internal/db/migrator"
	sqlc "github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/middleware"
	"github.com/kiarash86/mitra/internal/organization"
	"github.com/kiarash86/mitra/internal/project"
	"github.com/kiarash86/mitra/internal/task"
	"github.com/kiarash86/mitra/web"
)

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Run the HTTP API server",
	Args:  cobra.NoArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		return runServe()
	},
}

func runServe() error {
	cfg, err := config.LoadServeConfig()
	if err != nil {
		return fmt.Errorf("couldnt load config: %w", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if cfg.AutoMigrate {
		if err := migrator.Up(cfg.DatabaseURL); err != nil {
			return fmt.Errorf("couldnt run migrations: %w", err)
		}
		log.Println("migrations are up to date")
	}

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("couldnt create db pool: %w", err)
	}
	defer pool.Close()

	ping, pingCancel := context.WithTimeout(ctx, 5*time.Second)
	defer pingCancel()
	if err := pool.Ping(ping); err != nil {
		return fmt.Errorf("couldnt ping db: %w", err)
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
		return fmt.Errorf("something is wrong with this AppEnv: %s", cfg.AppEnv)
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	router.GET("/health", func(c *gin.Context) {
		if err := pool.Ping(c.Request.Context()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "down", "error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
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

	protected := api.Group("")
	protected.Use(middleware.RequireAuth(tokens))

	protected.POST("/auth/change-password", authHandler.ChangePassword)

	orgGroup := protected.Group("/organizations")
	orgGroup.GET("/by-slug/:slug", orgHandler.GetBySlug)
	orgGroup.GET("/:id/members", orgHandler.ListMembers)
	orgGroup.POST("/:id/members", orgHandler.CreateMember)
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

	registerWebUI(router)

	srv := &http.Server{
		Addr:    ":" + cfg.AppPort,
		Handler: router,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Printf("api is listening! on port %v  and on mode: %v", cfg.AppPort, cfg.AppEnv)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		return fmt.Errorf("something went wrong: %w", err)
	case <-quit:
	}

	log.Println("shutting down server...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("server forced to shutdown: %w", err)
	}

	log.Println("server exited")
	return nil
}

func init() {
	rootCmd.AddCommand(serveCmd)
}

func registerWebUI(router *gin.Engine) {
	fs := http.FileServer(http.FS(web.FS))
	router.NoRoute(func(ctx *gin.Context) {
		if strings.HasPrefix(ctx.Request.URL.Path, "/api/") {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		requestPath := strings.TrimPrefix(ctx.Request.URL.Path, "/")
		f, err := web.FS.Open(requestPath)
		if err == nil {
			f.Close()
			if strings.HasPrefix(requestPath, "assets/") {
				ctx.Header("Cache-Control", "public, max-age=31536000, immutable")
			}
			fs.ServeHTTP(ctx.Writer, ctx.Request)
			return
		}
		ctx.Header("Cache-Control", "no-cache")
		ctx.FileFromFS("/", http.FS(web.FS))
	})
}
