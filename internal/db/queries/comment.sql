-- name: CreateComment :one
INSERT INTO comments (task_id , author_id , body)
Values ($1 , $2 , $3)
RETURNING *;


-- name: GetCommentByID :one
SELECT * FROM comments
WHERE id = $1;


-- name: ListCommentsByTask :many
SELECT c.* , u.full_name , u.email
FROM comments c
JOIN users u ON u.id = c.author_id
WHERE c.task_id= $1
ORDER BY c.created_at ASC;