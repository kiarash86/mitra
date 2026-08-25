-- name : AddTeamMember : one 
INSERT INTO   team_members (team_id , user_id , role)
VALUES ($1  , $2  , $3 )
RETURNING *;

-- name: GetTeamMemberRole :one
SELECT role FROM team_members 
WHERE team_id = $1 AND  user_id = $2;



-- name: ListTeamMembers :many
SELECT tm.*, u.email, u.full_name
FROM team_members tm
JOIN users u ON u.id = tm.user_id
WHERE tm.team_id = $1;
 
 
-- name: RemoveTeamMember :exec
DELETE FROM team_members
WHERE team_id = $1 AND user_id = $2;
 
