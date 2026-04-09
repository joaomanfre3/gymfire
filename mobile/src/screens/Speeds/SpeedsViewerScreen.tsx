import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { HomeStackParamList } from '../../navigation/types';
import api from '../../api/client';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'SpeedsViewer'>;
type Route = RouteProp<HomeStackParamList, 'SpeedsViewer'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Speed {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption?: string;
  duration: number;
  viewsCount: number;
  createdAt: string;
  isViewed?: boolean;
  isLiked?: boolean;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

interface SpeedGroup {
  user: Speed['user'];
  speeds: Speed[];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function avatarColor(name: string): string {
  const palette = ['#FF6B35', '#4ECDC4', '#22C55E', '#FACC15', '#EF4444', '#A855F7', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function SpeedsViewerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { userId } = route.params;

  const [groups, setGroups] = useState<SpeedGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentSpeedIndex, setCurrentSpeedIndex] = useState(0);
  const [fired, setFired] = useState(false);
  const [comment, setComment] = useState('');
  const [paused, setPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fireScale = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const { data } = await api.get('/drops');
      const feed: SpeedGroup[] = Array.isArray(data) ? data : [];
      setGroups(feed);
      const targetIndex = feed.findIndex((g) => g.user.id === userId);
      if (targetIndex >= 0) setCurrentGroupIndex(targetIndex);
    } catch {
      try {
        const { data } = await api.get(`/speeds/user/${userId}`);
        const speeds: Speed[] = Array.isArray(data) ? data : [];
        if (speeds.length > 0) setGroups([{ user: speeds[0].user, speeds }]);
      } catch {}
    }
  };

  const currentGroup = groups[currentGroupIndex];
  const currentSpeed = currentGroup?.speeds[currentSpeedIndex];

  // Mark as viewed
  useEffect(() => {
    if (currentSpeed) {
      api.post(`/drops/${currentSpeed.id}/view`).catch(() => {});
      setFired(!!currentSpeed.isLiked);
    }
  }, [currentSpeed?.id]);

  // Progress bar auto-advance (max 60s)
  useEffect(() => {
    if (!currentSpeed || paused) return;

    progressAnim.setValue(0);
    const duration = Math.min(currentSpeed.duration || 5000, 60000);

    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });
    animRef.current = animation;

    animation.start(({ finished }) => {
      if (finished) goNext();
    });

    return () => {
      animation.stop();
      animRef.current = null;
    };
  }, [currentGroupIndex, currentSpeedIndex, currentSpeed?.id, paused]);

  const goNext = useCallback(() => {
    if (!currentGroup) return;
    if (currentSpeedIndex < currentGroup.speeds.length - 1) {
      setCurrentSpeedIndex((i) => i + 1);
    } else if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex((i) => i + 1);
      setCurrentSpeedIndex(0);
    } else {
      navigation.goBack();
    }
  }, [currentGroup, currentSpeedIndex, currentGroupIndex, groups.length, navigation]);

  const goPrev = useCallback(() => {
    if (currentSpeedIndex > 0) {
      setCurrentSpeedIndex((i) => i - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex((i) => i - 1);
      const prevGroup = groups[currentGroupIndex - 1];
      setCurrentSpeedIndex(prevGroup ? prevGroup.speeds.length - 1 : 0);
    }
  }, [currentSpeedIndex, currentGroupIndex, groups]);

  const handleTap = useCallback(
    (x: number) => {
      if (x < SCREEN_WIDTH * 0.3) {
        goPrev();
      } else {
        goNext();
      }
    },
    [goPrev, goNext],
  );

  // Fire toggle (boolean, not counter)
  const toggleFire = useCallback(async () => {
    const newState = !fired;
    setFired(newState);

    // Animate the fire icon
    Animated.sequence([
      Animated.timing(fireScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(fireScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    if (currentSpeed) {
      try {
        await api.post(`/drops/${currentSpeed.id}/like`);
      } catch {}
    }
  }, [fired, currentSpeed, fireScale]);

  // Send comment
  const sendComment = useCallback(async () => {
    if (!comment.trim() || !currentSpeed) return;
    try {
      await api.post(`/drops/${currentSpeed.id}/comments`, { content: comment.trim() });
      setComment('');
    } catch {}
  }, [comment, currentSpeed]);

  if (!currentGroup || !currentSpeed) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
          <Text style={styles.emptyText}>Nenhum drop disponivel</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const user = currentSpeed.user;
  const initial = (user.displayName || user.username || '?')[0].toUpperCase();
  const bgColor = avatarColor(user.username || 'u');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* Full screen media */}
      <TouchableOpacity
        style={styles.mediaContainer}
        activeOpacity={1}
        onPress={(e) => handleTap(e.nativeEvent.locationX)}
        onLongPress={() => setPaused(true)}
        onPressOut={() => setPaused(false)}
      >
        {currentSpeed.mediaUrl ? (
          <Image
            source={{ uri: currentSpeed.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.media, styles.mediaPlaceholder]}>
            <Ionicons name="image-outline" size={64} color="rgba(255,255,255,0.3)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Top overlay: progress bars + user info */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        {/* Progress bars */}
        <View style={styles.progressContainer}>
          {currentGroup.speeds.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width:
                      i < currentSpeedIndex
                        ? '100%'
                        : i === currentSpeedIndex
                          ? progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            })
                          : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* User row */}
        <View style={styles.userRow}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, { backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.userAvatarText}>{initial}</Text>
            </View>
          )}
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.timeAgo}>{timeAgo(currentSpeed.createdAt)}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Caption overlay (mentions style) */}
      {currentSpeed.caption ? (
        <View style={styles.captionOverlay}>
          <Text style={styles.captionText}>{currentSpeed.caption}</Text>
        </View>
      ) : null}

      {/* Bottom bar: comment input + fire */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Enviar mensagem..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            onSubmitEditing={sendComment}
            returnKeyType="send"
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          />
        </View>

        <TouchableOpacity onPress={toggleFire} style={styles.fireBtn}>
          <Animated.View style={{ transform: [{ scale: fireScale }] }}>
            <Ionicons
              name={fired ? 'flame' : 'flame-outline'}
              size={28}
              color={fired ? '#FF6B35' : '#FFFFFF'}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.5)',
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  mediaContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeAgo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },

  // Caption
  captionOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
  },
  captionText: {
    fontSize: 15,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 22,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
  },
  commentInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  commentInput: {
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fireBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
