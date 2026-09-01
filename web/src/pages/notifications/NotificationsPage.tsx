import { useEffect } from "react";
import { Bell, ListChecks, AtSign, Clock, MessageSquare, UserPlus, CheckCheck } from "lucide-react";
import { useI18n } from "../../i18n";
import { useNotificationStore } from "../../stores/notification";
import { formatRelativeTime } from "../../lib/formatters";
import { cn } from "../../lib/cn";
import type { NotificationType } from "../../types/notification";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  task_assigned: ListChecks,
  mention: AtSign,
  deadline: Clock,
  comment: MessageSquare,
  member_added: UserPlus,
};

const TYPE_TONES: Record<NotificationType, string> = {
  task_assigned: "bg-progress-100 text-progress-600",
  mention: "bg-plum-100 text-plum-600",
  deadline: "bg-ember-100 text-ember-600",
  comment: "bg-saffron-100 text-saffron-700",
  member_added: "bg-moss-100 text-moss-600",
};

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    fetchNotifications().catch(() => {});
  }, [fetchNotifications]);

  return (
    <div>
      <PageHeader
        title={t.notifications.title}
        description={t.notifications.subtitle}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCheck className="h-4 w-4" />}
              onClick={() => markAllAsRead().catch(() => {})}
            >
              {t.notifications.markAllRead}
            </Button>
          ) : undefined
        }
      />

      {isLoading && notifications.length === 0 ? (
        <div className="space-y-2.5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title={t.notifications.emptyTitle}
          description={t.notifications.emptyDescription}
        />
      ) : (
        <Card padding="none" className="divide-y divide-paper-100 overflow-hidden">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type];
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read) markAsRead(n.id).catch(() => {});
                }}
                className={cn(
                  "flex w-full items-start gap-3.5 px-5 py-3.5 text-start transition-colors duration-150 hover:bg-paper-50",
                  !n.read && "bg-saffron-50/40",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    TYPE_TONES[n.type],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm text-ink-800", !n.read && "font-semibold")}>{n.title}</p>
                  {n.body && <p className="mt-0.5 truncate text-xs text-ink-500">{n.body}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2 pt-0.5">
                  <span className="text-xs text-ink-400">{formatRelativeTime(n.created_at, locale)}</span>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-saffron-500" />}
                </div>
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}
