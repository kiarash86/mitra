import type { TaskStatus, TaskPriority } from "../types/task";

/*
  Display text lives in the i18n dictionaries (src/i18n/fa.ts, en.ts) under
  common.taskStatus / common.taskPriority / common.roles, keyed by the same
  string values defined here. This file only holds the value lists (used to
  drive selects/columns and API payloads) and style tokens — never text.
*/

export const TASK_STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "review", "done"];
export const TASK_PRIORITY_ORDER: TaskPriority[] = ["low", "medium", "high", "urgent"];

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-ink-100 text-ink-600",
  in_progress: "bg-progress-100 text-progress-600",
  review: "bg-plum-100 text-plum-600",
  done: "bg-moss-100 text-moss-600",
};

export const TASK_STATUS_DOT: Record<TaskStatus, string> = {
  todo: "bg-ink-400",
  in_progress: "bg-progress-500",
  review: "bg-plum-500",
  done: "bg-moss-500",
};

/** currentColor-based text classes, for SVG strokes/fills keyed by status. */
export const TASK_STATUS_TEXT: Record<TaskStatus, string> = {
  todo: "text-ink-400",
  in_progress: "text-progress-500",
  review: "text-plum-500",
  done: "text-moss-500",
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-ink-100 text-ink-500",
  medium: "bg-saffron-100 text-saffron-700",
  high: "bg-ember-100 text-ember-600",
  urgent: "bg-cinnabar-100 text-cinnabar-600",
};

export const ORG_ROLES = ["owner", "admin", "member", "viewer"] as const;
export const PROJECT_ROLES = ["lead", "member", "viewer"] as const;

// The API is single-tenant per deployment — exactly one organization is
// ever created, by the backend's seed script (see cmd/seed), which reads
// this same slug from its own ORG_SLUG env var. There is no "list my
// organizations" endpoint to discover it any other way.
export const ORG_SLUG = import.meta.env.VITE_ORG_SLUG || "mitra";
