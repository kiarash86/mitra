package chat

import (
	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"github.com/kiarash86/mitra/internal/db/sqlc"
)

// Client wraps a single WebSocket connection belonging to one user inside one project room.
type Client struct {
	hub       *Hub
	conn      *websocket.Conn
	send      chan []byte
	userID    uuid.UUID
	projectID uuid.UUID
}

func NewClient(hub *Hub, conn *websocket.Conn, userID, projectID uuid.UUID) *Client {
	return &Client{
		hub:       hub,  // همون Hub که از بیرون پاس داده شده
		conn:      conn, // همون websocket.Conn که از بیرون پاس داده شده
		send:      make(chan []byte, 256),
		userID:    userID,
		projectID: projectID,
	}
}

// ReadPump reads inbound JSON messages from the browser, persists them via queries,
// and hands them to the hub for broadcast. Must run in its own goroutine;
// exits (and unregisters the client) when the connection closes or errors.
func (c *Client) ReadPump(queries *sqlc.Queries) {
	defer func() {
		c.hub.rooms[c.projectID][c] = false

	}()
	for {
		var inbmsg InboundMessage
		err := c.conn.ReadJSON(&inbmsg)
		if err != nil {
			break
		}

	}
}

// WritePump drains the client's send channel and writes each message out to the
// browser's WebSocket connection. Must run in its own goroutine; exits when
// the send channel is closed (by Hub.Unregister) or a write fails.
func (c *Client) WritePump() {
	// TODO: defer c.conn.Close()
	// TODO: loop over c.send, c.conn.WriteMessage(websocket.TextMessage, msg)
	// TODO: periodic ping/pong to keep connection alive (time.Ticker)
}
