-- name: CreateOrganization: one
INSERT INTO organizatins (name ,slug)
VALUES($1 , $2)
RETURNING *;


-- name: GetOrganizationBySlug: one
SELECT * FROM organizatinS
WHERE slug= $1;

