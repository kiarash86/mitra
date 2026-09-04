import { useEffect } from "react";
import { Outlet, useNavigation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useI18n } from "../../i18n";
import { useOrganizationStore } from "../../stores/organization";
import { toast } from "../../stores/toast";
import { ORG_SLUG } from "../../lib/constants";

/**
 * Layout route element for every authenticated page: sidebar + header
 * chrome around an <Outlet/>. Mounted once by the router (see router.tsx)
 * instead of being wrapped around each page individually.
 */
export function AppShell() {
  const { t } = useI18n();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  const currentOrg = useOrganizationStore((s) => s.currentOrg);
  const fetchBySlug = useOrganizationStore((s) => s.fetchBySlug);

  // There's no "list my organizations" endpoint — the app is single-tenant
  // per deployment, so the one organization is looked up by a known slug
  // as soon as the authenticated shell mounts (unless already persisted
  // from a previous session).
  useEffect(() => {
    if (!currentOrg) fetchBySlug(ORG_SLUG).catch(() => toast.error(t.common.errorGeneric));
  }, [currentOrg, fetchBySlug, t]);

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
