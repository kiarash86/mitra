-- name: CreateOrganization :one
INSERT INTO organizatins (name ,slug)
VALUES($1 , $2)
RETURNING *;


-- name: GetOrganizationBySlug :one
SELECT * FROM organizations
WHERE slug= $1;

