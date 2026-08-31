import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Trash2, Pencil, Send } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { useProjectStore } from "../../stores/project";
import { useTaskStore } from "../../stores/task";
import { useOrgMemberDirectory } from "../../hooks/use-org-member-directory";
import { commentsApi } from "../../api/comments";
import { TASK_STATUS_ORDER, TASK_PRIORITY_ORDER } from "../../lib/constants";
import { formatDate, formatRelativeTime } from "../../lib/formatters";
import type { TaskStatus, TaskPriority } from "../../types/task";
import type { Comment } from "../../types/task";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Alert } from "../../components/ui/Alert";
import { Avatar } from "../../components/ui/Avatar";
import { Skeleton } from "../../components/ui/Skeleton";
import { CompletionSeal } from "../../components/ui/CompletionSeal";
import { BackIcon } from "../../components/ui/DirectionalIcon";

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const currentUser = useAuthStore((s) => s.user);

  const currentTask = useTaskStore((s) => s.currentTask);
  const taskLoading = useTaskStore((s) => s.isLoading);
  const fetchTask = useTaskStore((s) => s.fetchTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const currentProject = useProjectStore((s) => s.currentProject);
  const fetchProject = useProjectStore((s) => s.fetchProject);
  const projectMembers = useProjectStore((s) => s.members);
  const fetchProjectMembers = useProjectStore((s) => s.fetchMembers);

  const { byUserId } = useOrgMemberDirectory(currentProject?.organization_id);
  const assignableMembers = projectMembers
    .map((pm) => byUserId[pm.user_id])
    .filter((m): m is NonNullable<typeof m> => !!m);

  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSeal, setShowSeal] = useState(false);

  useEffect(() => {
    if (taskId) fetchTask(taskId).catch(() => {});
  }, [taskId, fetchTask]);

  useEffect(() => {
    if (!currentTask) return;
    fetchProject(currentTask.project_id).catch(() => {});
    fetchProjectMembers(currentTask.project_id).catch(() => {});
  }, [currentTask, fetchProject, fetchProjectMembers]);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    commentsApi
      .listByTask(taskId)
      .then((list) => {
        if (!cancelled) setComments(list);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (taskLoading || !currentTask) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  const patch = async (data: Parameters<typeof updateTask>[1]) => {
    const wasNotDone = currentTask.status !== "done";
    await updateTask(taskId!, data);
    if (data.status === "done" && wasNotDone) setShowSeal(true);
  };

  const openEdit = () => {
    setEditTitle(currentTask.title);
    setEditDescription(currentTask.description ?? "");
    setEditOpen(true);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setEditSubmitting(true);
    try {
      await updateTask(taskId!, { title: editTitle.trim(), description: editDescription.trim() || null });
      setEditOpen(false);
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId || !commentBody.trim()) return;
    setCommentSubmitting(true);
    try {
      const comment = await commentsApi.create(taskId, { body: commentBody.trim() });
      setComments((prev) => [...(prev ?? []), comment]);
      setCommentBody("");
    } catch {
      // comment not posted — left in the composer for retry
    } finally {
      setCommentSubmitting(false);
    }
  };

  const creator = byUserId[currentTask.created_by];

  return (
    <div>
      <Link
        to={`/projects/${currentTask.project_id}/board`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-800"
      >
        <BackIcon className="h-4 w-4" />
        {t.tasks.detailBack}
      </Link>

      <PageHeader
        title={currentTask.title}
        description={`${t.tasks.createdBy(creator?.full_name ?? currentTask.created_by)} ${t.tasks.createdAt(formatDate(currentTask.created_at, locale))}`}
        actions={
          <>
            <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={openEdit}>
              {t.tasks.editButton}
            </Button>
            <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)}>
              {t.tasks.deleteButton}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-ink-800">{t.tasks.descriptionLabel}</h2>
            <p className="whitespace-pre-wrap text-sm text-ink-600">
              {currentTask.description || t.tasks.descriptionEmpty}
            </p>
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-ink-800">{t.tasks.commentsTitle}</h2>
            {comments === null ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            ) : comments.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-400">{t.tasks.commentsEmpty}</p>
            ) : (
              <ul className="space-y-4">
                {comments.map((comment) => {
                  const author = byUserId[comment.author_id];
                  const name = author?.full_name ?? comment.author_id;
                  return (
                    <li key={comment.id} className="flex gap-3">
                      <Avatar name={name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-ink-800">{name}</span>
                          <span className="text-xs text-ink-400">
                            {formatRelativeTime(comment.created_at, locale)}
                          </span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-600">{comment.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <form onSubmit={handleComment} className="mt-5 flex items-end gap-2 border-t border-paper-100 pt-4">
              <Avatar name={currentUser?.full_name ?? "?"} size="sm" className="mb-2.5" />
              <div className="flex-1">
                <Textarea
                  placeholder={t.tasks.commentPlaceholder}
                  rows={2}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                icon={<Send className="h-4 w-4" />}
                loading={commentSubmitting}
                disabled={!commentBody.trim()}
                className="self-end"
              >
                {t.tasks.commentSubmit}
              </Button>
            </form>
          </Card>
        </div>

        <div>
          <Card className="relative space-y-4">
            <CompletionSeal show={showSeal} onDone={() => setShowSeal(false)} />
            <Property label={t.tasks.statusLabel}>
              <Select
                value={currentTask.status}
                onChange={(e) => patch({ status: e.target.value as TaskStatus })}
              >
                {TASK_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {t.common.taskStatus[s]}
                  </option>
                ))}
              </Select>
            </Property>
            <Property label={t.tasks.priorityLabel}>
              <Select
                value={currentTask.priority}
                onChange={(e) => patch({ priority: e.target.value as TaskPriority })}
              >
                {TASK_PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {t.common.taskPriority[p]}
                  </option>
                ))}
              </Select>
            </Property>
            <Property label={t.tasks.assigneeLabel}>
              <Select
                value={currentTask.assigned_to_user_id ?? ""}
                onChange={(e) => patch({ assigned_to_user_id: e.target.value || null })}
              >
                <option value="">{t.tasks.unassigned}</option>
                {assignableMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name}
                  </option>
                ))}
              </Select>
            </Property>
            <Property label={t.tasks.dueDateLabel}>
              <Input
                type="date"
                value={currentTask.due_date ? currentTask.due_date.slice(0, 10) : ""}
                onChange={(e) => patch({ due_date: e.target.value || null })}
              />
            </Property>
          </Card>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t.tasks.editButton} size="md">
        <form onSubmit={handleEdit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label={t.tasks.titleLabel}
            required
            minLength={2}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <Textarea
            label={t.tasks.descriptionLabel}
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={editSubmitting}>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t.common.deleteTitle}
        description={t.tasks.deleteConfirm(currentTask.title)}
        onConfirm={async () => {
          await deleteTask(taskId!);
          navigate(`/projects/${currentTask.project_id}/board`);
        }}
      />
    </div>
  );
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-400">{label}</p>
      {children}
    </div>
  );
}
