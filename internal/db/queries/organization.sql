-- name: CreateOrganization :one
INSERT INTO organizations (name ,slug)
VALUES($1 , $2)
RETURNING *;


-- name: GetOrganizationBySlug :one
SELECT * FROM organizations
WHERE slug= $1;

-- name: AnyOrganizationExists :one
SELECT EXISTS (SELECT 1 FROM organizations)