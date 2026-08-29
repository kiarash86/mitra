-- name: AddProjectMember :one
INSERT INTO   project_members (project_id , user_id , role)
VALUES ($1  , $2  , $3 )
RETURNING *;

-- name: GetProjectMemberRole :one
SELECT role FROM project_members
WHERE project_id = $1 AND  user_id = $2;


-- name: ListProjectMembers :many
SELECT pm.*, u.email, u.full_name
FROM project_members pm
JOIN users u ON u.id = pm.user_id
WHERE pm.project_id = $1;


-- name: RemoveProjectMember :exec
DELETE FROM project_members
WHERE project_id = $1 AND user_id = $2;
