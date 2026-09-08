import { useEffect } from "react";
import { Outlet, useNavigation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { toast } from "../../stores/toast";

/**
 * Layout route element for every authenticated page: sidebar + header
 * chrome around an <Outlet/>. Mounted once by the router (see router.tsx)
 * instead of being wrapped around each page individually.
 */
export function AppShell() {
  const { t } = useI18n();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  const hydrateUser = useAuthStore((s) => s.hydrateUser);

  // The login response doesn't include the user's role, so it's fetched
  // once as soon as the authenticated shell mounts.
  useEffect(() => {
    hydrateUser().catch(() => toast.error(t.common.errorGeneric));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-paper-50">
      {isNavigating && (
        <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-saffron-500" aria-hidden="true" />
      )}
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-6xl animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
