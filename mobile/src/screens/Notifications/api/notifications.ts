import api from '../../../api/client';
import type { Notification } from '../types';

const USE_MOCKS = true;

export async function fetchNotifications(cursor?: string): Promise<{ notifications: Notification[]; nextCursor: string | null }> {
  if (USE_MOCKS) return mockFetchNotifications();
  const { data } = await api.get('/notifications', { params: { cursor, limit: 20 } });
  return data;
}

export async function markAsRead(ids: string[]): Promise<void> {
  if (USE_MOCKS) return;
  await api.post('/notifications/read', { ids });
}

export async function getUnreadCount(): Promise<number> {
  if (USE_MOCKS) return 3;
  const { data } = await api.get('/notifications/unread-count');
  return data.count;
}

// ── Mocks ──

async function mockFetchNotifications(): Promise<{ notifications: Notification[]; nextCursor: string | null }> {
  await new Promise((r) => setTimeout(r, 400));
  const notifications: Notification[] = [
    {
      id: 'n1', type: 'like_post',
      actor: { id: 'u2', username: 'maria.gym', name: 'Maria Santos', avatarUrl: null },
      createdAt: new Date(Date.now() - 1800000).toISOString(), isRead: false,
      post: { id: 'p1', thumbnailUrl: 'https://picsum.photos/id/100/200/250' },
    },
    {
      id: 'n2', type: 'follow',
      actor: { id: 'u3', username: 'pedro.strong', name: 'Pedro Costa', avatarUrl: null },
      createdAt: new Date(Date.now() - 7200000).toISOString(), isRead: false,
    },
    {
      id: 'n3', type: 'comment_post',
      actor: { id: 'u4', username: 'ana.health', name: 'Ana Oliveira', avatarUrl: null },
      createdAt: new Date(Date.now() - 86400000).toISOString(), isRead: true,
      post: { id: 'p1', thumbnailUrl: 'https://picsum.photos/id/101/200/250' },
      comment: { id: 'c1', text: 'Que treino incrível! Parabéns pela dedicação 💪' },
    },
    {
      id: 'n4', type: 'mention_comment',
      actor: { id: 'u5', username: 'lucas.fit', name: 'Lucas Mendes', avatarUrl: null },
      createdAt: new Date(Date.now() - 172800000).toISOString(), isRead: true,
      comment: { id: 'c2', text: '@joaomanfre_ olha isso!' },
    },
  ];
  return { notifications, nextCursor: null };
}
