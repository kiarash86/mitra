-- name: CreateProject :one
INSERT INTO projects (name , description)
VALUES ($1 , $2)
RETURNING *;


-- name: GetProjectByID :one
SELECT * FROM projects 
WHERE id = $1 AND deleted_at IS NULL;


-- name: UpdateProject :one 
UPDATE projects 
SET name = $2 , description = $3 , updated_at = now()
WHERE id = $1
RETURNING *;


-- name: ListProjects :many
SELECT * FROM projects 
WHERE deleted_at IS NULL
ORDER BY created_at DESC;


-- name: ListProjectsForUser :many
SELECT p.* FROM projects p
JOIN project_members pm ON pm.project_id = p.id
WHERE pm.user_id = $1 AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;


-- name: SoftDeleteProject :exec
UPDATE projects
SET deleted_at = now()
WHERE id = $1;
