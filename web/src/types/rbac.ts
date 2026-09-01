export type Scope = "organization" | "project";

export type RoleName = "owner" | "admin" | "manager" | "member" | "viewer";

export interface Role {
  id: string;
  name: RoleName;
  scope: Scope;
  scope_id: string;
}

export interface Permission {
  resource: string;
  action: string;
}
