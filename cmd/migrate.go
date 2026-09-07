package cmd

import (
	"fmt"
	"log"

	"github.com/kiarash86/mitra/internal/db/migrator"
	"github.com/spf13/cobra"
)

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Manage database migrations",
}

var migrateUpCmd = &cobra.Command{
	Use:   "up",
	Short: "Apply all available migrations",
	Run: func(cmd *cobra.Command, args []string) {
		err := migrator.Up(cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("migrate up: %v", err)

		}
		fmt.Println("migrations applied successfully")

	},
}

var migrateDownCmd = &cobra.Command{
	Use:   "down",
	Short: "Roll back all migrations",
	Run: func(cmd *cobra.Command, args []string) {
		err := migrator.Down(cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("migrate down: %v", err)

		}
		fmt.Println("migrations rolled back successfully")

	},
}
