import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/use-auth";
import { useAppConfigStore } from "../../stores/appConfig";
import { Spinner } from "../ui/Spinner";

function GuardSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-paper-50">
      <Spinner size="lg" />
    </div>
  );
}

/**
 * Layout-route guard: renders nested routes (via <Outlet/>) only when the
 * user is authenticated and doesn't have a forced password change pending,
 * otherwise redirects to /login or /force-password-change. Used as the
 * `element` of a parent route so every child route is protected without
 * repeating the check per page.
 */
export function AuthGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <GuardSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.must_change_password) return <Navigate to="/force-password-change" replace />;

  return <Outlet />;
}

/**
 * Inverse of AuthGuard: renders nested routes only for signed-out visitors
 * (login), otherwise redirects to /dashboard.
 */
export function GuestGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <GuardSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

/**
 * Guards /force-password-change itself: only reachable while signed in
 * AND the flag is actually set, so it can't be visited by URL once the
 * password's already been changed (or before signing in at all).
 */
export function ForcePasswordChangeGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <GuardSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.must_change_password) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

/**
 * Guards /chat: only reachable when the server has chat enabled (see
 * GET /api/v1/config — ENABLE_CHAT). Stops a stale bookmark or typed URL
 * from landing on a page whose backend routes don't exist right now.
 *
 * Waits for the config to actually arrive before deciding — otherwise
 * ChatPage would mount on the initial (unknown) value and start opening
 * WebSockets against routes that may not be registered.
 */
export function ChatEnabledGuard() {
  const chatEnabled = useAppConfigStore((s) => s.chatEnabled);
  const isLoaded = useAppConfigStore((s) => s.isLoaded);

  if (!isLoaded) return <GuardSpinner />;
  if (!chatEnabled) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
