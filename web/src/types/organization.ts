import type { OrgRoleName } from "./rbac";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRoleName;
  created_at: string;
  email: string;
  full_name: string;
}
