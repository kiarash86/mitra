export interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
}

// Shape returned by GET /projects/:id/messages (REST history) — the sqlc row
// joins users directly, so the sender's name comes back as full_name rather
// than the sender_name field used by the WebSocket payload.
export interface MessageHistoryRow {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
}

export function messageFromHistoryRow(row: MessageHistoryRow): Message {
  return {
    id: row.id,
    project_id: row.project_id,
    sender_id: row.sender_id,
    sender_name: row.full_name,
    body: row.body,
    created_at: row.created_at,
  };
}

// Wire format pushed by the server over the WebSocket (see internal/chat/message.go).
export type ChatEvent =
  | { type: "message.created"; payload: Message }
  | { type: "message.updated"; payload: Message }
  | { type: "message.deleted"; payload: { id: string } };
