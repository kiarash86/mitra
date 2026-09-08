-- name: CreateMessage :one
INSERT INTO messages (project_id , sender_id , body)
Values ($1 , $2 , $3)
RETURNING *;



