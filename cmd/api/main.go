package main

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kiarash86/mitra/internal/config"
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
	
}
