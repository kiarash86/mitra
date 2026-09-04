import type { ReactNode } from "react";
import { useI18n } from "../../i18n";
import { cn } from "../../lib/cn";
import { TASK_PRIORITY_COLORS } from "../../lib/constants";
import type { TaskPriority } from "../../types/task";

interface BadgeProps {
  tone?: string;
  children: ReactNode;
  className?: string;
  dotClassName?: string;
}

export function Badge({ tone = "bg-ink-100 text-ink-600", children, className, dotClassName }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tone,
        className,
      )}
    >
      {dotClassName && <span className={cn("h-1.5 w-1.5 rounded-full", dotClassName)} />}
      {children}
    </span>
  );
}

export function TaskPriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  const { t } = useI18n();
  return (
    <Badge tone={TASK_PRIORITY_COLORS[priority]} className={className}>
      {t.common.taskPriority[priority]}
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const { t } = useI18n();
  const label = t.common.roles[role as keyof typeof t.common.roles] ?? role;
  return (
    <Badge tone="bg-ink-100 text-ink-600" className={className}>
      {label}
    </Badge>
  );
}
