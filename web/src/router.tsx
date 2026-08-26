import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "./components/guards/AuthGuard";
import { GuestGuard } from "./components/guards/GuestGuard";
import { AppShell } from "./components/layout/AppShell";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import OrganizationSettingsPage from "./pages/organizations/OrganizationSettingsPage";
import MembersPage from "./pages/organizations/MembersPage";
import TeamListPage from "./pages/teams/TeamListPage";
import TeamDetailPage from "./pages/teams/TeamDetailPage";
import ProjectListPage from "./pages/projects/ProjectListPage";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import TaskBoardPage from "./pages/tasks/TaskBoardPage";
import TaskDetailPage from "./pages/tasks/TaskDetailPage";
import ChatPage from "./pages/chat/ChatPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import ProfilePage from "./pages/settings/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    ),
  },
  {
    path: "/register",
    element: (
      <GuestGuard>
        <RegisterPage />
      </GuestGuard>
    ),
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <AppShell>
          <Navigate to="/dashboard" replace />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <AppShell>
          <DashboardPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/organizations",
    element: (
      <AuthGuard>
        <AppShell>
          <OrganizationSettingsPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/organizations/members",
    element: (
      <AuthGuard>
        <AppShell>
          <MembersPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/teams",
    element: (
      <AuthGuard>
        <AppShell>
          <TeamListPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/teams/:teamId",
    element: (
      <AuthGuard>
        <AppShell>
          <TeamDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/projects",
    element: (
      <AuthGuard>
        <AppShell>
          <ProjectListPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/projects/:projectId",
    element: (
      <AuthGuard>
        <AppShell>
          <ProjectDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/projects/:projectId/board",
    element: (
      <AuthGuard>
        <AppShell>
          <TaskBoardPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/tasks/:taskId",
    element: (
      <AuthGuard>
        <AppShell>
          <TaskDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/chat",
    element: (
      <AuthGuard>
        <AppShell>
          <ChatPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/notifications",
    element: (
      <AuthGuard>
        <AppShell>
          <NotificationsPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/settings",
    element: (
      <AuthGuard>
        <AppShell>
          <ProfilePage />
        </AppShell>
      </AuthGuard>
    ),
  },
]);
