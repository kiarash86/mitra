import client from "./client";
import type { Notification } from "../types/notification";

export const notificationsApi = {
  list: (params?: { read?: boolean }) =>
    client
      .get<Notification[]>("/v1/notifications", { params })
      .then((r) => r.data),

  markAsRead: (notificationId: string) =>
    client
      .patch<Notification>(`/v1/notifications/${notificationId}/read`)
      .then((r) => r.data),

  markAllAsRead: () =>
    client.patch("/v1/notifications/read-all").then((r) => r.data),
};
