import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/use-auth";
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
 * user is authenticated, otherwise redirects to /login. Used as the
 * `element` of a parent route so every child route is protected without
 * repeating the check per page.
 */
export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <GuardSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

/**
 * Inverse of AuthGuard: renders nested routes only for signed-out visitors
 * (login/register), otherwise redirects to /dashboard.
 */
export function GuestGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <GuardSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
