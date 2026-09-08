import type { UserRoleName } from "./rbac";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRoleName;
  must_change_password: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

/** Response from creating a user — the account is brand new, so the
 * server hands back the generated password once (never persisted client-side). */
export interface CreatedUser {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRoleName;
  temp_password: string;
}
