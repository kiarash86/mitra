-- name: CreateUser :one 
INSERT INTO users (email , password_hash , full_name)
VALUES ($1 ,$2 , $3)
RETURNING *;


-- name: GetUserByEmail :one
SELECT * FROM  users 
WHERE email=$1 ;


-- name: GetUserByID :one
SELECT * FROM  users 
WHERE id=$1 ;


-- name: UpdateUserProfile :one
UPDATE users
SET full_name = $2, updated_at = now()
WHERE id = $1
RETURNING *;
 

-- name: SoftDeleteUser :exec
UPDATE users
SET deleted_at = now()
where id= $1;

-- name: UpdateUserPassword :exec
UPDATE users
SET password_hash= $2 , must_change_password = false , updated_at = now()
WHERE id = $1;