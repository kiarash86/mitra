-- name: CreateProject :one
INSERT INTO projects (name , description)
VALUES ($1 , $2)
RETURNING *;


-- name: GetProjectByID :one
SELECT * FROM projects 
WHERE id = $1;


-- name: UpdateProject :one 
UPDATE projects 
SET name = $2 , description = $3 , updated_at = now()
WHERE id = $1
RETURNING *;


-- name: ListProjects :many
SELECT * FROM projects 
ORDER BY created_at DESC;


-- name: SoftDeleteProject :exec
UPDATE projects
SET deleted_at = now()
WHERE id = $1;
