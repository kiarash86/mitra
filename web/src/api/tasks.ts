import client from "./client";
import type { Task, TaskStatus, TaskPriority } from "../types/task";

export const tasksApi = {
  create: (
    projectId: string,
    data: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      assigned_to_user_id?: string;
      assigned_to_team_id?: string;
      due_date?: string;
    }
  ) =>
    client
      .post<Task>(`/api/projects/${projectId}/tasks`, data)
      .then((r) => r.data),

  listByProject: (projectId: string, params?: { status?: TaskStatus }) =>
    client
      .get<Task[]>(`/api/projects/${projectId}/tasks`, { params })
      .then((r) => r.data),

  getById: (taskId: string) =>
    client.get<Task>(`/api/tasks/${taskId}`).then((r) => r.data),

  update: (
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigned_to_user_id?: string | null;
      assigned_to_team_id?: string | null;
      due_date?: string | null;
    }
  ) =>
    client.patch<Task>(`/api/tasks/${taskId}`, data).then((r) => r.data),

  delete: (taskId: string) =>
    client.delete(`/api/tasks/${taskId}`).then((r) => r.data),
};
