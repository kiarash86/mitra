import { useEffect, useMemo } from "react";
import { useI18n } from "../i18n";
import { useUsersStore } from "../stores/users";
import { toast } from "../stores/toast";
import type { User } from "../types/auth";

/**
 * Project/task-scoped member records only carry a user_id (no name/email).
 * This hook fetches the full user roster once and returns a
 * user_id -> User lookup so callers can resolve display names.
 */
export function useUserDirectory() {
  const { t } = useI18n();
  const users = useUsersStore((s) => s.users);
  const hasFetched = useUsersStore((s) => s.hasFetched);
  const fetchUsers = useUsersStore((s) => s.fetchUsers);

  useEffect(() => {
    if (!hasFetched) fetchUsers().catch(() => toast.error(t.common.errorGeneric));
  }, [hasFetched, fetchUsers, t]);

  const byUserId = useMemo(() => {
    const map: Record<string, User> = {};
    for (const u of users) map[u.id] = u;
    return map;
  }, [users]);

  return { members: users, byUserId };
}
