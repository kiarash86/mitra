import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UserPlus, Ellipsis, Trash2 } from "lucide-react";
import { useI18n } from "../../i18n";
import { useTeamStore } from "../../stores/team";
import { TEAM_ROLES } from "../../lib/constants";
import { formatDate } from "../../lib/formatters";
import type { TeamMember } from "../../types/team";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
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

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const currentTeam = useTeamStore((s) => s.currentTeam);
  const members = useTeamStore((s) => s.members);
  const isLoading = useTeamStore((s) => s.isLoading);
  const fetchTeam = useTeamStore((s) => s.fetchTeam);
  const fetchMembers = useTeamStore((s) => s.fetchMembers);
  const addMember = useTeamStore((s) => s.addMember);
  const removeMember = useTeamStore((s) => s.removeMember);
  const deleteTeam = useTeamStore((s) => s.deleteTeam);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<string>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!teamId) return;
    fetchTeam(teamId).catch(() => {});
    fetchMembers(teamId).catch(() => {});
  }, [teamId, fetchTeam, fetchMembers]);

  const handleAdd = async (e: FormEvent) => {
    if (!teamId) return;
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await addMember(teamId, userId.trim(), role);
      setAddOpen(false);
      setUserId("");
      setRole("member");
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !currentTeam) {
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
        to="/teams"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-800"
      >
        <BackIcon className="h-4 w-4" />
        {t.common.back}
      </Link>

      <PageHeader
        title={currentTeam.name}
        description={`${t.teams.createdLabel}: ${formatDate(currentTeam.created_at, locale)}`}
        actions={
          <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)}>
            {t.teams.deleteButton}
          </Button>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-800">{t.teams.detailMembersTitle}</h2>
        <Button
          size="sm"
          variant="secondary"
          icon={<UserPlus className="h-4 w-4" />}
          onClick={() => setAddOpen(true)}
        >
          {t.teams.addMemberButton}
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState icon={<UserPlus className="h-6 w-6" />} title={t.members.empty} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-xs text-ink-400">
                <th className="px-5 py-3 text-start font-medium">{t.members.tableName}</th>
                <th className="px-5 py-3 text-start font-medium">{t.members.tableEmail}</th>
                <th className="px-5 py-3 text-start font-medium">{t.members.tableRole}</th>
                <th className="w-10 px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {members.map((member) => (
                <tr key={member.id} className="transition-colors duration-150 hover:bg-paper-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={member.full_name} size="sm" />
                      <span className="font-medium text-ink-800">{member.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-500" dir="ltr">
                    {member.email}
                  </td>
                  <td className="px-5 py-3">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-5 py-3 text-end">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t.members.addModalTitle} size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label={t.members.userIdLabel}
            hint={t.members.userIdHint}
            required
            dir="ltr"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <Select label={t.members.roleLabel} value={role} onChange={(e) => setRole(e.target.value)}>
            {TEAM_ROLES.map((r) => (
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
        description={removeTarget ? t.members.removeConfirm(removeTarget.full_name) : ""}
        onConfirm={async () => {
          if (teamId && removeTarget) await removeMember(teamId, removeTarget.user_id);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t.common.deleteTitle}
        description={t.teams.deleteConfirm(currentTeam.name)}
        onConfirm={async () => {
          if (!teamId) return;
          await deleteTeam(teamId);
          navigate("/teams");
        }}
      />
    </div>
  );
}
