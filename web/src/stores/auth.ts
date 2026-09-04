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

  login: (email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login({ email, password });
          set({
            user: res.user,
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      // Resolves the account's must_change_password flag on success — the
      // API returns 204 with no body, so the user object is patched locally
      // rather than re-fetched.
      changePassword: async (currentPassword, newPassword) => {
        await authApi.changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
        const user = get().user;
        if (user) set({ user: { ...user, must_change_password: false } });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
      },

      updateProfile: async (fullName) => {
        const user = await usersApi.updateProfile({ full_name: fullName });
        set({ user });
      },
    }),
    { name: "auth-storage" }
  )
);
