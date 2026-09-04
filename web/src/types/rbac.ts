import type { ORG_ROLES, PROJECT_ROLES } from "../lib/constants";

/** Organization-level role — see ORG_ROLES in lib/constants.ts. */
export type OrgRoleName = (typeof ORG_ROLES)[number];

/** Project-level role — see PROJECT_ROLES in lib/constants.ts. */
export type ProjectRoleName = (typeof PROJECT_ROLES)[number];
