export type NotificationType =
  | "task_assigned"
  | "mention"
  | "deadline"
  | "comment"
  | "member_added";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}
