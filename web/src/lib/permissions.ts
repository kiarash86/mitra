import type { UserRoleName, ProjectRoleName } from "../types/rbac";

/**
 * Global user-management actions (add/remove users). Backend is the source
 * of truth and rejects unauthorized requests regardless — this only
 * decides what the UI offers, so a lower-privilege user doesn't see
 * controls that would just error out.
 */
export function canManageUsers(role: UserRoleName | undefined): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Whether the current viewer can remove this specific user — mirrors the
 * API's own rules exactly (Delete in internal/users): only an owner/admin
 * can remove users, nobody can remove themselves, and only an owner can
 * remove another owner.
 */
export function canRemoveUser(
  myRole: UserRoleName | undefined,
  targetUserId: string,
  targetRole: UserRoleName,
  myUserId: string | undefined,
): boolean {
  if (!canManageUsers(myRole)) return false;
  if (targetUserId === myUserId) return false;
  if (targetRole === "owner" && myRole !== "owner") return false;
  return true;
}

/**
 * Project-level management actions (edit/delete project, manage members).
 * Mirrors the API's IsProjectOwnerOrAdmin (internal/rbac/policy.go) — the
 * backend never issues a "lead" role, only owner/admin/member/viewer.
 */
export function canManageProject(role: ProjectRoleName | undefined): boolean {
  return role === "owner" || role === "admin";
}
