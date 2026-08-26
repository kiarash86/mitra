import { create } from "zustand";
import type { Team, TeamMember } from "../types/team";
import { teamsApi } from "../api/teams";

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  members: TeamMember[];
  isLoading: boolean;

  fetchTeams: (orgId: string) => Promise<void>;
  fetchTeam: (teamId: string) => Promise<void>;
  createTeam: (orgId: string, name: string) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  fetchMembers: (teamId: string) => Promise<void>;
  addMember: (teamId: string, userId: string, role: string) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
}

export const useTeamStore = create<TeamState>()((set) => ({
  teams: [],
  currentTeam: null,
  members: [],
  isLoading: false,

  fetchTeams: async (orgId) => {
    set({ isLoading: true });
    const teams = await teamsApi.listByOrganization(orgId);
    set({ teams, isLoading: false });
  },

  fetchTeam: async (teamId) => {
    set({ isLoading: true });
    const team = await teamsApi.getById(teamId);
    set({ currentTeam: team, isLoading: false });
  },

  createTeam: async (orgId, name) => {
    const team = await teamsApi.create(orgId, { name });
    set((s) => ({ teams: [...s.teams, team] }));
    return team;
  },

  deleteTeam: async (teamId) => {
    await teamsApi.delete(teamId);
    set((s) => ({ teams: s.teams.filter((t) => t.id !== teamId) }));
  },

  fetchMembers: async (teamId) => {
    const members = await teamsApi.listMembers(teamId);
    set({ members });
  },

  addMember: async (teamId, userId, role) => {
    await teamsApi.addMember(teamId, { user_id: userId, role });
    const members = await teamsApi.listMembers(teamId);
    set({ members });
  },

  removeMember: async (teamId, userId) => {
    await teamsApi.removeMember(teamId, userId);
    const members = await teamsApi.listMembers(teamId);
    set({ members });
  },
}));
