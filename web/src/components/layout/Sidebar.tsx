import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, Users, FolderKanban, MessageSquare, Settings, LogOut } from "lucide-react";
import { useI18n } from "../../i18n";
import { useUiStore } from "../../stores/ui";
import { useAuthStore } from "../../stores/auth";
import { cn } from "../../lib/cn";
import { Logo, SunMark } from "../ui/Logo";
import { Avatar } from "../ui/Avatar";
import { Menu } from "../ui/Menu";

const NAV_ITEMS = [
  { key: "dashboard", to: "/dashboard", icon: LayoutDashboard },
  { key: "organization", to: "/organizations", icon: Building2 },
  { key: "teams", to: "/teams", icon: Users },
  { key: "projects", to: "/projects", icon: FolderKanban },
  { key: "chat", to: "/chat", icon: MessageSquare },
] as const;

export function Sidebar() {
  const { t } = useI18n();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-ink-950 transition-[width] duration-200 ease-out",
        sidebarOpen ? "w-64" : "w-[72px]",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-white/10",
          sidebarOpen ? "px-5" : "justify-center",
        )}
      >
        {sidebarOpen ? <Logo tone="light" size="sm" /> : <SunMark className="h-7 w-7" />}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ key, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={sidebarOpen ? undefined : t.nav[key]}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                !sidebarOpen && "justify-center",
                isActive ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white",
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {sidebarOpen && <span className="truncate">{t.nav[key]}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Menu
          align="start"
          trigger={
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md p-2 transition-colors duration-150 hover:bg-white/5",
                !sidebarOpen && "justify-center",
              )}
            >
              <Avatar name={user?.full_name ?? "?"} size="sm" />
              {sidebarOpen && (
                <span className="min-w-0 flex-1 text-start">
                  <span className="block truncate text-sm font-medium text-white">
                    {user?.full_name}
                  </span>
                  <span className="block truncate text-xs text-ink-400">{user?.email}</span>
                </span>
              )}
            </button>
          }
          items={[
            {
              label: t.nav.settings,
              icon: <Settings className="h-4 w-4" />,
              onClick: () => navigate("/settings"),
            },
            {
              label: t.nav.logout,
              icon: <LogOut className="h-4 w-4" />,
              onClick: () => logout(),
              danger: true,
            },
          ]}
        />
      </div>
    </aside>
  );
}
