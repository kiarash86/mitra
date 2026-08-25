-- name: CreateTeam :one 
INSERT INTO teams (organization_id , name)
VALUES($1 , $2)
RETURNING *;

-- name: GetTeamByID :one 
SELECT * FROM teams 
WHERE id = $1;


-- name: ListTeamsByOrganization :many 
SELECT * FROM teams 
WHERE organization_id = $1;


-- name: SoftDeleteTeam :exec
UPDATE teams
SET deleted_at = now()
WHERE id = $1;
