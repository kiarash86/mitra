import { create } from "zustand";
import type { Project, ProjectMember } from "../types/project";
import { projectsApi } from "../api/projects";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  members: ProjectMember[];
  isLoading: boolean;

  fetchProjects: (orgId: string) => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  createProject: (orgId: string, name: string, description?: string) => Promise<Project>;
  updateProject: (projectId: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  fetchMembers: (projectId: string) => Promise<void>;
  addMember: (projectId: string, userId: string, role: string) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()((set) => ({
  projects: [],
  currentProject: null,
  members: [],
  isLoading: false,

  fetchProjects: async (orgId) => {
    set({ isLoading: true });
    const projects = await projectsApi.listByOrganization(orgId);
    set({ projects, isLoading: false });
  },

  fetchProject: async (projectId) => {
    set({ isLoading: true });
    const project = await projectsApi.getById(projectId);
    set({ currentProject: project, isLoading: false });
  },

  createProject: async (orgId, name, description) => {
    const project = await projectsApi.create(orgId, { name, description });
    set((s) => ({ projects: [...s.projects, project] }));
    return project;
  },

  updateProject: async (projectId, data) => {
    const updated = await projectsApi.update(projectId, data);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? updated : p)),
      currentProject: s.currentProject?.id === projectId ? updated : s.currentProject,
    }));
  },

  deleteProject: async (projectId) => {
    await projectsApi.delete(projectId);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }));
  },

  fetchMembers: async (projectId) => {
    const members = await projectsApi.listMembers(projectId);
    set({ members });
  },

  addMember: async (projectId, userId, role) => {
    await projectsApi.addMember(projectId, { user_id: userId, role });
    const members = await projectsApi.listMembers(projectId);
    set({ members });
  },

  removeMember: async (projectId, userId) => {
    await projectsApi.removeMember(projectId, userId);
    const members = await projectsApi.listMembers(projectId);
    set({ members });
  },
}));
