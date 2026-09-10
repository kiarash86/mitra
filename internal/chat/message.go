package chat

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
