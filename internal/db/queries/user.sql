-- name: CreateUser : one 
INSERT INTO users (email , password_hash , full_name)
VALUES ($1 ,$2 , $3)
RETURNING *;

