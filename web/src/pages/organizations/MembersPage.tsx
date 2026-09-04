import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Ellipsis, Check } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { useOrganizationStore } from "../../stores/organization";
import { toast } from "../../stores/toast";
import { ORG_ROLES } from "../../lib/constants";
import { canManageOrg, canRemoveOrgMember } from "../../lib/permissions";
import type { OrganizationMember, CreatedMember } from "../../types/organization";
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
  const createMember = useOrganizationStore((s) => s.createMember);
  const removeMember = useOrganizationStore((s) => s.removeMember);

  const myRole = members.find((m) => m.user_id === currentUser?.id)?.role;
  const canManage = canManageOrg(myRole);

  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRoleName>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdMember, setCreatedMember] = useState<CreatedMember | null>(null);
  const [copied, setCopied] = useState(false);
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

  const closeModal = () => {
    setModalOpen(false);
    setFullName("");
    setEmail("");
    setRole("member");
    setCreatedMember(null);
    setCopied(false);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const created = await createMember(currentOrg.id, {
        full_name: fullName.trim(),
        email: email.trim(),
        role,
      });
      setCreatedMember(created);
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdMember) return;
    navigator.clipboard.writeText(createdMember.temp_password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
                    {canRemoveOrgMember(myRole, member.user_id, member.role, currentUser?.id) && (
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
        onClose={closeModal}
        title={createdMember ? t.members.createdTitle : t.members.addModalTitle}
        size="sm"
      >
        {createdMember ? (
          <div className="space-y-4">
            <Alert variant="success">{t.members.createdDescription(createdMember.full_name)}</Alert>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink-700">{t.members.tempPasswordLabel}</p>
              <div className="flex items-center gap-2">
                <code
                  dir="ltr"
                  className="flex-1 rounded-md border border-ink-200 bg-paper-50 px-3 py-2 text-sm font-medium text-ink-900"
                >
                  {createdMember.temp_password}
                </code>
                <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : t.common.copy}
                </Button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" onClick={closeModal}>
                {t.members.doneButton}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            <Input
              label={t.members.fullNameLabel}
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              type="email"
              label={t.members.emailLabel}
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              <Button type="button" variant="secondary" onClick={closeModal}>
                {t.common.cancel}
              </Button>
              <Button type="submit" loading={submitting}>
                {t.common.add}
              </Button>
            </div>
          </form>
        )}
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
