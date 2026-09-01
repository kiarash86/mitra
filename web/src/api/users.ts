import client from "./client";
import type { User } from "../types/auth";

export const usersApi = {
  getProfile: () =>
    client.get<User>("/v1/users/me").then((r) => r.data),

  updateProfile: (data: { full_name?: string }) =>
    client.patch<User>("/v1/users/me", data).then((r) => r.data),
};
