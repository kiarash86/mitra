import type { OrgRoleName, ProjectRoleName } from "../types/rbac";

/**
 * Organization-level management actions (invite/remove members, create
 * projects). Backend is the source of truth and rejects unauthorized
 * requests regardless — this only decides what the UI offers, so a
 * lower-privilege member doesn't see controls that would just error out.
 */
export function canManageOrg(role: OrgRoleName | undefined): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Whether the current viewer can remove this specific org member — mirrors
 * the API's own rules exactly (RemoveMember in internal/organization):
 * only an owner/admin can remove members, nobody can remove themselves,
 * and only an owner can remove another owner.
 */
export function canRemoveOrgMember(
  myRole: OrgRoleName | undefined,
  targetUserId: string,
  targetRole: OrgRoleName,
  myUserId: string | undefined,
): boolean {
  if (!canManageOrg(myRole)) return false;
  if (targetUserId === myUserId) return false;
  if (targetRole === "owner" && myRole !== "owner") return false;
  return true;
}

/** Project-level management actions (edit/delete project, manage members). */
export function canManageProject(role: ProjectRoleName | undefined): boolean {
  return role === "lead";
}
