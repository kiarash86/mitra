import client from "./client";
import type { Notification } from "../types/notification";

export const notificationsApi = {
  list: (params?: { read?: boolean }) =>
    client
      .get<Notification[]>("/api/notifications", { params })
      .then((r) => r.data),

  markAsRead: (notificationId: string) =>
    client
      .patch<Notification>(`/api/notifications/${notificationId}/read`)
      .then((r) => r.data),

  markAllAsRead: () =>
    client.patch("/api/notifications/read-all").then((r) => r.data),
};
