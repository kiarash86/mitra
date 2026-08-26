import client from "./client";
import type { Comment } from "../types/task";

export const commentsApi = {
  listByTask: (taskId: string) =>
    client
      .get<Comment[]>(`/api/tasks/${taskId}/comments`)
      .then((r) => r.data),

  create: (taskId: string, data: { body: string }) =>
    client
      .post<Comment>(`/api/tasks/${taskId}/comments`, data)
      .then((r) => r.data),

  update: (commentId: string, data: { body: string }) =>
    client
      .patch<Comment>(`/api/comments/${commentId}`, data)
      .then((r) => r.data),

  delete: (commentId: string) =>
    client.delete(`/api/comments/${commentId}`).then((r) => r.data),
};
