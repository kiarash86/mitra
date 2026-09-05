package convert

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func TextToString(t pgtype.Text) string {
	if !t.Valid {
		return ""
	}
	return t.String

}

func StringToText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}

func TimeToTimestamptz(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}

	return pgtype.Timestamptz{Time: *t, Valid: true}
}

func TimestamptzToTime(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	tm := t.Time
	return &tm
}

func UUIDToPgtypeUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: [16]byte(id), Valid: true}
}

func PgtypeUUIDToStringPtr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := uuid.UUID(u.Bytes).String()
	return &s
}

func ParseDate(s *string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}

	if t, err := time.Parse(time.RFC3339, *s); err == nil {
		return &t, nil
	}

	if t, err := time.Parse("2006-01-02", *s); err == nil {
		return &t, nil
	}

	return nil, fmt.Errorf("invalid date %q: expected YYYY-MM-DD or RFC3339", *s)
}
