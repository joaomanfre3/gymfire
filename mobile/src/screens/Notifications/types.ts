import type { User } from '../../components/Post/types';

export type NotificationType =
  | 'like_post'
  | 'comment_post'
  | 'reply_comment'
  | 'like_comment'
  | 'mention_post'
  | 'mention_comment'
  | 'follow'
  | 'share_post';

export interface Notification {
  id: string;
  type: NotificationType;
  actor: User;
  createdAt: string;
  isRead: boolean;
  post?: { id: string; thumbnailUrl: string };
  comment?: { id: string; text: string };
}
