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
      description?: string;
      priority?: TaskPriority;
      due_date?: string | null;
    }
  ) =>
    client.put<Task>(`/v1/tasks/${taskId}`, data).then((r) => r.data),

  // The backend's PUT /tasks/:id is a full replace of title/description/
  // priority/due_date only — it doesn't touch status or assignee. Those
  // have their own dedicated endpoints.
  updateStatus: (taskId: string, status: TaskStatus) =>
    client.patch<Task>(`/v1/tasks/${taskId}/status`, { status }).then((r) => r.data),

  assign: (taskId: string, userId: string) =>
    client
      .post<Task>(`/v1/tasks/${taskId}/assign/user`, { user_id: userId })
      .then((r) => r.data),

  unassign: (taskId: string) =>
    client.post<Task>(`/v1/tasks/${taskId}/unassign`).then((r) => r.data),

  delete: (taskId: string) =>
    client.delete(`/v1/tasks/${taskId}`).then((r) => r.data),
};