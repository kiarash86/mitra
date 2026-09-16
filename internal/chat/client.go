package chat

import (
	"context"
	"encoding/json"
	"log"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"github.com/kiarash86/mitra/internal/db/sqlc"
	"github.com/kiarash86/mitra/internal/rbac"
)

type Client struct {
	hub       *Hub
	conn      *websocket.Conn
	send      chan []byte
	userID    uuid.UUID
	projectID uuid.UUID
}

func NewClient(hub *Hub, conn *websocket.Conn, userID, projectID uuid.UUID) *Client {
	return &Client{
		hub:       hub,
		conn:      conn,
		send:      make(chan []byte, 256),
		userID:    userID,
		projectID: projectID,
	}
}

func (c *Client) ReadPump(queries sqlc.Querier) {
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

		body, err := SanitizeMessageBody(inbmsg.Body)
		if err != nil {
			continue
		}

		canWrite, err := rbac.CanWriteProject(context.Background(), queries, c.projectID, c.userID)
		if err != nil {
			log.Println("failed to check write permission:", err)
			continue
		}
		if !canWrite {
			log.Println("rejected message from user without write permission:", c.userID)
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

func (c *Client) WritePump() {
	defer func() {
		c.conn.Close()
	}()

	for {
		data, ok := <-c.send
		if !ok {
			return
		}

		if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
			return
		}
	}
}
