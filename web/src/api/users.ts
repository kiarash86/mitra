import client from "./client";
import type { User } from "../types/auth";

export const usersApi = {
  getProfile: () =>
    client.get<User>("/api/users/me").then((r) => r.data),

  updateProfile: (data: { full_name?: string }) =>
    client.patch<User>("/api/users/me", data).then((r) => r.data),
};
