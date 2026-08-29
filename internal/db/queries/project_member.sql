-- name: AddProjectMember :one 
INSERT INTO project_members (project_id , user_id , role)
WHERE ($1 , $2 , $3) 
RETURNING *;


-- name: GetProjectMemberRole :one 
SELECT role FROM project_members 
WHERE project_id = $1 AND user_id = $2;


-- name: ListProjectMembers :many
SELECT pm.* , u.full_name , u.email
FROM project_members pm 
JOIN user u ON u.id = pm.user_id
WHERE project_id = $1;