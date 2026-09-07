package cmd

import (
	"fmt"
	"log"
	"strconv"

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

var migrateStepsCmd = &cobra.Command{
	Use:   "steps <n>",
	Short: "Apply n migrations (n can be negative to roll back)",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		num, err := strconv.Atoi(args[0])
		if err != nil {
			log.Fatalf("invalid steps count %q: %v", args[0], err)
		}
		err = migrator.Steps(cfg.DatabaseURL, num)
		if err != nil {
			log.Fatalf("migrate steps: %v", err)

		}
		fmt.Println("migration steps applied successfully")

	},
}

var migrateForceCmd = &cobra.Command{
	Use:   "force <version>",
	Short: "Set the migration version without running it (recover from a dirty state)",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		version, err := strconv.Atoi(args[0])
		if err != nil {
			log.Fatalf("invalid version %q: %v", args[0], err)
		}
		err = migrator.Force(cfg.DatabaseURL, version)
		if err != nil {
			log.Fatalf("migrate force: %v", err)

		}
		fmt.Println("migration version forced successfully")

	},
}

var migrateVersionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the current migration version",
	Run: func(cmd *cobra.Command, args []string) {
		v, dirty, err := migrator.Version(cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("migrate version: %v", err)
		}
		fmt.Printf("version: %d, dirty: %v\n", v, dirty)

	},
}
