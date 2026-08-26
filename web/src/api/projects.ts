import client from "./client";
import type { Project, ProjectMember } from "../types/project";

export const projectsApi = {
  create: (orgId: string, data: { name: string; description?: string }) =>
    client
      .post<Project>(`/api/organizations/${orgId}/projects`, data)
      .then((r) => r.data),

  listByOrganization: (orgId: string) =>
    client
      .get<Project[]>(`/api/organizations/${orgId}/projects`)
      .then((r) => r.data),

  getById: (projectId: string) =>
    client.get<Project>(`/api/projects/${projectId}`).then((r) => r.data),

  update: (projectId: string, data: { name?: string; description?: string }) =>
    client
      .patch<Project>(`/api/projects/${projectId}`, data)
      .then((r) => r.data),

  delete: (projectId: string) =>
    client.delete(`/api/projects/${projectId}`).then((r) => r.data),

  listMembers: (projectId: string) =>
    client
      .get<ProjectMember[]>(`/api/projects/${projectId}/members`)
      .then((r) => r.data),

  addMember: (projectId: string, data: { user_id: string; role: string }) =>
    client
      .post<ProjectMember>(`/api/projects/${projectId}/members`, data)
      .then((r) => r.data),

  removeMember: (projectId: string, userId: string) =>
    client
      .delete(`/api/projects/${projectId}/members/${userId}`)
      .then((r) => r.data),
};
