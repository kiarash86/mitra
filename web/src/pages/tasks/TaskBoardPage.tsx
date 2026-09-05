import { useEffect, useState } from "react";
import type { DragEvent, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Calendar } from "lucide-react";
import { useI18n } from "../../i18n";
import { useProjectStore } from "../../stores/project";
import { useTaskStore } from "../../stores/task";
import { toast } from "../../stores/toast";
import { useOrgMemberDirectory } from "../../hooks/use-org-member-directory";
import { TASK_STATUS_ORDER, TASK_PRIORITY_ORDER } from "../../lib/constants";
import { formatShortDate, isOverdue } from "../../lib/formatters";
import { cn } from "../../lib/cn";
import type { Task, TaskStatus, TaskPriority } from "../../types/task";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Alert } from "../../components/ui/Alert";
import { Avatar } from "../../components/ui/Avatar";
import { TaskPriorityBadge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { CompletionSeal } from "../../components/ui/CompletionSeal";
import { BackIcon } from "../../components/ui/DirectionalIcon";

export default function TaskBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { t, locale } = useI18n();
  const currentProject = useProjectStore((s) => s.currentProject);
  const fetchProject = useProjectStore((s) => s.fetchProject);
  const projectMembers = useProjectStore((s) => s.members);
  const fetchProjectMembers = useProjectStore((s) => s.fetchMembers);

  const tasks = useTaskStore((s) => s.tasks);
  const isLoading = useTaskStore((s) => s.isLoading);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const createTask = useTaskStore((s) => s.createTask);
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);

  const { byUserId } = useOrgMemberDirectory(currentProject?.organization_id);
  const assignableMembers = projectMembers
    .map((pm) => byUserId[pm.user_id])
    .filter((m): m is NonNullable<typeof m> => !!m);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    fetchProject(projectId).catch(() => toast.error(t.common.errorGeneric));
    fetchProjectMembers(projectId).catch(() => toast.error(t.common.errorGeneric));
    fetchTasks(projectId).catch(() => toast.error(t.common.errorGeneric));
  }, [projectId, fetchProject, fetchProjectMembers, fetchTasks, t]);

  const handleDrop = async (status: TaskStatus) => {
    setDragOverStatus(null);
    const taskId = draggingId;
    setDraggingId(null);
    if (!taskId) return;
    const task = tasks.find((tk) => tk.id === taskId);
    if (!task || task.status === status) return;
    const wasNotDone = task.status !== "done";
    try {
      await updateTaskStatus(taskId, status);
      if (status === "done" && wasNotDone) setJustCompletedId(taskId);
    } catch {
      // Task visually stays in its previous column — the toast is the only
      // signal the drop didn't actually take, so it needs to say so clearly.
      toast.error(t.common.errorGeneric);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    if (!projectId) return;
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigned_to_user_id: assignee || undefined,
        due_date: dueDate || undefined,
      });
      setModalOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAssignee("");
      setDueDate("");
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {currentProject && (
        <Link
          to={`/projects/${currentProject.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-800"
        >
          <BackIcon className="h-4 w-4" />
          {currentProject.name}
        </Link>
      )}

      <PageHeader
        title={t.tasks.boardTitle}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
            {t.tasks.addTaskButton}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4">
          {TASK_STATUS_ORDER.map((status) => {
            const columnTasks = tasks.filter((tk) => tk.status === status);
            return (
              <div
                key={status}
                onDragOver={(e: DragEvent) => {
                  e.preventDefault();
                  setDragOverStatus(status);
                }}
                onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
                onDrop={(e: DragEvent) => {
                  e.preventDefault();
                  handleDrop(status);
                }}
                className="flex min-h-[240px] flex-col rounded-lg bg-paper-100/70 p-2.5"
              >
                <div className="mb-2 flex items-center justify-between px-1.5 py-1">
                  <h3 className="text-sm font-semibold text-ink-700">{t.common.taskStatus[status]}</h3>
                  <span className="text-xs font-medium text-ink-400">{columnTasks.length}</span>
                </div>
                <div
                  className={cn(
                    "flex flex-1 flex-col gap-2 rounded-md p-1 transition-colors duration-150",
                    dragOverStatus === status && "bg-saffron-100/60 ring-2 ring-saffron-300 ring-inset",
                  )}
                >
                  {columnTasks.length === 0 && (
                    <p className="px-2 py-6 text-center text-xs text-ink-400">{t.tasks.columnEmpty}</p>
                  )}
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assigneeName={task.assigned_to_user_id ? byUserId[task.assigned_to_user_id]?.full_name : undefined}
                      locale={locale}
                      dragging={draggingId === task.id}
                      showSeal={justCompletedId === task.id}
                      onSealDone={() => setJustCompletedId(null)}
                      onDragStart={() => setDraggingId(task.id)}
                      onDragEnd={() => setDraggingId(null)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t.tasks.createModalTitle} size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label={t.tasks.titleLabel}
            required
            minLength={2}
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            label={t.tasks.descriptionLabel}
            hint={t.common.optional}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t.tasks.priorityLabel}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {TASK_PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {t.common.taskPriority[p]}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              label={t.tasks.dueDateLabel}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <Select
            label={t.tasks.assigneeLabel}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="">{t.tasks.unassigned}</option>
            {assignableMembers.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={submitting}>
              {t.common.create}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  assigneeName?: string;
  locale: "fa" | "en";
  dragging: boolean;
  showSeal: boolean;
  onSealDone: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function TaskCard({
  task,
  assigneeName,
  locale,
  dragging,
  showSeal,
  onSealDone,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const overdue = task.due_date ? isOverdue(task.due_date) && task.status !== "done" : false;

  return (
    <Link
      to={`/tasks/${task.id}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "relative block rounded-lg border border-paper-200 bg-white p-3.5 shadow-soft transition-all duration-150",
        "hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        dragging && "rotate-2 opacity-50",
      )}
    >
      <CompletionSeal show={showSeal} onDone={onSealDone} />
      <p className="text-sm font-medium text-ink-800">{task.title}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TaskPriorityBadge priority={task.priority} />
          {task.due_date && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                overdue ? "font-medium text-cinnabar-600" : "text-ink-400",
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatShortDate(task.due_date, locale)}
            </span>
          )}
        </div>
        {assigneeName && <Avatar name={assigneeName} size="xs" />}
      </div>
    </Link>
  );
}
