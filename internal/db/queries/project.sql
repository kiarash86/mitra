-- name: CreateProject :one
INSERT INTO projects (organization_id , name , description)
VALUES ($1 , $2 , $3)
RETURNING *;