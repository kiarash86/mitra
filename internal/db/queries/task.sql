-- name: CreateTask :one
INSERT INTO tasks (project_id, title, description, priority, due_date, created_by)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetTaskByID :one
SELECT * FROM tasks
WHERE id = $1;

-- name: ListTasksByProject :many
SELECT * FROM tasks
WHERE project_id = $1
ORDER BY created_at DESC;

-- name: ListTasksAssignedToUser :many
SELECT * FROM tasks
WHERE assigned_to_user_id = $1
ORDER BY due_date ASC NULLS LAST;

-- name: ListTasksAssignedToTeam :many
SELECT * FROM tasks
WHERE assigned_to_team_id = $1
ORDER BY due_date ASC NULLS LAST;

-- name: UpdateTask :one
UPDATE tasks
SET title = $2, description = $3, priority = $4, due_date = $5, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdateTaskStatus :one
UPDATE tasks
SET status = $2, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: AssignTaskToUser :one
UPDATE tasks
SET assigned_to_user_id = $2, assigned_to_team_id = NULL, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: AssignTaskToTeam :one
UPDATE tasks
SET assigned_to_team_id = $2, assigned_to_user_id = NULL, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UnassignTask :one
UPDATE tasks
SET assigned_to_user_id = NULL, assigned_to_team_id = NULL, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: SoftDeleteTask :exec
UPDATE tasks
SET deleted_at = now()
WHERE id = $1;
