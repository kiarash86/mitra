package chat

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type InboundMessage struct {
	Body string `json:"body"`
}

const MaxMessageBodyLength = 10000

var (
	ErrEmptyMessageBody   = errors.New("body cannot be empty or whitespace")
	ErrMessageBodyTooLong = errors.New("body must be at most 10000 characters")
)

func SanitizeMessageBody(body string) (string, error) {
	trimmed := strings.TrimSpace(body)
	if trimmed == "" {
		return "", ErrEmptyMessageBody
	}
	if len(trimmed) > MaxMessageBodyLength {
		return "", ErrMessageBodyTooLong
	}
	return trimmed, nil
}

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

type DeletedMessagePayload struct {
	ID uuid.UUID `json:"id"`
}
