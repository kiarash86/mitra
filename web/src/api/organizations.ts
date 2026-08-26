import client from "./client";
import type { Organization, OrganizationMember } from "../types/organization";

export const organizationsApi = {
  create: (data: { name: string; slug: string }) =>
    client.post<Organization>("/api/organizations", data).then((r) => r.data),

  getBySlug: (slug: string) =>
    client
      .get<Organization>(`/api/organizations/${slug}`)
      .then((r) => r.data),

  listMembers: (orgId: string) =>
    client
      .get<OrganizationMember[]>(`/api/organizations/${orgId}/members`)
      .then((r) => r.data),

  addMember: (orgId: string, data: { user_id: string; role: string }) =>
    client
      .post<OrganizationMember>(`/api/organizations/${orgId}/members`, data)
      .then((r) => r.data),

  removeMember: (orgId: string, userId: string) =>
    client
      .delete(`/api/organizations/${orgId}/members/${userId}`)
      .then((r) => r.data),
};
