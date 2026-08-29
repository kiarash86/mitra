-- name: CreateProject :one
INSERT INTO projects (organization_id , name , description)
VALUES ($1 , $2 , $3)
RETURNING *;


-- name: GetProjectByID :one
SELECT * FROM projects 
WHERE id = $1;