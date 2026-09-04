import client from "./client";
import type { AuthResponse, LoginRequest, ChangePasswordRequest } from "../types/auth";

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<AuthResponse>("/v1/auth/login", data).then((r) => r.data),

  changePassword: (data: ChangePasswordRequest) =>
    client.post<void>("/v1/auth/change-password", data).then((r) => r.data),
};
