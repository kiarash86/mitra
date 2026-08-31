import { useEffect, useMemo } from "react";
import { useOrganizationStore } from "../stores/organization";
import type { OrganizationMember } from "../types/organization";

/**
 * Project/task-scoped member records only carry a user_id (no name/email).
 * This hook fetches the organization's member roster and returns a
 * user_id -> OrganizationMember lookup so callers can resolve display names.
 */
export function useOrgMemberDirectory(orgId: string | undefined) {
  const members = useOrganizationStore((s) => s.members);
  const fetchMembers = useOrganizationStore((s) => s.fetchMembers);

  useEffect(() => {
    if (orgId) fetchMembers(orgId).catch(() => {});
  }, [orgId, fetchMembers]);

  const byUserId = useMemo(() => {
    const map: Record<string, OrganizationMember> = {};
    for (const m of members) map[m.user_id] = m;
    return map;
  }, [members]);

  return { members, byUserId };
}
