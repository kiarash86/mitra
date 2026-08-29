-- name: AddProjectMember :one 
INSERT INTO project_members (project_id , user_id , role)
WHERE ($1 , $2 , $3) 
RETURNING *;