package convert

import (
	"time"

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
