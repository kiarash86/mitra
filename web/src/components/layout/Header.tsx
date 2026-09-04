import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PanelLeft, PanelLeftClose, Bell } from "lucide-react";
import { useI18n } from "../../i18n";
import { useUiStore } from "../../stores/ui";
import { useOrganizationStore } from "../../stores/organization";
import { useNotificationStore } from "../../stores/notification";
import { toast } from "../../stores/toast";
import { IconButton } from "../ui/IconButton";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { formatNumber } from "../../lib/formatters";
import { cn } from "../../lib/cn";

export function Header() {
  const { t, locale } = useI18n();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const currentOrg = useOrganizationStore((s) => s.currentOrg);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    fetchNotifications().catch(() => toast.error(t.common.errorGeneric));
  }, [fetchNotifications, t]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-paper-200 bg-white px-5">
      <div className="flex items-center gap-3">
        <IconButton
          label={t.common.toggleSidebar}
          icon={
            sidebarOpen ? (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeft className="h-[18px] w-[18px]" />
            )
          }
          onClick={toggleSidebar}
        />
        {currentOrg && <span className="text-sm font-medium text-ink-700">{currentOrg.name}</span>}
      </div>

      <div className="flex items-center gap-1.5">
        <LanguageSwitcher />
        <Link
          to="/notifications"
          aria-label={t.nav.notifications}
          className={cn(
            "relative inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-600 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900",
          )}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute end-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cinnabar-500 px-1 text-[10px] font-bold text-white">
              {formatNumber(Math.min(unreadCount, 99), locale)}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
