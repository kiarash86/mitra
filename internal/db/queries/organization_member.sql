-- name : AddOrganizationMember : one 
INSERT INTO   organization_members (organization_id , user_id , role)
VALUES ($1  , $2  , $3 )
RETURNING *;
