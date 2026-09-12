package chat

import (
	"context"
	"encoding/json"
	"log"
	"strings"

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
		c.hub.Unregister(c)
		c.conn.Close()
	}()
	for {
		var inbmsg InboundMessage
		err := c.conn.ReadJSON(&inbmsg)
		if err != nil {
			break
		}

		body := strings.TrimSpace(inbmsg.Body)
		if body == "" {
			continue
		}

		msg, err := queries.CreateMessage(context.Background(), sqlc.CreateMessageParams{
			ProjectID: c.projectID,
			SenderID:  c.userID,
			Body:      body,
		})
		if err != nil {
			log.Println("failed to save message:", err)
			continue
		}

		usr, err := queries.GetUserByID(context.Background(), msg.SenderID)
		if err != nil {
			log.Println("failed to fetch sender:", err)
			continue
		}

		event := OutboundEvent{
			Type: "message.created",
			Payload: MessagePayload{
				ID:         msg.ID,
				ProjectID:  msg.ProjectID,
				SenderID:   msg.SenderID,
				SenderName: usr.FullName,
				Body:       msg.Body,
				CreatedAt:  msg.CreatedAt,
			},
		}

		data, err := json.Marshal(event)
		if err != nil {
			log.Println("failed to marshal event:", err)
			continue
		}

		c.hub.Broadcast(c.projectID, data)

	}
}

// WritePump drains the client's send channel and writes each message out to the
// browser's WebSocket connection. Must run in its own goroutine; exits when
// the send channel is closed (by Hub.Unregister) or a write fails.
func (c *Client) WritePump() {
	defer func() {
		c.conn.Close()
	}()

	for {

	}
}
