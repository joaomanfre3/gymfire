import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { useAuthStore } from '../../stores/authStore';
import { HomeStackParamList } from '../../navigation/types';
import { Post, Comment, WorkoutSet } from '../../types';
import api from '../../api/client';

type Props = NativeStackScreenProps<HomeStackParamList, 'PostDetail'>;

function timeAgo(dateStr: string): string {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'agora';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const dt = new Date(dateStr);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

function avatarColor(name: string): string {
  const palette = ['#FF6B35', '#4ECDC4', '#22C55E', '#FACC15', '#EF4444', '#A855F7', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function PostDetailScreen({ route }: Props) {
  const { postId } = route.params;
  const currentUser = useAuthStore((s) => s.user);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const { data } = await api.get(`/feed/${postId}`);
      setPost(data);
      setComments(data.comments ?? []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const toggleLike = useCallback(async () => {
    if (!post) return;
    const liked = post.isLiked;
    setPost((p) =>
      p ? { ...p, isLiked: !liked, likesCount: p.likesCount + (liked ? -1 : 1) } : p,
    );
    try {
      if (liked) await api.delete(`/social/posts/${post.id}/like`);
      else await api.post(`/social/posts/${post.id}/like`);
    } catch {
      setPost((p) =>
        p ? { ...p, isLiked: liked, likesCount: p.likesCount + (liked ? 1 : -1) } : p,
      );
    }
  }, [post]);

  const toggleFire = useCallback(async () => {
    if (!post) return;
    const fired = post.isFired;
    setPost((p) =>
      p ? { ...p, isFired: !fired, sharesCount: p.sharesCount + (fired ? -1 : 1) } : p,
    );
    try {
      if (fired) await api.delete(`/social/posts/${post.id}/fire`);
      else await api.post(`/social/posts/${post.id}/fire`);
    } catch {
      setPost((p) => (p ? { ...p, isFired: fired } : p));
    }
  }, [post]);

  const sendComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/social/posts/${postId}/comments`, { content: text });
      setComments((prev) => [...prev, data]);
      setCommentText('');
      setPost((p) => (p ? { ...p, commentsCount: p.commentsCount + 1 } : p));
    } catch {
      Alert.alert('Error', 'Could not send comment.');
    } finally {
      setSending(false);
    }
  }, [commentText, sending, postId]);

  const deleteComment = useCallback(
    async (commentId: string) => {
      Alert.alert('Delete comment', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/social/comments/${commentId}`);
              setComments((prev) => removeComment(prev, commentId));
              setPost((p) => (p ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p));
            } catch {
              Alert.alert('Error', 'Could not delete comment.');
            }
          },
        },
      ]);
    },
    [],
  );

  const formatVolume = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k kg` : `${v} kg`);
  const formatDuration = (s?: number) => {
    if (!s) return '--';
    const m = Math.floor(s / 60);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  // Group workout sets by exercise
  const groupedSets = (sets: WorkoutSet[]) => {
    const map = new Map<string, { name: string; sets: WorkoutSet[] }>();
    for (const s of sets) {
      const key = s.exerciseId;
      if (!map.has(key)) {
        map.set(key, { name: s.exercise?.name ?? 'Exercise', sets: [] });
      }
      map.get(key)!.sets.push(s);
    }
    return Array.from(map.values());
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loader}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  const postUser = post.user;
  const initial = (postUser?.displayName || postUser?.username || '?')[0].toUpperCase();
  const bgColor = avatarColor(postUser?.username || 'u');

  const renderComment = (comment: Comment, depth = 0) => {
    const cUser = comment.user;
    const cInitial = (cUser?.displayName || cUser?.username || '?')[0].toUpperCase();
    const cBg = avatarColor(cUser?.username || 'u');
    const isOwn = currentUser?.id === comment.userId;

    return (
      <View key={comment.id}>
        <TouchableOpacity
          style={[styles.commentRow, { marginLeft: depth * 24 }]}
          activeOpacity={0.7}
          onLongPress={isOwn ? () => deleteComment(comment.id) : undefined}
        >
          <View style={[styles.commentAvatar, { backgroundColor: cBg }]}>
            <Text style={styles.commentAvatarText}>{cInitial}</Text>
          </View>
          <View style={styles.commentBody}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentUsername}>@{cUser?.username}</Text>
              <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
            </View>
            <Text style={styles.commentContent}>{comment.content}</Text>
          </View>
        </TouchableOpacity>
        {comment.replies?.map((r) => renderComment(r, depth + 1))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View>
            {/* Post card */}
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: bgColor }]}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.displayName}>{postUser?.displayName || 'User'}</Text>
                  <Text style={styles.meta}>
                    @{postUser?.username}  ·  {timeAgo(post.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Full workout breakdown */}
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

                  {/* Full exercise list */}
                  {post.workout.sets && post.workout.sets.length > 0 && (
                    <View style={styles.exerciseBreakdown}>
                      {groupedSets(post.workout.sets).map((group, i) => (
                        <View key={i} style={styles.exerciseGroup}>
                          <Text style={styles.exerciseGroupName}>{group.name}</Text>
                          {group.sets.map((s, j) => (
                            <Text key={j} style={styles.setDetail}>
                              Set {s.setNumber}: {s.weight ? `${s.weight}kg` : ''}{' '}
                              {s.reps ? `x ${s.reps}` : ''}{' '}
                              {s.isPR && (
                                <Text style={styles.prBadge}>PR</Text>
                              )}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Caption */}
              {post.content ? <Text style={styles.caption}>{post.content}</Text> : null}

              {/* Action bar */}
              <View style={styles.actionBar}>
                <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
                  <Ionicons
                    name={post.isLiked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={post.isLiked ? colors.like : colors.textMuted}
                  />
                  {post.likesCount > 0 && (
                    <Text style={[styles.actionCount, post.isLiked && { color: colors.like }]}>
                      {post.likesCount}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={toggleFire}>
                  <Ionicons
                    name={post.isFired ? 'flame' : 'flame-outline'}
                    size={22}
                    color={post.isFired ? colors.fire : colors.textMuted}
                  />
                  {post.sharesCount > 0 && (
                    <Text style={[styles.actionCount, post.isFired && { color: colors.fire }]}>
                      {post.sharesCount}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
                  {post.commentsCount > 0 && (
                    <Text style={styles.actionCount}>{post.commentsCount}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Comments section */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>
                Comments {post.commentsCount > 0 ? `(${post.commentsCount})` : ''}
              </Text>
              {comments.length === 0 ? (
                <Text style={styles.noComments}>No comments yet. Be the first!</Text>
              ) : (
                comments.map((c) => renderComment(c))
              )}
            </View>
          </View>
        }
        keyExtractor={() => 'header'}
        contentContainerStyle={styles.scrollContent}
      />

      {/* Comment input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor={colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
          onPress={sendComment}
          disabled={!commentText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons name="send" size={20} color={commentText.trim() ? colors.primary : colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function removeComment(comments: Comment[], id: string): Comment[] {
  return comments
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: removeComment(c.replies ?? [], id) }));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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

  // Workout
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
  exerciseBreakdown: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: spacing.sm,
  },
  exerciseGroup: {
    marginBottom: spacing.sm,
  },
  exerciseGroupName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as '600',
    color: colors.accent,
    marginBottom: 2,
  },
  setDetail: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    marginBottom: 1,
  },
  prBadge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold as '700',
    color: colors.warning,
  },

  caption: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },

  // Actions
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

  // Comments
  commentsSection: {
    padding: spacing.lg,
  },
  commentsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold as '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  noComments: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  commentBody: {
    flex: 1,
    marginLeft: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  commentUsername: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as '600',
    color: colors.textSecondary,
  },
  commentTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  commentContent: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
