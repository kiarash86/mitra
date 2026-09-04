import client from "./client";
import type { Organization, OrganizationMember, CreatedMember } from "../types/organization";
import type { OrgRoleName } from "../types/rbac";

export const organizationsApi = {
  getBySlug: (slug: string) =>
    client
      .get<Organization>(`/v1/organizations/by-slug/${slug}`)
      .then((r) => r.data),

  listMembers: (orgId: string) =>
    client
      .get<{ members: OrganizationMember[] }>(`/v1/organizations/${orgId}/members`)
      .then((r) => r.data.members),

  createMember: (orgId: string, data: { full_name: string; email: string; role: OrgRoleName }) =>
    client
      .post<CreatedMember>(`/v1/organizations/${orgId}/members`, data)
      .then((r) => r.data),

  removeMember: (orgId: string, userId: string) =>
    client
      .delete(`/v1/organizations/${orgId}/members/${userId}`)
      .then((r) => r.data),
};
