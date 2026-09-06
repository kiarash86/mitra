package migrator

import (
	"database/sql"
	"errors"
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

func Up(databaseUrl string) error {
	m, closeFn, err := New(databaseUrl)
	if err != nil {
		return err
	}
	defer closeFn()

	err = m.Up()

	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migrator: up: %w", err)

	}
	return nil
}

func Down(databaseUrl string) error {
	m, closeFn, err := New(databaseUrl)
	if err != nil {
		return err
	}
	defer closeFn()

	err = m.Down()

	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migrator: down: %w", err)

	}
	return nil
}

func Force(databaseUrl string, version int) error {
	m, closeFn, err := New(databaseUrl)
	if err != nil {
		return err
	}
	defer closeFn()

	err = m.Force(version)

	if err != nil {
		return fmt.Errorf("migrator: force: %w", err)

	}
	return nil
}

func Steps(databaseUrl string, num int) error {
	m, closeFn, err := New(databaseUrl)
	if err != nil {
		return err
	}
	defer closeFn()

	err = m.Steps(num)

	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migrator: steps: %w", err)

	}
	return nil
}

func Version(databaseUrl string) (version uint, dirty bool, err error) {
	m, closeFn, err := New(databaseUrl)
	if err != nil {
		return 0, false, fmt.Errorf("migrator: version: %w", err)
	}
	defer closeFn()

	version, dirty, err = m.Version()

	if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
		return 0, false, fmt.Errorf("migrator: version: %w", err)

	}
	return version, dirty, nil
}
