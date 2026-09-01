import client from "./client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth";

export const authApi = {
  register: (data: RegisterRequest) =>
    client.post<AuthResponse>("/v1/auth/register", data).then((r) => r.data),

  login: (data: LoginRequest) =>
    client.post<AuthResponse>("/v1/auth/login", data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    client
      .post<AuthResponse>("/v1/auth/refresh", { refresh_token: refreshToken })
      .then((r) => r.data),
};
