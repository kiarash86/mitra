import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Organization, OrganizationMember, CreatedMember } from "../types/organization";
import type { OrgRoleName } from "../types/rbac";
import { organizationsApi } from "../api/organizations";

interface OrganizationState {
  currentOrg: Organization | null;
  members: OrganizationMember[];
  isLoading: boolean;

  setCurrentOrg: (org: Organization) => void;
  fetchBySlug: (slug: string) => Promise<void>;
  fetchMembers: (orgId: string) => Promise<void>;
  createMember: (
    orgId: string,
    data: { full_name: string; email: string; role: OrgRoleName },
  ) => Promise<CreatedMember>;
  removeMember: (orgId: string, userId: string) => Promise<void>;
}

// currentOrg is persisted (like auth-storage) since there is no "list my
// organizations" endpoint — without this, org context would be lost on
// every page refresh. There is exactly one organization per deployment
// (see ORG_SLUG in lib/constants.ts), fetched once via fetchBySlug.
export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrg: null,
      members: [],
      isLoading: false,

      setCurrentOrg: (org) => set({ currentOrg: org }),

      fetchBySlug: async (slug) => {
        set({ isLoading: true });
        try {
          const org = await organizationsApi.getBySlug(slug);
          set({ currentOrg: org, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      fetchMembers: async (orgId) => {
        const members = await organizationsApi.listMembers(orgId);
        set({ members });
      },

      // The member is a brand-new account (see CreatedMember) — the caller
      // is responsible for surfacing temp_password to the admin, since it's
      // only ever returned this once.
      createMember: async (orgId, data) => {
        const created = await organizationsApi.createMember(orgId, data);
        const members = await organizationsApi.listMembers(orgId);
        set({ members });
        return created;
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
