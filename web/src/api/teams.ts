import client from "./client";
import type { Team, TeamMember } from "../types/team";

export const teamsApi = {
  create: (orgId: string, data: { name: string }) =>
    client
      .post<Team>(`/api/organizations/${orgId}/teams`, data)
      .then((r) => r.data),

  listByOrganization: (orgId: string) =>
    client
      .get<Team[]>(`/api/organizations/${orgId}/teams`)
      .then((r) => r.data),

  getById: (teamId: string) =>
    client.get<Team>(`/api/teams/${teamId}`).then((r) => r.data),

  listMembers: (teamId: string) =>
    client
      .get<TeamMember[]>(`/api/teams/${teamId}/members`)
      .then((r) => r.data),

  addMember: (teamId: string, data: { user_id: string; role: string }) =>
    client
      .post<TeamMember>(`/api/teams/${teamId}/members`, data)
      .then((r) => r.data),

  removeMember: (teamId: string, userId: string) =>
    client
      .delete(`/api/teams/${teamId}/members/${userId}`)
      .then((r) => r.data),

  delete: (teamId: string) =>
    client.delete(`/api/teams/${teamId}`).then((r) => r.data),
};
