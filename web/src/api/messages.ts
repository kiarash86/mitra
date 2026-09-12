import client from "./client";
import type { MessageHistoryRow } from "../types/chat";

// Shape returned directly by the backend's sqlc.Message (UpdateMessage) —
// no joined user info, unlike the history endpoint.
interface RawMessage {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export const messagesApi = {
  // Returns the most recent `limit` messages older than `before` (if given),
  // ordered newest-first — matches ListMessagesByProject on the backend.
  listByProject: (projectId: string, params?: { before?: string; limit?: number }) =>
    client
      .get<{ messages: MessageHistoryRow[] }>(`/v1/projects/${projectId}/messages`, { params })
      .then((r) => r.data.messages),

  update: (messageId: string, data: { body: string }) =>
    client
      .put<{ message: RawMessage }>(`/v1/messages/${messageId}`, data)
      .then((r) => r.data.message),

  delete: (messageId: string) =>
    client.delete(`/v1/messages/${messageId}`).then((r) => r.data),
};

