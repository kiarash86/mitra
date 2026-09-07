package cmd

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kiarash86/mitra/internal/auth"
	sqlc "github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/spf13/cobra"
)

var (
	seedOrgName       string
	seedOrgSlug       string
	seedOwnerEmail    string
	seedOwnerName     string
	seedOwnerPassword string
)

var seedCmd = &cobra.Command{
	Use:   "seed",
	Short: "Create the first organization and owner account",
	Run: func(cmd *cobra.Command, args []string) {
		runSeed()
	},
}

func firstNonEmpty(flagValue, envValue string) string {
	if flagValue != "" {
		return flagValue
	}
	return envValue
}

func runSeed() {

	orgName := firstNonEmpty(seedOrgName, cfg.OrgName)
	orgSlug := firstNonEmpty(seedOrgSlug, cfg.OrgSlug)
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
			log.Fatalf("missing required value: pass %s or set %s", rv.flagName, rv.envName)
		}
	}

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

	hashedPassword, err := auth.HashPassword(ownerPassword)
	if err != nil {
		log.Fatalf("couldnt hash admin password: %v", err)
	}

	user, err := queries.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        ownerEmail,
		PasswordHash: hashedPassword,
		FullName:     ownerName,
	})
	if err != nil {
		log.Fatalf("couldnt create user: %v", err)
	}

	err = queries.UpdateUserPassword(ctx, sqlc.UpdateUserPasswordParams{
		ID:           user.ID,
		PasswordHash: hashedPassword,
	})
	if err != nil {
		log.Fatalf("trick to decieve program for must_change_password failed: %v", err)
	}

	org, err := queries.CreateOrganization(ctx, sqlc.CreateOrganizationParams{
		Name: orgName,
		Slug: orgSlug,
	})
	if err != nil {
		log.Fatalf("couldnt create organization: %v", err)
	}
	_, err = queries.AddOrganizationMember(ctx, sqlc.AddOrganizationMemberParams{
		OrganizationID: org.ID,
		UserID:         user.ID,
		Role:           "owner",
	})
	if err != nil {
		log.Fatalf("couldnt add user to organization: %v", err)
	}

	fmt.Printf("organization with %q (slug:%s) created succesfully\n", org.Name, org.Slug)
	fmt.Printf("owner account: %s -> password: %s\n", user.Email, ownerPassword)
}

func init() {

	seedCmd.Flags().StringVar(&seedOrgName, "org-name", "", "organization name (defaults to ORG_NAME)")
	seedCmd.Flags().StringVar(&seedOrgSlug, "org-slug", "", "organization slug (defaults to ORG_SLUG)")
	seedCmd.Flags().StringVar(&seedOwnerEmail, "owner-email", "", "owner login email (defaults to OWNER_EMAIL)")
	seedCmd.Flags().StringVar(&seedOwnerName, "owner-name", "", "owner full name (defaults to OWNER_NAME)")
	seedCmd.Flags().StringVar(&seedOwnerPassword, "owner-password", "", "owner initial password (defaults to OWNER_PASSWORD)")

	rootCmd.AddCommand(seedCmd)
}
