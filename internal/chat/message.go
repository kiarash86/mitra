package chat

import (
	"time"

	"github.com/google/uuid"
)

// InboundMessage is what the browser sends over the WebSocket to post a new chat message.
type InboundMessage struct {
	Body string `json:"body"`
}

// OutboundEvent is what the server pushes to every client in a room —
// covers new messages as well as edit/delete notifications.
type OutboundEvent struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

type MessagePayload struct {
	ID         uuid.UUID `json:"id"`
	ProjectID  uuid.UUID `json:"project_id"`
	SenderID   uuid.UUID `json:"sender_id"`
	SenderName string    `json:"sender_name"`
	Body       string    `json:"body"`
	CreatedAt  time.Time `json:"created_at"`
}
