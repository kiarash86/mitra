import { createBrowserRouter, Navigate } from "react-router-dom";
import type { ComponentType } from "react";
import { AuthGuard, GuestGuard } from "./components/guards/RouteGuards";
import { AppShell } from "./components/layout/AppShell";

// Each page is loaded on demand instead of being bundled into the main
// chunk, so `lazy` — not a static `import` — is what actually triggers the
// code split. `.then((m) => ({ Component: m.default }))` adapts our
// `export default function XxxPage()` pages to the route object shape
// React Router expects.
const page = (loader: () => Promise<{ default: ComponentType }>) => ({
  lazy: () => loader().then((m) => ({ Component: m.default })),
});

export const router = createBrowserRouter([
  {
    element: <GuestGuard />,
    children: [
      { path: "/login", ...page(() => import("./pages/auth/LoginPage")) },
      { path: "/register", ...page(() => import("./pages/auth/RegisterPage")) },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", ...page(() => import("./pages/dashboard/DashboardPage")) },
          { path: "organizations", ...page(() => import("./pages/organizations/OrganizationSettingsPage")) },
          { path: "organizations/members", ...page(() => import("./pages/organizations/MembersPage")) },
          { path: "projects", ...page(() => import("./pages/projects/ProjectListPage")) },
          { path: "projects/:projectId", ...page(() => import("./pages/projects/ProjectDetailPage")) },
          { path: "projects/:projectId/board", ...page(() => import("./pages/tasks/TaskBoardPage")) },
          { path: "tasks/:taskId", ...page(() => import("./pages/tasks/TaskDetailPage")) },
          { path: "chat", ...page(() => import("./pages/chat/ChatPage")) },
          { path: "notifications", ...page(() => import("./pages/notifications/NotificationsPage")) },
          { path: "settings", ...page(() => import("./pages/settings/ProfilePage")) },
        ],
      },
    ],
  },
]);
