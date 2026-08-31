import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/auth";
import { authApi } from "../api/auth";
import { usersApi } from "../api/users";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.login({ email, password });
          set({
            user: res.user,
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response?.data
              ?.error ?? "Login failed";
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (fullName, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.register({
            full_name: fullName,
            email,
            password,
          });
          set({
            user: res.user,
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response?.data
              ?.error ?? "Registration failed";
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
      },

      updateProfile: async (fullName) => {
        const user = await usersApi.updateProfile({ full_name: fullName });
        set({ user });
      },

      clearError: () => set({ error: null }),
    }),
    { name: "auth-storage" }
  )
);
