import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderKanban, ListChecks, Clock, Users, Building2 } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { useOrganizationStore } from "../../stores/organization";
import { useProjectStore } from "../../stores/project";
import { toast } from "../../stores/toast";
import { tasksApi } from "../../api/tasks";
import type { Task, TaskStatus } from "../../types/task";
import { TASK_STATUS_ORDER, TASK_STATUS_DOT, TASK_STATUS_TEXT } from "../../lib/constants";
import { formatNumber, isOverdue } from "../../lib/formatters";
import { cn } from "../../lib/cn";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { DonutChart } from "../../components/ui/DonutChart";

const DUE_SOON_WINDOW_DAYS = 3;

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const currentOrg = useOrganizationStore((s) => s.currentOrg);
  const members = useOrganizationStore((s) => s.members);
  const fetchOrgMembers = useOrganizationStore((s) => s.fetchMembers);
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [allTasks, setAllTasks] = useState<Task[] | null>(null);
  // Stable reference point for "due soon" math — computed once per mount
  // via a lazy initializer rather than read impurely during render.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!currentOrg) return;
    fetchOrgMembers(currentOrg.id).catch(() => toast.error(t.common.errorGeneric));
    fetchProjects(currentOrg.id).catch(() => toast.error(t.common.errorGeneric));
  }, [currentOrg, fetchOrgMembers, fetchProjects, t]);

  useEffect(() => {
    if (!currentOrg || projects.length === 0) return;
    let cancelled = false;
    Promise.all(projects.map((p) => tasksApi.listByProject(p.id).catch(() => [] as Task[]))).then(
      (lists) => {
        if (!cancelled) setAllTasks(lists.flat());
      },
    );
    return () => {
      cancelled = true;
    };
  }, [currentOrg, projects]);

  if (!currentOrg) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-600">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-ink-900">{t.dashboard.noOrgTitle}</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-500">{t.dashboard.noOrgDescription}</p>
        <Button size="lg" className="mt-6" onClick={() => navigate("/organizations")}>
          {t.dashboard.noOrgCta}
        </Button>
      </div>
    );
  }

  const tasksLoading = projects.length > 0 && allTasks === null;
  const effectiveTasks = projects.length === 0 ? [] : (allTasks ?? []);
  const openTasks = effectiveTasks.filter((task) => task.status !== "done");
  const dueSoonCount = openTasks.filter((task) => {
    if (!task.due_date) return false;
    if (isOverdue(task.due_date)) return true;
    const days = (new Date(task.due_date).getTime() - now) / 86400000;
    return days <= DUE_SOON_WINDOW_DAYS;
  }).length;

  const statusCounts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
  for (const task of effectiveTasks) statusCounts[task.status]++;

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title={t.dashboard.greeting(user?.full_name ?? "")}
        description={t.dashboard.subtitle}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.dashboard.statProjects}
          value={formatNumber(projects.length, locale)}
          icon={<FolderKanban className="h-5 w-5" />}
          tone="saffron"
        />
        <StatCard
          label={t.dashboard.statOpenTasks}
          value={tasksLoading ? "…" : formatNumber(openTasks.length, locale)}
          icon={<ListChecks className="h-5 w-5" />}
          tone="progress"
        />
        <StatCard
          label={t.dashboard.statDueSoon}
          value={tasksLoading ? "…" : formatNumber(dueSoonCount, locale)}
          icon={<Clock className="h-5 w-5" />}
          tone="ember"
        />
        <StatCard
          label={t.dashboard.statMembers}
          value={formatNumber(members.length, locale)}
          icon={<Users className="h-5 w-5" />}
          tone="moss"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-800">{t.dashboard.recentProjectsTitle}</h2>
            {projects.length > 0 && (
              <Link to="/projects" className="text-xs font-medium text-saffron-700 hover:text-saffron-800">
                {t.common.viewAll}
              </Link>
            )}
          </div>
          {projects.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">{t.dashboard.recentProjectsEmpty}</p>
          ) : (
            <ul className="divide-y divide-paper-100">
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="-mx-2 flex items-center justify-between rounded-md px-2 py-3 transition-colors duration-150 hover:bg-paper-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-800">{project.name}</p>
                      {project.description && (
                        <p className="truncate text-xs text-ink-400">{project.description}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-ink-800">{t.dashboard.statusBreakdownTitle}</h2>
          {tasksLoading ? (
            <div className="flex justify-center py-4">
              <Skeleton className="h-[120px] w-[120px] rounded-full" />
            </div>
          ) : effectiveTasks.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <DonutChart
                segments={TASK_STATUS_ORDER.map((status) => ({
                  value: statusCounts[status],
                  colorClass: TASK_STATUS_TEXT[status],
                  label: t.common.taskStatus[status],
                }))}
              />
              <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
                {TASK_STATUS_ORDER.map((status) => (
                  <div key={status} className="flex items-center gap-2 text-xs">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", TASK_STATUS_DOT[status])} />
                    <span className="truncate text-ink-500">{t.common.taskStatus[status]}</span>
                    <span className="ms-auto font-medium text-ink-700">
                      {formatNumber(statusCounts[status], locale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-ink-400">{t.dashboard.statusBreakdownEmpty}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
