import client from "./client";
import type { Comment } from "../types/task";

export const commentsApi = {
  listByTask: (taskId: string) =>
    client
      .get<{ comments: Comment[] }>(`/v1/tasks/${taskId}/comments`)
      .then((r) => r.data.comments),

  create: (taskId: string, data: { body: string }) =>
    client
      .post<Comment>(`/v1/tasks/${taskId}/comments`, data)
      .then((r) => r.data),

  update: (commentId: string, data: { body: string }) =>
    client
      .put<Comment>(`/v1/comments/${commentId}`, data)
      .then((r) => r.data),

  delete: (commentId: string) =>
    client.delete(`/v1/comments/${commentId}`).then((r) => r.data),
};