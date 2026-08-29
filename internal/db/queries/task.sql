-- name: CreateTask :one
INSERT INTO tasks (project_id, title, description, priority, due_date, created_by)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;


-- name: GetTaskByID :one
SELECT * FROM task 
WHERE id = $1;


-- name: ListTasksByProject :many
SELECT * FROM task
WHERE project_id = $1 
ORDER BY created_at DESC;