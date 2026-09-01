import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Organization, OrganizationMember } from "../types/organization";
import { organizationsApi } from "../api/organizations";

interface OrganizationState {
  currentOrg: Organization | null;
  organizations: Organization[];
  members: OrganizationMember[];
  isLoading: boolean;

  setCurrentOrg: (org: Organization) => void;
  createOrganization: (name: string, slug: string) => Promise<Organization>;
  fetchBySlug: (slug: string) => Promise<void>;
  fetchMembers: (orgId: string) => Promise<void>;
  addMember: (orgId: string, userId: string, role: string) => Promise<void>;
  removeMember: (orgId: string, userId: string) => Promise<void>;
}

// currentOrg is persisted (like auth-storage) since there is no "list my
// organizations" endpoint yet — without this, org context would be lost on
// every page refresh.
export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrg: null,
      organizations: [],
      members: [],
      isLoading: false,

      setCurrentOrg: (org) => set({ currentOrg: org }),

      createOrganization: async (name, slug) => {
        const org = await organizationsApi.create({ name, slug });
        set({ currentOrg: org });
        return org;
      },

      fetchBySlug: async (slug) => {
        set({ isLoading: true });
        try {
          const org = await organizationsApi.getBySlug(slug);
          set({ currentOrg: org, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      fetchMembers: async (orgId) => {
        const members = await organizationsApi.listMembers(orgId);
        set({ members });
      },

      addMember: async (orgId, userId, role) => {
        await organizationsApi.addMember(orgId, { user_id: userId, role });
        const members = await organizationsApi.listMembers(orgId);
        set({ members });
      },

      removeMember: async (orgId, userId) => {
        await organizationsApi.removeMember(orgId, userId);
        const members = await organizationsApi.listMembers(orgId);
        set({ members });
      },
    }),
    {
      name: "organization-storage",
      partialize: (s) => ({ currentOrg: s.currentOrg }),
      merge: (persisted, current) => ({
        ...current,
        currentOrg: (persisted as Partial<OrganizationState> | undefined)?.currentOrg ?? current.currentOrg,
      }),
    },
  ),
);