package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kiarash86/mitra/internal/config"
	"github.com/kiarash86/mitra/internal/db/sqlc"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("couldnt load config: %v", err)
	}

	orgName := getEnv("ORG_NAME")
	orgSlug := getEnv("ORG_SLUG")
	ownerEmail := getEnv("OWNER_EMAIL")
	ownerName := getEnv("OWNER_NAME")
	ownerPassword := getEnv("OWNER_PASSWORD")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("couldnt connect to db: %v", err)
	}
	defer pool.Close()

	queries := sqlc.New(pool)

	exists, err := queries.AnyOrganizationExists(ctx)
	if err != nil {
		log.Fatalf("couldnt check organization existense: %v", err)
	}
	if exists {
		fmt.Println("there is a organization already. bye! bye!")
		return
	}
}

func getEnv(key string) string {
	env := os.Getenv(key)
	if env == "" {
		log.Fatalf("missing env parameter: %s", key)
	}

	return env
}
