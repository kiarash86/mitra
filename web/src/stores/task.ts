import { create } from "zustand";
import type { Task, TaskStatus, TaskPriority } from "../types/task";
import { tasksApi } from "../api/tasks";

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  filters: { status?: TaskStatus; priority?: TaskPriority };

  setFilters: (filters: { status?: TaskStatus; priority?: TaskPriority }) => void;
  fetchTasks: (projectId: string) => Promise<void>;
  fetchTask: (taskId: string) => Promise<void>;
  createTask: (
    projectId: string,
    data: { title: string; description?: string; priority?: TaskPriority; assigned_to_user_id?: string; due_date?: string }
  ) => Promise<Task>;
  updateTask: (taskId: string, data: { title?: string; description?: string | null; status?: TaskStatus; priority?: TaskPriority; assigned_to_user_id?: string | null; due_date?: string | null }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  filters: {},

  setFilters: (filters) => set({ filters }),

  fetchTasks: async (projectId) => {
    set({ isLoading: true });
    const { filters } = get();
    const tasks = await tasksApi.listByProject(projectId, { status: filters.status });
    set({ tasks, isLoading: false });
  },

  fetchTask: async (taskId) => {
    set({ isLoading: true });
    const task = await tasksApi.getById(taskId);
    set({ currentTask: task, isLoading: false });
  },

  createTask: async (projectId, data) => {
    const task = await tasksApi.create(projectId, data);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (taskId, data) => {
    const updated = await tasksApi.update(taskId, data);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? updated : t)),
      currentTask: s.currentTask?.id === taskId ? updated : s.currentTask,
    }));
  },

  deleteTask: async (taskId) => {
    await tasksApi.delete(taskId);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== taskId),
      currentTask: s.currentTask?.id === taskId ? null : s.currentTask,
    }));
  },
}));
