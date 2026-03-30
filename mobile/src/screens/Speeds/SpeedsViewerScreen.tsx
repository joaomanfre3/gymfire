import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
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
  const { userId } = route.params;

  const [groups, setGroups] = useState<SpeedGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentSpeedIndex, setCurrentSpeedIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const { data } = await api.get('/speeds/feed');
      const feed: SpeedGroup[] = Array.isArray(data) ? data : [];
      setGroups(feed);

      // Find the group matching the target userId
      const targetIndex = feed.findIndex((g) => g.user.id === userId);
      if (targetIndex >= 0) {
        setCurrentGroupIndex(targetIndex);
      }
    } catch {
      // If feed fails, try to get user's speeds directly
      try {
        const { data } = await api.get(`/speeds/user/${userId}`);
        const speeds: Speed[] = Array.isArray(data) ? data : [];
        if (speeds.length > 0) {
          setGroups([{ user: speeds[0].user, speeds }]);
        }
      } catch {
        // silently fail
      }
    }
  };

  const currentGroup = groups[currentGroupIndex];
  const currentSpeed = currentGroup?.speeds[currentSpeedIndex];

  // Mark speed as viewed
  useEffect(() => {
    if (currentSpeed) {
      api.post(`/speeds/${currentSpeed.id}/view`).catch(() => {});
    }
  }, [currentSpeed?.id]);

  // Progress bar auto-advance
  useEffect(() => {
    if (!currentSpeed) return;

    progressAnim.setValue(0);
    const duration = currentSpeed.duration || 5000;

    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        goNext();
      }
    });

    return () => {
      animation.stop();
    };
  }, [currentGroupIndex, currentSpeedIndex, currentSpeed?.id]);

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
      if (x < SCREEN_WIDTH / 3) {
        goPrev();
      } else {
        goNext();
      }
    },
    [goPrev, goNext],
  );

  if (!currentGroup || !currentSpeed) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No speeds to show</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const user = currentSpeed.user;
  const initial = (user.displayName || user.username || '?')[0].toUpperCase();
  const bgColor = avatarColor(user.username || 'u');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Media area (tap zones) */}
      <TouchableOpacity
        style={styles.mediaContainer}
        activeOpacity={1}
        onPress={(e) => handleTap(e.nativeEvent.locationX)}
      >
        {currentSpeed.mediaUrl ? (
          <Image
            source={{ uri: currentSpeed.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.media, styles.mediaPlaceholder]}>
            <Ionicons name="image-outline" size={64} color={colors.textMuted} />
          </View>
        )}
      </TouchableOpacity>

      {/* Progress bars at top */}
      <SafeAreaView style={styles.topOverlay}>
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

        {/* User info */}
        <View style={styles.userRow}>
          <View style={[styles.avatar, { backgroundColor: bgColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.timeAgo}>{timeAgo(currentSpeed.createdAt)}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom overlay */}
      <View style={styles.bottomOverlay}>
        {currentSpeed.caption ? (
          <Text style={styles.caption} numberOfLines={3}>
            {currentSpeed.caption}
          </Text>
        ) : null}
        <View style={styles.viewsRow}>
          <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.viewsText}>{currentSpeed.viewsCount}</Text>
        </View>
      </View>
    </View>
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
    color: colors.textSecondary,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  username: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    color: '#FFFFFF',
  },
  timeAgo: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },

  // Bottom overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  caption: {
    fontSize: fontSize.md,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
