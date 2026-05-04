import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { useAuthStore } from '../../stores/authStore';
import { HomeStackParamList } from '../../navigation/types';
import { Post, User, WorkoutSet } from '../../types';
import api from '../../api/client';
import DropsBar from '../../components/DropsBar';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Feed'>;

// ── Time ago utility ───────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ── Avatar helper ──────────────────────────────────────────────
function avatarColor(name: string): string {
  const palette = ['#FF6B35', '#4ECDC4', '#22C55E', '#FACC15', '#EF4444', '#A855F7', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const PAGE_SIZE = 20;

function FeedHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);

  return (
    <View style={[headerStyles.container, { paddingTop: topPadding }]}>
      <View style={headerStyles.row}>
        <TouchableOpacity onPress={() => navigation.navigate('CreatePost')} style={headerStyles.iconBtn}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <Image
          source={require('../../../assets/gymfire-logo.png')}
          style={headerStyles.logo}
        />

        <TouchableOpacity onPress={() => {}} style={headerStyles.iconBtn}>
          <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 130,
    height: 36,
    resizeMode: 'contain',
  },
});

class DropsBarSafe extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

export default function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const skipRef = useRef(0);

  const fetchFeed = useCallback(async (reset: boolean) => {
    const skip = reset ? 0 : skipRef.current;
    try {
      const { data } = await api.get('/feed', { params: { skip, limit: PAGE_SIZE } });
      const list: Post[] = Array.isArray(data) ? data : data.data ?? [];
      if (reset) {
        setPosts(list);
        skipRef.current = list.length;
      } else {
        setPosts((prev) => [...prev, ...list]);
        skipRef.current = skip + list.length;
      }
      setHasMore(list.length >= PAGE_SIZE);
    } catch {
      // silently fail
    }
  }, []);

  const fetchStreak = useCallback(async () => {
    try {
      const { data } = await api.get('/streak/status');
      setStreak(data.currentStreak ?? 0);
    } catch {
      setStreak(user?.currentStreak ?? 0);
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchFeed(true), fetchStreak()]);
      setInitialLoading(false);
    })();
  }, [fetchFeed, fetchStreak]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeed(true), fetchStreak()]);
    setRefreshing(false);
  }, [fetchFeed, fetchStreak]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchFeed(false);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchFeed]);

  // ── Like / Fire toggles ──────────────────────────────────────
  const toggleLike = useCallback(async (post: Post) => {
    const liked = post.isLiked;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, isLiked: !liked, likesCount: p.likesCount + (liked ? -1 : 1) }
          : p,
      ),
    );
    try {
      if (liked) {
        await api.delete(`/social/posts/${post.id}/like`);
      } else {
        await api.post(`/social/posts/${post.id}/like`);
      }
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, isLiked: liked, likesCount: p.likesCount + (liked ? 0 : -1) + (!liked ? 0 : 1) }
            : p,
        ),
      );
    }
  }, []);

  const toggleFire = useCallback(async (post: Post) => {
    const fired = post.isFired;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, isFired: !fired, sharesCount: p.sharesCount + (fired ? -1 : 1) }
          : p,
      ),
    );
    try {
      if (fired) {
        await api.delete(`/social/posts/${post.id}/fire`);
      } else {
        await api.post(`/social/posts/${post.id}/fire`);
      }
    } catch {
      // revert
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, isFired: fired } : p,
        ),
      );
    }
  }, []);

  // ── Workout summary helpers ──────────────────────────────────
  const exerciseSummary = (sets: WorkoutSet[]) => {
    const seen = new Map<string, string>();
    for (const s of sets) {
      if (s.exercise && !seen.has(s.exerciseId)) {
        seen.set(s.exerciseId, s.exercise.name);
      }
      if (seen.size >= 3) break;
    }
    return Array.from(seen.values());
  };

  const formatVolume = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k kg`;
    return `${v} kg`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const m = Math.floor(seconds / 60);
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return `${m}m`;
  };

  // ── Format count (1k, 1.2M etc) ──────────────────────────────
  const formatCount = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace('.', ',')}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')}k`;
    return String(n);
  };

  // ── Format timestamp uppercase ──────────────────────────────
  const formatTimeUpper = (dateStr: string): string => {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'AGORA';
    if (mins < 60) return `${mins} MINUTOS ATRÁS`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} HORAS ATRÁS`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} DIAS ATRÁS`;
    const weeks = Math.floor(days / 7);
    return `${weeks} SEMANAS ATRÁS`;
  };

  // ── Render post card (Instagram-style) ──────────────────────
  const renderPost = ({ item: post }: { item: Post }) => {
    const postUser = post.user;
    const initial = (postUser?.displayName || postUser?.username || '?')[0].toUpperCase();
    const bgColor = avatarColor(postUser?.username || 'u');
    const mediaUrls: string[] = (post as any).mediaUrls || [];
    const caption = (post as any).caption || post.content || '';
    const username = postUser?.username || 'user';

    return (
      <View style={styles.card}>
        {/* 1. HEADER — 48h */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.postHeaderLeft}
            onPress={() => navigation.navigate('Profile' as any, { userId: postUser?.id })}
            activeOpacity={0.7}
          >
            {postUser?.avatarUrl ? (
              <Image source={{ uri: postUser.avatarUrl }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.headerAvatarText}>{initial}</Text>
              </View>
            )}
            <Text style={styles.headerUsername}>
              {username}
              <Text style={styles.headerTime}> · {timeAgo(post.createdAt)}</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 2. MÍDIA — 4:5 */}
        {mediaUrls.length > 0 && (
          <View>
            <Image
              source={{ uri: mediaUrls[0] }}
              style={styles.postMedia}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Workout summary (for workout posts without media) */}
        {post.workout && mediaUrls.length === 0 && (
          <View style={styles.workoutBox}>
            <Text style={styles.workoutTitle}>{post.workout.name}</Text>
            <View style={styles.workoutStats}>
              <View style={styles.workoutStat}>
                <Ionicons name="barbell-outline" size={14} color={colors.accent} />
                <Text style={styles.workoutStatText}>{post.workout.totalSets} sets</Text>
              </View>
              <View style={styles.workoutStat}>
                <Ionicons name="trending-up-outline" size={14} color={colors.accent} />
                <Text style={styles.workoutStatText}>{formatVolume(post.workout.totalVolume)}</Text>
              </View>
              <View style={styles.workoutStat}>
                <Ionicons name="time-outline" size={14} color={colors.accent} />
                <Text style={styles.workoutStatText}>{formatDuration(post.workout.duration)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3. ACTION BAR — 44h */}
        <View style={styles.postActions}>
          <View style={styles.postActionsLeft}>
            <TouchableOpacity style={styles.actionIcon} onPress={() => toggleLike(post)}>
              <Ionicons
                name={post.isLiked ? 'flame' : 'flame-outline'}
                size={26}
                color={post.isLiked ? '#FF6B35' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon}>
              <Ionicons name="paper-plane-outline" size={22} color="#fff" style={{ transform: [{ rotate: '-20deg' }] }} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="bookmark-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 4. ENGAJAMENTO */}
        <View style={styles.engagement}>
          {post.likesCount > 0 && (
            <Text style={styles.likesCount}>
              {formatCount(post.likesCount)} {post.likesCount === 1 ? 'curtida' : 'curtidas'}
            </Text>
          )}

          {caption ? (
            <Text style={styles.captionText} numberOfLines={2}>
              <Text style={styles.captionUsername}>{username}</Text>
              {'  '}{caption}
            </Text>
          ) : null}

          {post.commentsCount > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: post.id })}>
              <Text style={styles.viewComments}>
                Ver {post.commentsCount === 1 ? '1 comentário' : `todos os ${post.commentsCount} comentários`}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.postTimestamp}>{formatTimeUpper(post.createdAt)}</Text>
        </View>
      </View>
    );
  };

  // ── Empty state ──────────────────────────────────────────────
  const renderEmpty = () => {
    if (initialLoading) return null;
    return (
      <View style={styles.empty}>
        <Ionicons name="barbell-outline" size={56} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptySubtitle}>Start a workout to share with friends!</Text>
      </View>
    );
  };

  // ── Main render ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <FeedHeader />
      <DropsBarSafe>
        <DropsBar
          onOpenDrops={(uid) => navigation.navigate('SpeedsViewer', { userId: uid })}
          onCreateDrop={() => navigation.navigate('MediaPicker')}
        />
      </DropsBarSafe>
      {initialLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={renderPost}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: spacing.lg }}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold as '700',
    color: colors.primary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  streakBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as '600',
    color: colors.fire,
    marginLeft: 2,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flexGrow: 1,
  },

  // Card (Instagram-style, no borders/shadows)
  card: {
    marginBottom: 12,
  },

  // 1. Post Header
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarText: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#fff',
  },
  headerUsername: {
    fontSize: 13,
    fontWeight: '600' as '600',
    color: '#fff',
  },
  headerTime: {
    fontWeight: '400' as '400',
    color: '#a8a8a8',
  },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Post Media
  postMedia: {
    width: '100%' as any,
    aspectRatio: 4 / 5,
    backgroundColor: '#1a1a1a',
  },

  // Workout box (for workout posts without media)
  workoutBox: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#fff',
    marginBottom: 8,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 16,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontSize: 12,
    color: '#a8a8a8',
  },

  // 3. Action Bar
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 6,
  },
  postActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 4. Engagement
  engagement: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 4,
  },
  likesCount: {
    fontSize: 13,
    fontWeight: '600' as '600',
    color: '#fff',
  },
  captionText: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '600' as '600',
  },
  viewComments: {
    fontSize: 13,
    color: '#a8a8a8',
  },
  postTimestamp: {
    fontSize: 11,
    color: '#777',
    letterSpacing: 0.3,
    marginTop: 2,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold as '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
