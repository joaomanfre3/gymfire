import api from '../../../api/client';
import type { Post } from '../../../components/Post/types';

export interface ProfileStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export type ProfileVisibility = 'public' | 'private';

export interface BioLink {
  url: string;
  title?: string;
}

export interface Profile {
  user: { id: string; username: string; name: string; avatarUrl: string | null; isVerified?: boolean };
  name: string;
  bio: string;
  bioLinks?: BioLink[];
  verified: boolean;
  visibility: ProfileVisibility;
  stats: ProfileStats;
  viewerFollowing: boolean;
  viewerFollowRequested?: boolean;
  isOwnProfile: boolean;
}

export function canViewContent(profile: Profile): boolean {
  if (profile.isOwnProfile) return true;
  if (profile.visibility === 'public') return true;
  return profile.viewerFollowing;
}

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
}

/** Fetch profile — uses /feed to extract user data since no profile endpoint exists */
export async function fetchProfile(userId: string, currentUserId?: string): Promise<Profile> {
  const isOwn = userId === currentUserId;
  try {
    const { data } = await api.get('/feed', { params: { skip: 0, limit: 100 } });
    const allPosts: any[] = Array.isArray(data) ? data : data.data ?? [];
    const userPost = allPosts.find((p: any) => p.user?.id === userId || p.userId === userId);
    const userData = userPost?.user;
    const userPosts = allPosts.filter((p: any) => p.user?.id === userId || p.userId === userId);

    return {
      user: {
        id: userId,
        username: userData?.username ?? 'user',
        name: userData?.displayName ?? userData?.username ?? 'Usuário',
        avatarUrl: userData?.avatarUrl ?? null,
        isVerified: userData?.isVerified ?? false,
      },
      name: userData?.displayName ?? userData?.username ?? 'Usuário',
      bio: userData?.bio ?? '',
      verified: userData?.isVerified ?? false,
      visibility: 'public',
      stats: {
        postsCount: userPosts.length,
        followersCount: 0,
        followingCount: 0,
      },
      viewerFollowing: false,
      isOwnProfile: isOwn,
    };
  } catch {
    return {
      user: { id: userId, username: 'user', name: 'Usuário', avatarUrl: null },
      name: 'Usuário',
      bio: '',
      verified: false,
      visibility: 'public',
      stats: { postsCount: 0, followersCount: 0, followingCount: 0 },
      viewerFollowing: false,
      isOwnProfile: isOwn,
    };
  }
}

/** Fetch posts for a user — filters from /feed */
export async function fetchUserPosts(userId: string, canFetch: boolean): Promise<FeedPage> {
  if (!canFetch) return { posts: [], nextCursor: null };
  try {
    const { data } = await api.get('/feed', { params: { skip: 0, limit: 100 } });
    const allPosts: any[] = Array.isArray(data) ? data : data.data ?? [];
    const userPosts = allPosts.filter((p: any) => p.user?.id === userId || p.userId === userId);

    const posts: Post[] = userPosts.map((p: any) => ({
      id: p.id,
      author: {
        id: p.user?.id ?? p.userId,
        username: p.user?.username ?? 'user',
        name: p.user?.displayName ?? 'User',
        avatarUrl: p.user?.avatarUrl ?? null,
      },
      images: (p.mediaUrls || []).map((url: string, i: number) => ({
        id: `img_${p.id}_${i}`, url, width: 1080, height: 1350,
      })),
      caption: p.caption || p.content || '',
      createdAt: p.createdAt,
      likesCount: p.likesCount ?? p._count?.likes ?? 0,
      commentsCount: p.commentsCount ?? p._count?.comments ?? 0,
      viewerLiked: p.isLiked ?? false,
      viewerSaved: false,
      visibility: 'public',
    }));
    return { posts, nextCursor: null };
  } catch {
    return { posts: [], nextCursor: null };
  }
}

export async function followUser(_userId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 500));
}

export async function unfollowUser(_userId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 500));
}
