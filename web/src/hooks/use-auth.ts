import { useAuthStore } from "../stores/auth";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = !!user;

  return { user, isLoading, isAuthenticated };
}
