import client from "./client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth";

export const authApi = {
  register: (data: RegisterRequest) =>
    client.post<AuthResponse>("/api/auth/register", data).then((r) => r.data),

  login: (data: LoginRequest) =>
    client.post<AuthResponse>("/api/auth/login", data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    client
      .post<AuthResponse>("/api/auth/refresh", { refresh_token: refreshToken })
      .then((r) => r.data),
};
