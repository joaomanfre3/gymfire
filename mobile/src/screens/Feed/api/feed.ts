// Backend contract (when ready):
// GET    /api/posts/feed?cursor&limit       → { posts: Post[], nextCursor: string | null }
// POST   /api/posts/:id/like                → 204
// DELETE /api/posts/:id/like                → 204
// POST   /api/posts/:id/save                → 204
// DELETE /api/posts/:id/save                → 204
// GET    /api/posts/:id/comments?cursor     → { comments: Comment[], nextCursor: string | null }
// POST   /api/posts/:id/comments            body: { text } → { comment: Comment }
// POST   /api/posts/:id/share               body: { userIds, message? } → 204

import api from '../../../api/client';
import type { Post, Comment, FeedPage, User } from '../types';

const USE_MOCKS = true;

// ========= Real API =========

export async function fetchFeed(cursor?: string, limit = 10): Promise<FeedPage> {
  if (USE_MOCKS) return mockFetchFeed(cursor, limit);
  const { data } = await api.get('/posts/feed', { params: { cursor, limit } });
  return data;
}

export async function likePost(postId: string): Promise<void> {
  if (USE_MOCKS) return mockDelay();
  await api.post(`/posts/${postId}/like`);
}

export async function unlikePost(postId: string): Promise<void> {
  if (USE_MOCKS) return mockDelay();
  await api.delete(`/posts/${postId}/like`);
}

export async function savePost(postId: string): Promise<void> {
  if (USE_MOCKS) return mockDelay();
  await api.post(`/posts/${postId}/save`);
}

export async function unsavePost(postId: string): Promise<void> {
  if (USE_MOCKS) return mockDelay();
  await api.delete(`/posts/${postId}/save`);
}

export async function fetchComments(postId: string, _cursor?: string): Promise<{ comments: Comment[]; nextCursor: string | null }> {
  if (USE_MOCKS) return mockFetchComments(postId);
  const { data } = await api.get(`/posts/${postId}/comments`, { params: { cursor: _cursor } });
  return data;
}

export async function addComment(postId: string, text: string): Promise<Comment> {
  if (USE_MOCKS) return mockAddComment(postId, text);
  const { data } = await api.post(`/posts/${postId}/comments`, { text });
  return data.comment;
}

export async function sharePostToUsers(postId: string, userIds: string[], message?: string): Promise<void> {
  if (USE_MOCKS) return mockDelay();
  await api.post(`/posts/${postId}/share`, { userIds, message });
}

// ========= Mocks =========

async function mockDelay(ms = 400) {
  await new Promise((r) => setTimeout(r, ms));
}

const MOCK_USERS: User[] = [
  { id: 'u1', username: 'joao.fitness', name: 'João Silva', avatarUrl: null },
  { id: 'u2', username: 'maria.gym', name: 'Maria Santos', avatarUrl: null },
  { id: 'u3', username: 'pedro.strong', name: 'Pedro Costa', avatarUrl: null },
  { id: 'u4', username: 'ana.health', name: 'Ana Oliveira', avatarUrl: null },
  { id: 'u5', username: 'lucas.fit', name: 'Lucas Mendes', avatarUrl: null },
];

function randomUser(): User {
  return MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
}

const MOCK_CAPTIONS = [
  'Treino pesado hoje! 💪 Cada dia mais forte. #gymfire #nopainnogain',
  'Mais uma semana de dedicação. O resultado vem pra quem persiste! 🔥',
  'Superando limites, um treino de cada vez. Bora que o shape não espera! 💪',
  'Leg day completo. Amanhã vai doer e eu vou amar. 🦵🔥',
  'Consistência é o segredo. 6 meses de treino sem faltar. #disciplina',
];

let mockPageCount = 0;

function generateMockPosts(count: number): Post[] {
  return Array.from({ length: count }, (_, i) => {
    const id = `post_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
    const author = randomUser();
    const imgId = 100 + mockPageCount * count + i;
    return {
      id,
      author,
      images: [
        {
          id: `img_${id}`,
          url: `https://picsum.photos/id/${imgId}/1080/1350`,
          width: 1080,
          height: 1350,
        },
      ],
      caption: MOCK_CAPTIONS[i % MOCK_CAPTIONS.length],
      createdAt: new Date(Date.now() - (i + mockPageCount * count) * 3600000).toISOString(),
      likesCount: Math.floor(Math.random() * 500),
      commentsCount: Math.floor(Math.random() * 30),
      viewerLiked: Math.random() > 0.7,
      viewerSaved: Math.random() > 0.85,
      visibility: 'public' as const,
    };
  });
}

async function mockFetchFeed(cursor?: string, limit = 10): Promise<FeedPage> {
  await mockDelay(600);
  if (!cursor) mockPageCount = 0;
  const page = mockPageCount;
  mockPageCount++;
  const posts = generateMockPosts(limit);
  return {
    posts,
    nextCursor: page < 2 ? `page_${page + 1}` : null, // 3 pages total
  };
}

async function mockFetchComments(postId: string): Promise<{ comments: Comment[]; nextCursor: string | null }> {
  await mockDelay(400);
  const comments: Comment[] = Array.from({ length: 5 }, (_, i) => ({
    id: `comment_${postId}_${i}`,
    postId,
    author: randomUser(),
    text: ['Muito bom! 🔥', 'Inspiração demais!', 'Vamos que vamos! 💪', 'Show de bola!', 'Parabéns pela evolução!'][i],
    createdAt: new Date(Date.now() - i * 1800000).toISOString(),
    likesCount: Math.floor(Math.random() * 20),
    viewerLiked: false,
  }));
  return { comments, nextCursor: null };
}

async function mockAddComment(postId: string, text: string): Promise<Comment> {
  await mockDelay(300);
  return {
    id: `comment_${Date.now()}`,
    postId,
    author: MOCK_USERS[0],
    text,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    viewerLiked: false,
  };
}
