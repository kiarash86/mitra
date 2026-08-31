package convert

import "github.com/jackc/pgx/v5/pgtype"

func TextToString(t pgtype.Text) string {
	if !t.Valid {
		return ""
	}
	return t.String

}
