import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { UserPlus, Ellipsis, Check } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { useUsersStore } from "../../stores/users";
import { toast } from "../../stores/toast";
import { ORG_ROLES } from "../../lib/constants";
import { canManageUsers, canRemoveUser } from "../../lib/permissions";
import type { User, CreatedUser } from "../../types/auth";
import type { UserRoleName } from "../../types/rbac";
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

export default function UsersPage() {
  const { t } = useI18n();
  const currentUser = useAuthStore((s) => s.user);
  const users = useUsersStore((s) => s.users);
  const fetchUsers = useUsersStore((s) => s.fetchUsers);
  const createUser = useUsersStore((s) => s.createUser);
  const removeUser = useUsersStore((s) => s.removeUser);

  const canManage = canManageUsers(currentUser?.role);

  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRoleName>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [copied, setCopied] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers().catch(() => toast.error(t.common.errorGeneric));
  }, [fetchUsers, t]);

  const closeModal = () => {
    setModalOpen(false);
    setFullName("");
    setEmail("");
    setRole("member");
    setCreatedUser(null);
    setCopied(false);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const created = await createUser({
        full_name: fullName.trim(),
        email: email.trim(),
        role,
      });
      setCreatedUser(created);
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdUser) return;
    navigator.clipboard.writeText(createdUser.temp_password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <PageHeader
        title={t.members.title}
        description={t.members.subtitle}
        actions={
          canManage ? (
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
              {t.members.addButton}
            </Button>
          ) : undefined
        }
      />

      {users.length === 0 ? (
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
              {users.map((user) => (
                <tr key={user.id} className="transition-colors duration-150 hover:bg-paper-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.full_name} size="sm" />
                      <span className="font-medium text-ink-800">{user.full_name}</span>
                      {user.id === currentUser?.id && (
                        <span className="text-xs text-ink-400">({t.common.you})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-500" dir="ltr">
                    {user.email}
                  </td>
                  <td className="px-5 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-3 text-end">
                    {canRemoveUser(currentUser?.role, user.id, user.role, currentUser?.id) && (
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
                            onClick: () => setRemoveTarget(user),
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
        title={createdUser ? t.members.createdTitle : t.members.addModalTitle}
        size="sm"
      >
        {createdUser ? (
          <div className="space-y-4">
            <Alert variant="success">{t.members.createdDescription(createdUser.full_name)}</Alert>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink-700">{t.members.tempPasswordLabel}</p>
              <div className="flex items-center gap-2">
                <code
                  dir="ltr"
                  className="flex-1 rounded-md border border-ink-200 bg-paper-50 px-3 py-2 text-sm font-medium text-ink-900"
                >
                  {createdUser.temp_password}
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
              onChange={(e) => setRole(e.target.value as UserRoleName)}
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
          if (removeTarget) await removeUser(removeTarget.id);
        }}
      />
    </div>
  );
}
