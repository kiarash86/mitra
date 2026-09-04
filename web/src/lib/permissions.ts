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

/** Project-level management actions (edit/delete project, manage members). */
export function canManageProject(role: ProjectRoleName | undefined): boolean {
  return role === "lead";
}
