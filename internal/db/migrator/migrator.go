package migrator

import (
	"database/sql"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/kiarash86/mitra/internal/db/migrations"
)

func New(databaseUrl string) (m *migrate.Migrate, closeFn func() error, err error) {

	db, err := sql.Open("pgx", databaseUrl)
	if err != nil {
		return nil, nil, fmt.Errorf("migrator: couldnt open db: %w", err)
	}
	defer func() {
		if err != nil {
			_ = db.Close()
		}
	}()

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return nil, nil, fmt.Errorf("migrator: creating postgres: %w", err)
	}

	source, err := iofs.New(migrations.FS, ".")
	if err != nil {
		return nil, nil, fmt.Errorf("migrator: creating migrate source: %w", err)

	}

	m, err = migrate.NewWithInstance("iofs", source, "postgres", driver)
	if err != nil {
		return nil, nil, fmt.Errorf("migrator: creating migrate instance: %w", err)
	}
	return m, db.Close, nil
}
