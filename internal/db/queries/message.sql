-- name: CreateMessage :one
INSERT INTO messages (project_id , sender_id , body)
Values ($1 , $2 , $3)
RETURNING *;


-- name: GetMessageByID :one
SELECT * FROM messages
WHERE id = $1;


-- name: ListMessagesByProject :many
SELECT m.* , u.full_name , u.email
FROM messages m
JOIN users u ON u.id = m.sender_id
WHERE m.project_id = $1
    AND m.deleted_at IS NULL
    AND (sqlc.narg(before)::timestamptz IS NULL OR m.created_at < sqlc.narg(before))
ORDER BY m.created_at DESC
LIMIT $2;


-- name: UpdateMessage :one
UPDATE messages
SET body = $2 , updated_at = now()
WHERE id = $1
RETURNING *;


-- name: SoftDeleteMessage :exec
UPDATE messages
SET deleted_at = now()
WHERE id = $1;