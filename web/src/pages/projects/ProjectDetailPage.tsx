import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UserPlus, Ellipsis, Trash2, Pencil, Kanban } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { useProjectStore } from "../../stores/project";
import { toast } from "../../stores/toast";
import { useOrgMemberDirectory } from "../../hooks/use-org-member-directory";
import { PROJECT_ROLES } from "../../lib/constants";
import { canManageProject } from "../../lib/permissions";
import type { ProjectMember } from "../../types/project";
import type { ProjectRoleName } from "../../types/rbac";
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
import { RoleBadge } from "../../components/ui/Badge";
import { Menu } from "../../components/ui/Menu";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { BackIcon } from "../../components/ui/DirectionalIcon";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAuthStore((s) => s.user);
  const currentProject = useProjectStore((s) => s.currentProject);
  const members = useProjectStore((s) => s.members);
  const isLoading = useProjectStore((s) => s.isLoading);
  const fetchProject = useProjectStore((s) => s.fetchProject);
  const fetchMembers = useProjectStore((s) => s.fetchMembers);
  const addMember = useProjectStore((s) => s.addMember);
  const removeMember = useProjectStore((s) => s.removeMember);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const { byUserId } = useOrgMemberDirectory(currentProject?.organization_id);

  const myRole = members.find((m) => m.user_id === currentUser?.id)?.role;
  const canManage = canManageProject(myRole);

  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<ProjectRoleName>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null);

  useEffect(() => {
    if (!projectId) return;
    fetchProject(projectId).catch(() => toast.error(t.common.errorGeneric));
    fetchMembers(projectId).catch(() => toast.error(t.common.errorGeneric));
  }, [projectId, fetchProject, fetchMembers, t]);

  const openEdit = () => {
    if (!currentProject) return;
    setEditName(currentProject.name);
    setEditDescription(currentProject.description ?? "");
    setEditOpen(true);
  };

  const handleEdit = async (e: FormEvent) => {
    if (!projectId) return;
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await updateProject(projectId, { name: editName.trim(), description: editDescription.trim() });
      setEditOpen(false);
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    if (!projectId) return;
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await addMember(projectId, userId.trim(), role);
      setAddOpen(false);
      setUserId("");
      setRole("member");
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !currentProject) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-800"
      >
        <BackIcon className="h-4 w-4" />
        {t.common.back}
      </Link>

      <PageHeader
        title={currentProject.name}
        description={currentProject.description || t.projects.noDescription}
        actions={
          canManage ? (
            <>
              <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={openEdit}>
                {t.common.edit}
              </Button>
              <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)}>
                {t.projects.deleteButton}
              </Button>
            </>
          ) : undefined
        }
      />

      <Link to={`/projects/${currentProject.id}/board`}>
        <Card interactive className="mb-6 flex items-center gap-4 border-saffron-200 bg-saffron-50/40">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-saffron-500 text-white">
            <Kanban className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-ink-900">{t.projects.goToBoardCta}</p>
          </div>
        </Card>
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-800">{t.projects.detailMembersTitle}</h2>
        {canManage && (
          <Button
            size="sm"
            variant="secondary"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setAddOpen(true)}
          >
            {t.projects.addMemberButton}
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <EmptyState icon={<UserPlus className="h-6 w-6" />} title={t.members.empty} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-xs text-ink-400">
                <th className="px-5 py-3 text-start font-medium">{t.members.tableName}</th>
                <th className="px-5 py-3 text-start font-medium">{t.members.tableRole}</th>
                <th className="w-10 px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {members.map((member) => {
                const info = byUserId[member.user_id];
                const displayName = info?.full_name ?? member.user_id;
                return (
                  <tr key={member.id} className="transition-colors duration-150 hover:bg-paper-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={displayName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink-800">{displayName}</p>
                          {info?.email && (
                            <p className="truncate text-xs text-ink-400" dir="ltr">
                              {info.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-5 py-3 text-end">
                      {(canManage || member.user_id === currentUser?.id) && (
                        <Menu
                          trigger={
                            <button
                              aria-label={t.common.edit}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                            >
                              <Ellipsis className="h-4 w-4" />
                            </button>
                          }
                          items={[
                            { label: t.common.remove, danger: true, onClick: () => setRemoveTarget(member) },
                          ]}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t.projects.editModalTitle} size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label={t.projects.nameLabel}
            required
            minLength={2}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Textarea
            label={t.projects.descriptionLabel}
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={submitting}>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t.members.addModalTitle} size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label={t.projects.memberUserIdLabel}
            hint={t.projects.memberUserIdHint}
            required
            dir="ltr"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <Select
            label={t.members.roleLabel}
            value={role}
            onChange={(e) => setRole(e.target.value as ProjectRoleName)}
          >
            {PROJECT_ROLES.map((r) => (
              <option key={r} value={r}>
                {t.common.roles[r]}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={submitting}>
              {t.common.add}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title={t.common.deleteTitle}
        description={
          removeTarget
            ? t.members.removeConfirm(byUserId[removeTarget.user_id]?.full_name ?? removeTarget.user_id)
            : ""
        }
        onConfirm={async () => {
          if (projectId && removeTarget) await removeMember(projectId, removeTarget.user_id);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t.common.deleteTitle}
        description={t.projects.deleteConfirm(currentProject.name)}
        onConfirm={async () => {
          if (!projectId) return;
          await deleteProject(projectId);
          navigate("/projects");
        }}
      />
    </div>
  );
}
