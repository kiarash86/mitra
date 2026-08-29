-- name: CreateProject :one
INSERT INTO projects (organization_id , name , description)
VALUES ($1 , $2 , $3)
RETURNING *;


-- name: GetProjectByID :one
SELECT * FROM projects 
WHERE id = $1;


-- name: UpdateProject :one 
UPDATE projects 
SET name = $2 , description = $3 , updated_at = now()
WHERE id = $1
RETURNING *;


-- name: ListProjectsByOrganization :many
SELECT * FROM projects 
WHERE organization_id = $1 
ORDER BY created_at DESC;


-- name: SoftDeleteProject :exec
UPDATE projects
SET deleted_at = now()
WHERE id = $1;