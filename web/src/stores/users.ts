import { create } from "zustand";
import type { User, CreatedUser } from "../types/auth";
import type { UserRoleName } from "../types/rbac";
import { usersApi } from "../api/users";

interface UsersState {
  users: User[];
  isLoading: boolean;
  hasFetched: boolean;

  fetchUsers: () => Promise<void>;
  createUser: (data: { full_name: string; email: string; role: UserRoleName }) => Promise<CreatedUser>;
  removeUser: (userId: string) => Promise<void>;
}

// The single roster of user accounts for this (single-tenant) deployment —
// replaces the old per-organization member list.
export const useUsersStore = create<UsersState>()((set) => ({
  users: [],
  isLoading: false,
  hasFetched: false,

  fetchUsers: async () => {
    set({ isLoading: true });
    const users = await usersApi.list();
    set({ users, isLoading: false, hasFetched: true });
  },

  // The created user is a brand-new account (see CreatedUser) — the caller
  // is responsible for surfacing temp_password to the admin, since it's
  // only ever returned this once.
  createUser: async (data) => {
    const created = await usersApi.create(data);
    const users = await usersApi.list();
    set({ users });
    return created;
  },

  removeUser: async (userId) => {
    await usersApi.remove(userId);
    const users = await usersApi.list();
    set({ users });
  },
}));
