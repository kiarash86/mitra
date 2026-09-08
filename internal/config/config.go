package config

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
)

type DBConfig struct {
	DatabaseURL string `env:"DATABASE_URL"`
	DBHost      string `env:"DB_HOST" envDefault:"localhost"`
	DBPort      string `env:"DB_PORT" envDefault:"5432"`
	DBUser      string `env:"DB_USER" envDefault:"mitra"`
	DBPassword  string `env:"DB_PASSWORD" envDefault:"mitra"`
	DBName      string `env:"DB_NAME" envDefault:"mitra"`
	DBSSLMode   string `env:"DB_SSLMODE" envDefault:"disable"`
}

func (c *DBConfig) resolveDatabaseURL() {
	if c.DatabaseURL == "" {
		c.DatabaseURL = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=%s",
			c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName, c.DBSSLMode,
		)
	}
}

type ServeConfig struct {
	DBConfig

	AppEnv  string `env:"APP_ENV" envDefault:"development"`
	AppPort string `env:"APP_PORT" envDefault:"8080"`

	AutoMigrate bool `env:"AUTO_MIGRATE" envDefault:"true"`

	JWTSecret          string        `env:"JWT_SECRET,required"`
	JWTAccessTokenTTL  time.Duration `env:"JWT_ACCESS_TOKEN_TTL" envDefault:"15m"`
	JWTRefreshTokenTTL time.Duration `env:"JWT_REFRESH_TOKEN_TTL" envDefault:"720h"`
}
type SeedConfig struct {
	DBConfig

	OrgName       string `env:"ORG_NAME" envDefault:"mitra"`
	OrgSlug       string `env:"ORG_SLUG" envDefault:"mitra"`
	OwnerEmail    string `env:"OWNER_EMAIL"`
	OwnerName     string `env:"OWNER_NAME"`
	OwnerPassword string `env:"OWNER_PASSWORD"`
}

func loadEnv(target any) error {
	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("config: failed to load .env: %w", err)
	}
	if err := env.Parse(target); err != nil {
		return fmt.Errorf("config: failed to parse environment: %w", err)
	}
	return nil
}

func LoadDBConfig() (*DBConfig, error) {
	cfg := &DBConfig{}
	if err := loadEnv(cfg); err != nil {
		return nil, err
	}
	cfg.resolveDatabaseURL()
	return cfg, nil
}

func LoadServeConfig() (*ServeConfig, error) {
	cfg := &ServeConfig{}
	if err := loadEnv(cfg); err != nil {
		return nil, err
	}
	cfg.resolveDatabaseURL()
	return cfg, nil
}

func LoadSeedConfig() (*SeedConfig, error) {
	cfg := &SeedConfig{}
	if err := loadEnv(cfg); err != nil {
		return nil, err
	}
	cfg.resolveDatabaseURL()
	return cfg, nil
}
