-- name: CreateComment :one
INSERT INTO comments (task_id , author_id , body)
Values ($1 , $2 , $3)
RETURNING *;


-- name: GetCommentByID :one
SELECT * FROM comments
WHERE id = $1;