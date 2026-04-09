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

function FeedHeader({ onCreatePost }: { onCreatePost: () => void }) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);

  return (
    <View style={[headerStyles.container, { paddingTop: topPadding }]}>
      <View style={headerStyles.row}>
        <TouchableOpacity onPress={onCreatePost} style={headerStyles.iconBtn}>
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

  // ── Render post card ─────────────────────────────────────────
  const renderPost = ({ item: post }: { item: Post }) => {
    const postUser = post.user;
    const initial = (postUser?.displayName || postUser?.username || '?')[0].toUpperCase();
    const bgColor = avatarColor(postUser?.username || 'u');

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
      >
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: bgColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.displayName} numberOfLines={1}>
              {postUser?.displayName || 'User'}
            </Text>
            <Text style={styles.meta}>
              @{postUser?.username}  ·  {timeAgo(post.createdAt)}
            </Text>
          </View>
        </View>

        {/* Workout summary */}
        {post.workout && (
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
            {post.workout.sets && post.workout.sets.length > 0 && (
              <View style={styles.exerciseList}>
                {exerciseSummary(post.workout.sets).map((name, i) => (
                  <Text key={i} style={styles.exerciseName}>
                    {'\u2022'} {name}
                  </Text>
                ))}
                {new Set(post.workout.sets.map((s) => s.exerciseId)).size > 3 && (
                  <Text style={styles.exerciseMore}>
                    +{new Set(post.workout.sets.map((s) => s.exerciseId)).size - 3} more
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Caption */}
        {post.content ? (
          <Text style={styles.caption} numberOfLines={3}>
            {post.content}
          </Text>
        ) : null}

        {/* Action bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post)}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={post.isLiked ? colors.like : colors.textMuted}
            />
            {post.likesCount > 0 && (
              <Text style={[styles.actionCount, post.isLiked && { color: colors.like }]}>
                {post.likesCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleFire(post)}>
            <Ionicons
              name={post.isFired ? 'flame' : 'flame-outline'}
              size={20}
              color={post.isFired ? colors.fire : colors.textMuted}
            />
            {post.sharesCount > 0 && (
              <Text style={[styles.actionCount, post.isFired && { color: colors.fire }]}>
                {post.sharesCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
            {post.commentsCount > 0 && (
              <Text style={styles.actionCount}>{post.commentsCount}</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
      <FeedHeader onCreatePost={() => navigation.navigate('MediaPicker')} />
      <DropsBarSafe>
        <DropsBar
          onOpenDrops={(uid) => navigation.navigate('SpeedsViewer', { userId: uid })}
          onCreateDrop={() => navigation.navigate('SpeedCreator')}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flexGrow: 1,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  cardHeaderText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  displayName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    color: colors.text,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },

  // Workout box
  workoutBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  workoutTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  exerciseList: {
    marginTop: spacing.xs,
  },
  exerciseName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  exerciseMore: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Caption
  caption: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  actionCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
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
