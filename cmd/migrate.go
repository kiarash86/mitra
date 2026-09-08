package cmd

import (
	"fmt"
	"strconv"

	"github.com/spf13/cobra"

	"github.com/kiarash86/mitra/internal/config"
	"github.com/kiarash86/mitra/internal/db/migrator"
)

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Manage database migrations",
}


func dbURL() (string, error) {
	cfg, err := config.LoadDBConfig()
	if err != nil {
		return "", fmt.Errorf("couldnt load config: %w", err)
	}
	return cfg.DatabaseURL, nil
}

var migrateUpCmd = &cobra.Command{
	Use:   "up",
	Short: "Apply all available migrations",
	Args:  cobra.NoArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		url, err := dbURL()
		if err != nil {
			return err
		}
		if err := migrator.Up(url); err != nil {
			return fmt.Errorf("migrate up: %w", err)
		}
		fmt.Println("migrations applied successfully")
		return nil
	},
}

var migrateDownCmd = &cobra.Command{
	Use:   "down",
	Short: "Roll back all migrations",
	Args:  cobra.NoArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		url, err := dbURL()
		if err != nil {
			return err
		}
		if err := migrator.Down(url); err != nil {
			return fmt.Errorf("migrate down: %w", err)
		}
		fmt.Println("migrations rolled back successfully")
		return nil
	},
}

var migrateStepsCmd = &cobra.Command{
	Use:   "steps <n>",
	Short: "Apply n migrations (n can be negative to roll back)",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		n, err := strconv.Atoi(args[0])
		if err != nil {
			return fmt.Errorf("invalid steps count %q: %w", args[0], err)
		}
		url, err := dbURL()
		if err != nil {
			return err
		}
		if err := migrator.Steps(url, n); err != nil {
			return fmt.Errorf("migrate steps: %w", err)
		}
		fmt.Println("migration steps applied successfully")
		return nil
	},
}

var migrateForceCmd = &cobra.Command{
	Use:   "force <version>",
	Short: "Set the migration version without running it (recover from a dirty state)",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		v, err := strconv.Atoi(args[0])
		if err != nil {
			return fmt.Errorf("invalid version %q: %w", args[0], err)
		}
		url, err := dbURL()
		if err != nil {
			return err
		}
		if err := migrator.Force(url, v); err != nil {
			return fmt.Errorf("migrate force: %w", err)
		}
		fmt.Println("migration version forced successfully")
		return nil
	},
}

var migrateVersionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the current migration version",
	Args:  cobra.NoArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		url, err := dbURL()
		if err != nil {
			return err
		}
		v, dirty, err := migrator.Version(url)
		if err != nil {
			return fmt.Errorf("migrate version: %w", err)
		}
		fmt.Printf("version: %d, dirty: %v\n", v, dirty)
		return nil
	},
}

func init() {
	migrateCmd.AddCommand(migrateUpCmd, migrateDownCmd, migrateStepsCmd, migrateForceCmd, migrateVersionCmd)
	rootCmd.AddCommand(migrateCmd)
}
