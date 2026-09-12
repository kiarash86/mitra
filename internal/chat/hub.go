package chat

import (
	"github.com/google/uuid"
)

type roomMessage struct {
	projectID uuid.UUID
	data      []byte
}

// Hub keeps track of every connected Client, grouped by project (room),
// and fans out incoming messages to every other client in the same room.
// Single-instance only — no Redis/NATS backing, per the project's phase-1 decision.
type Hub struct {
	rooms      map[uuid.UUID]map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan roomMessage
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[uuid.UUID]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan roomMessage),
	}
}

// Run starts the hub's event loop. Intended to be launched once via `go hub.Run()`
// at application startup (cmd/api/main.go).
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			Id := client.projectID
			if _, ok := h.rooms[Id]; ok {
				h.rooms[Id][client] = true
			} else {
				h.rooms[Id] = make(map[*Client]bool)
				h.rooms[Id][client] = true
			}

		case client := <-h.unregister:
			id := client.projectID

			if _, ok := h.rooms[id]; ok {
				delete(h.rooms[id], client)
				close(client.send)

				if len(h.rooms[id]) == 0 {
					delete(h.rooms, id)
				}
			}

		case msg := <-h.broadcast:
			Id := msg.projectID
			for c := range h.rooms[Id] {
				select {
				case c.send <- msg.data:
				default:
					close(c.send)
					delete(h.rooms[Id], c)
				}
			}
		}
	}
}

// Register adds a client to its project room.
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister removes a client from its project room and closes its send channel.
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// Broadcast fans a message out to every connected client in the given project room.
func (h *Hub) Broadcast(projectID uuid.UUID, data []byte) {
	h.broadcast <- roomMessage{
		projectID: projectID,
		data:      data,
	}
}
