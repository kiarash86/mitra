-- name: CreateOrganization: one
INSERT INTO organizatins (name ,slug)
VALUES($1 , $2)
RETURNING *;
