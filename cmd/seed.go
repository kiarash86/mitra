package cmd

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kiarash86/mitra/internal/auth"
	"github.com/kiarash86/mitra/internal/config"
	sqlc "github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/spf13/cobra"
)

var (
	seedOwnerEmail    string
	seedOwnerName     string
	seedOwnerPassword string
)

var seedCmd = &cobra.Command{
	Use:   "seed",
	Short: "Create the owner account",
	Args:  cobra.NoArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		return runSeed()
	},
}

func firstNonEmpty(flagValue, envValue string) string {
	if flagValue != "" {
		return flagValue
	}
	return envValue
}

func runSeed() error {
	cfg, err := config.LoadSeedConfig()
	if err != nil {
		return fmt.Errorf("couldnt load config: %w", err)
	}

	ownerEmail := firstNonEmpty(seedOwnerEmail, cfg.OwnerEmail)
	ownerName := firstNonEmpty(seedOwnerName, cfg.OwnerName)
	ownerPassword := firstNonEmpty(seedOwnerPassword, cfg.OwnerPassword)

	requiredValues := []struct {
		flagName string
		envName  string
		value    string
	}{
		{"--owner-email", "OWNER_EMAIL", ownerEmail},
		{"--owner-name", "OWNER_NAME", ownerName},
		{"--owner-password", "OWNER_PASSWORD", ownerPassword},
	}
	for _, rv := range requiredValues {
		if rv.value == "" {
			return fmt.Errorf("missing required value: pass %s or set %s", rv.flagName, rv.envName)
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("couldnt connect to db: %w", err)
	}
	defer pool.Close()

	queries := sqlc.New(pool)

	exists, err := queries.AnyUserExists(ctx)
	if err != nil {
		return fmt.Errorf("couldnt check user existense: %w", err)
	}
	if exists {
		fmt.Println("there is a user already. bye! bye!")
		return nil
	}

	hashedPassword, err := auth.HashPassword(ownerPassword)
	if err != nil {
		return fmt.Errorf("couldnt hash admin password: %w", err)
	}

	user, err := queries.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        ownerEmail,
		PasswordHash: hashedPassword,
		FullName:     ownerName,
		Role:         "owner",
	})
	if err != nil {
		return fmt.Errorf("couldnt create user: %w", err)
	}

	if err := queries.UpdateUserPassword(ctx, sqlc.UpdateUserPasswordParams{
		ID:           user.ID,
		PasswordHash: hashedPassword,
	}); err != nil {
		return fmt.Errorf("trick to decieve program for must_change_password failed: %w", err)
	}

	fmt.Printf("owner account: %s -> password: %s\n", user.Email, ownerPassword)
	return nil
}

func init() {
	seedCmd.Flags().StringVar(&seedOwnerEmail, "owner-email", "", "owner login email (defaults to OWNER_EMAIL)")
	seedCmd.Flags().StringVar(&seedOwnerName, "owner-name", "", "owner full name (defaults to OWNER_NAME)")
	seedCmd.Flags().StringVar(&seedOwnerPassword, "owner-password", "", "owner initial password (defaults to OWNER_PASSWORD)")

	rootCmd.AddCommand(seedCmd)
}
