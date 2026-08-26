import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth";
import { useUiStore } from "../../stores/ui";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/organizations", label: "Organizations" },
  { to: "/teams", label: "Teams" },
  { to: "/projects", label: "Projects" },
  { to: "/chat", label: "Chat" },
  { to: "/notifications", label: "Notifications" },
];

export function Sidebar() {
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  if (!sidebarOpen) return null;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
          Mitra
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <Link
          to="/settings"
          className="block rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          Settings
        </Link>
        <button
          onClick={logout}
          className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
