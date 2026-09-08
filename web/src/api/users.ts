import client from "./client";
import type { User, CreatedUser } from "../types/auth";
import type { UserRoleName } from "../types/rbac";

export const usersApi = {
  getProfile: () =>
    client.get<User>("/v1/users/me").then((r) => r.data),

  updateProfile: (data: { full_name?: string }) =>
    client.patch<User>("/v1/users/me", data).then((r) => r.data),

  list: () =>
    client.get<{ users: User[] }>("/v1/users").then((r) => r.data.users),

  create: (data: { full_name: string; email: string; role: UserRoleName }) =>
    client.post<CreatedUser>("/v1/users", data).then((r) => r.data),

  remove: (userId: string) =>
    client.delete(`/v1/users/${userId}`).then((r) => r.data),
};
