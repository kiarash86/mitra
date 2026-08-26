export interface Team {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
  email: string;
  full_name: string;
}
