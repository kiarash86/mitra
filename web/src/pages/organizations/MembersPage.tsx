import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Ellipsis } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { useOrganizationStore } from "../../stores/organization";
import { toast } from "../../stores/toast";
import { ORG_ROLES } from "../../lib/constants";
import { canManageOrg } from "../../lib/permissions";
import type { OrganizationMember } from "../../types/organization";
import type { OrgRoleName } from "../../types/rbac";
import { PageHeader } from "../../components/ui/PageHeader";
import { RouteTabs } from "../../components/ui/RouteTabs";
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

export default function MembersPage() {
  const { t } = useI18n();
  const currentUser = useAuthStore((s) => s.user);
  const currentOrg = useOrganizationStore((s) => s.currentOrg);
  const members = useOrganizationStore((s) => s.members);
  const fetchMembers = useOrganizationStore((s) => s.fetchMembers);
  const addMember = useOrganizationStore((s) => s.addMember);
  const removeMember = useOrganizationStore((s) => s.removeMember);

  const myRole = members.find((m) => m.user_id === currentUser?.id)?.role;
  const canManage = canManageOrg(myRole);

  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<OrgRoleName>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [removeTarget, setRemoveTarget] = useState<OrganizationMember | null>(null);

  useEffect(() => {
    if (currentOrg) fetchMembers(currentOrg.id).catch(() => toast.error(t.common.errorGeneric));
  }, [currentOrg, fetchMembers, t]);

  if (!currentOrg) {
    return (
      <EmptyState
        icon={<UserPlus className="h-6 w-6" />}
        title={t.dashboard.noOrgTitle}
        description={t.dashboard.noOrgDescription}
        action={
          <Link to="/organizations">
            <Button>{t.dashboard.noOrgCta}</Button>
          </Link>
        }
      />
    );
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await addMember(currentOrg.id, userId.trim(), role);
      setModalOpen(false);
      setUserId("");
      setRole("member");
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t.members.title}
        description={t.members.subtitle(currentOrg.name)}
        actions={
          canManage ? (
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
              {t.members.addButton}
            </Button>
          ) : undefined
        }
      />
      <RouteTabs
        tabs={[
          { label: t.organizations.tabOverview, to: "/organizations", end: true },
          { label: t.organizations.tabMembers, to: "/organizations/members" },
        ]}
      />

      {members.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-6 w-6" />}
          title={t.members.empty}
          action={
            canManage ? (
              <Button onClick={() => setModalOpen(true)}>{t.members.addButton}</Button>
            ) : undefined
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-200 text-start text-xs text-ink-400">
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
                      {member.user_id === currentUser?.id && (
                        <span className="text-xs text-ink-400">({t.common.you})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-500" dir="ltr">
                    {member.email}
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
                          {
                            label: t.common.remove,
                            danger: true,
                            onClick: () => setRemoveTarget(member),
                          },
                        ]}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t.members.addModalTitle}
        size="sm"
      >
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
          <Select
            label={t.members.roleLabel}
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRoleName)}
          >
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>
                {t.common.roles[r]}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
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
          if (removeTarget) await removeMember(currentOrg.id, removeTarget.user_id);
        }}
      />
    </div>
  );
}
