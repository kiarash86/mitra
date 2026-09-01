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
      due_date?: string;
    }
  ) =>
    client
      .post<Task>(`/v1/projects/${projectId}/tasks`, data)
      .then((r) => r.data),

  listByProject: (projectId: string, params?: { status?: TaskStatus }) =>
    client
      .get<{ tasks: Task[] }>(`/v1/projects/${projectId}/tasks`, { params })
      .then((r) => r.data.tasks),

  getById: (taskId: string) =>
    client.get<Task>(`/v1/tasks/${taskId}`).then((r) => r.data),

  update: (
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigned_to_user_id?: string | null;
      due_date?: string | null;
    }
  ) =>
    client.patch<Task>(`/v1/tasks/${taskId}`, data).then((r) => r.data),

  delete: (taskId: string) =>
    client.delete(`/v1/tasks/${taskId}`).then((r) => r.data),
};