export interface User {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export interface PostImageAsset {
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Post {
  id: string;
  author: User;
  images: PostImageAsset[];
  caption: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  viewerLiked: boolean;
  viewerSaved: boolean;
  visibility: 'public' | 'friends' | 'private';
  /** Optional: backend-computed. When absent, derive client-side via author.id === currentUser.id. */
  viewerIsAuthor?: boolean;
  /** ISO string when the post was last edited; null/undefined if never edited. */
  editedAt?: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  text: string;
  createdAt: string;
  likesCount: number;
  viewerLiked: boolean;
}

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
}

export interface ProfileStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface Profile {
  user: User;
  bio: string;
  name: string;
  stats: ProfileStats;
  viewerFollowing: boolean;
  isOwnProfile: boolean;
}
