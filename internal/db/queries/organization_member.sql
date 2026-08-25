-- name : AddOrganizationMember : one 
INSERT INTO   organization_members (organization_id , user_id , role)
VALUES ($1  , $2  , $3 )
RETURNING *;

-- name: GetOrganizationMemberRole :one
SELECT role FROM organization_members 
WHERE organization_id = $1 AND  user_id = $2;

