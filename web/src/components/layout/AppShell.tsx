import { Outlet, useNavigation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

/**
 * Layout route element for every authenticated page: sidebar + header
 * chrome around an <Outlet/>. Mounted once by the router (see router.tsx)
 * instead of being wrapped around each page individually.
 */
export function AppShell() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

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
