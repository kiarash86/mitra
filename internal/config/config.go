package config

import (
	"fmt"
	"time"

	"github.com/caarlos0/env/v11"
)

type Config struct {
	AppEnv  string `env:"APP_ENV" envDefault:"development"`
	AppPort string `env:"APP_PORT" envDefault:"8080"`

	DatabaseURL string `env:"DATABASE_URL"`
	DBHost      string `env:"DB_HOST" envDefault:"localhost"`
	DBPort      string `env:"DB_PORT" envDefault:"5432"`
	DBUser      string `env:"DB_USER" envDefault:"mitra"`
	DBPassword  string `env:"DB_PASSWORD" envDefault:"mitra"`
	DBName      string `env:"DB_NAME" envDefault:"mitra"`
	DBSSLMode   string `env:"DB_SSLMODE" envDefault:"disable"`

	JWTSecret          string        `env:"JWT_SECRET,required"`
	JWTAccessTokenTTL  time.Duration `env:"JWT_ACCESS_TOKEN_TTL" envDefault:"15m"`
	JWTRefreshTokenTTL time.Duration `env:"JWT_REFRESH_TOKEN_TTL" envDefault:"720h"`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, fmt.Errorf("config: failed to parse environment: %w", err)
	}

	if cfg.DatabaseURL == "" {
		cfg.DatabaseURL = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=%s",
			cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.DBSSLMode,
		)
	}

	return cfg, nil
}
