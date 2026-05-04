import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { fetchProfile, followUser, unfollowUser, Profile } from '../api/profile';

export function useProfile(userId: string) {
  const currentUser = useAuthStore((s) => s.user) as any;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const isOwn = userId === currentUser?.id;

    if (isOwn && currentUser) {
      setProfile({
        user: {
          id: currentUser.id,
          username: currentUser.username,
          name: currentUser.displayName || currentUser.username,
          avatarUrl: currentUser.avatarUrl ?? null,
          isVerified: currentUser.isVerified ?? false,
        },
        name: currentUser.displayName || currentUser.username,
        bio: currentUser.bio ?? '',
        verified: currentUser.isVerified ?? false,
        visibility: 'public',
        stats: {
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
        },
        viewerFollowing: false,
        isOwnProfile: true,
      });
      setIsLoading(false);

      fetchProfile(userId, currentUser?.id)
        .then((p) => {
          setProfile((prev) =>
            prev ? { ...prev, stats: { ...prev.stats, postsCount: p.stats.postsCount } } : p
          );
        })
        .catch(() => {});
    } else {
      fetchProfile(userId, currentUser?.id)
        .then(setProfile)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [userId, currentUser?.id]);

  const toggleFollow = useCallback(async () => {
    if (!profile) return;
    const prev = { viewerFollowing: profile.viewerFollowing, stats: { ...profile.stats } };
    setProfile({
      ...profile,
      viewerFollowing: !profile.viewerFollowing,
      stats: {
        ...profile.stats,
        followersCount: profile.stats.followersCount + (profile.viewerFollowing ? -1 : 1),
      },
    });
    try {
      if (profile.viewerFollowing) await unfollowUser(userId);
      else await followUser(userId);
    } catch {
      setProfile((p) => (p ? { ...p, ...prev } : p));
    }
  }, [profile, userId]);

  return { profile, isLoading, toggleFollow };
}
