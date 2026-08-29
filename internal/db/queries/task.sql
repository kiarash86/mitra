-- name: CreateTask :one
INSERT INTO tasks (project_id, title, description, priority, due_date, created_by)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;