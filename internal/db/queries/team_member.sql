-- name : AddTeamMember : one 
INSERT INTO   team_members (team_id , user_id , role)
VALUES ($1  , $2  , $3 )
RETURNING *;

-- name: GetTeamMemberRole :one
SELECT role FROM team_members 
WHERE team_id = $1 AND  user_id = $2;

