import api from '../../../api/client';
import type { Profile, FeedPage, Post } from '../../../components/Post/types';

export async function fetchProfile(userId: string): Promise<Profile> {
  // Backend doesn't have a profile endpoint yet.
  // Build profile from auth data or feed data.
  try {
    // Try to get user data from feed posts
    const { data } = await api.get('/feed', { params: { skip: 0, limit: 50 } });
    const posts: any[] = Array.isArray(data) ? data : data.data ?? [];

    // Find a post by this user to get their info
    const userPost = posts.find((p: any) => p.user?.id === userId || p.userId === userId);
    const userData = userPost?.user;

    const userPosts = posts.filter((p: any) => p.user?.id === userId || p.userId === userId);

    return {
      user: {
        id: userId,
        username: userData?.username ?? 'user',
        name: userData?.displayName ?? userData?.username ?? 'Usuário',
        avatarUrl: userData?.avatarUrl ?? null,
      },
      bio: '',
      name: userData?.displayName ?? userData?.username ?? 'Usuário',
      stats: {
        postsCount: userPosts.length,
        followersCount: 0,
        followingCount: 0,
      },
      viewerFollowing: false,
      isOwnProfile: false,
    };
  } catch {
    return {
      user: { id: userId, username: 'user', name: 'Usuário', avatarUrl: null },
      bio: '',
      name: 'Usuário',
      stats: { postsCount: 0, followersCount: 0, followingCount: 0 },
      viewerFollowing: false,
      isOwnProfile: false,
    };
  }
}

export async function fetchUserPosts(userId: string, cursor?: string): Promise<FeedPage> {
  try {
    const { data } = await api.get('/feed', { params: { skip: 0, limit: 100 } });
    const allPosts: any[] = Array.isArray(data) ? data : data.data ?? [];
    const userPosts = allPosts.filter((p: any) => p.user?.id === userId || p.userId === userId);

    // Map to our Post type
    const posts: Post[] = userPosts.map((p: any) => ({
      id: p.id,
      author: {
        id: p.user?.id ?? p.userId,
        username: p.user?.username ?? 'user',
        name: p.user?.displayName ?? 'User',
        avatarUrl: p.user?.avatarUrl ?? null,
      },
      images: (p.mediaUrls || []).map((url: string, i: number) => ({
        id: `img_${p.id}_${i}`,
        url,
        width: 1080,
        height: 1350,
      })),
      caption: p.caption || p.content || '',
      createdAt: p.createdAt,
      likesCount: p.likesCount ?? p._count?.likes ?? 0,
      commentsCount: p.commentsCount ?? p._count?.comments ?? 0,
      viewerLiked: p.isLiked ?? false,
      viewerSaved: false,
      visibility: (p.visibility || 'PUBLIC').toLowerCase() as any,
    }));

    return { posts, nextCursor: null };
  } catch {
    return { posts: [], nextCursor: null };
  }
}

export async function followUser(_userId: string): Promise<void> {
  // TODO: implement when backend has follow endpoint
  await new Promise((r) => setTimeout(r, 500));
}

export async function unfollowUser(_userId: string): Promise<void> {
  // TODO: implement when backend has follow endpoint
  await new Promise((r) => setTimeout(r, 500));
}
