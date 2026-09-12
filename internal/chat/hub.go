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

				if len(h.rooms[id]) == 0 {
					delete(h.rooms, id)
				}
			}

		case msg := <-h.broadcast:

		}
	}
}

// Register adds a client to its project room.
func (h *Hub) Register(client *Client) {
	// TODO: send client on h.register channel (or lock + add directly)
}

// Unregister removes a client from its project room and closes its send channel.
func (h *Hub) Unregister(client *Client) {
	// TODO: send client on h.unregister channel (or lock + delete directly)
}

// Broadcast fans a message out to every connected client in the given project room.
func (h *Hub) Broadcast(projectID uuid.UUID, data []byte) {
	// TODO: push event onto h.broadcast (or iterate room directly under lock)
}
