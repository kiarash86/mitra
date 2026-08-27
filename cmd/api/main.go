package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kiarash86/mitra/internal/api/handlers"
	"github.com/kiarash86/mitra/internal/auth"
	"github.com/kiarash86/mitra/internal/config"
	sqlc "github.com/kiarash86/mitra/internal/db/sqlc"
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

	authHandler := handlers.NewAuthHandler(queries, tokens)

	api := router.Group("/api/v1")
	authGroup := api.Group("/auth")

	authGroup.POST("/login", authHandler.Login)
	authGroup.POST("/register", authHandler.Register)

}
