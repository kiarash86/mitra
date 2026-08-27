package main

import (
	"context"
	"log"
	"time"

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

	ping, pingCancel := context.WithTimeout(ctx, 5*time.Second)
	defer pingCancel()
	err = pool.Ping(ping)
	if err != nil {
		log.Fatalf("couldnt ping db : %v", err)

	}
	log.Println("connected to db seccesfully")

}
