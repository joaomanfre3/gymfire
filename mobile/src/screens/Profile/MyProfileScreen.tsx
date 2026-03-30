import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontSize } from '../../theme/typography';
import { ProfileStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { StreakStatus } from '../../types';
import api from '../../api/client';
import Avatar from '../../components/common/Avatar';
import FoguinhoIcon from '../../components/gamification/FoguinhoIcon';
import StreakCard from '../../components/gamification/StreakCard';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'MyProfile'>;

export default function MyProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [streakStatus, setStreakStatus] = useState<StreakStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStreak = useCallback(async () => {
    try {
      const { data } = await api.get('/streak/status');
      setStreakStatus(data);
    } catch {
      // Use user data as fallback
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStreak();
    setRefreshing(false);
  }, [fetchStreak]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const currentStreak = streakStatus?.currentStreak ?? user?.currentStreak ?? 0;
  const longestStreak = streakStatus?.longestStreak ?? user?.longestStreak ?? 0;
  const multiplier = streakStatus?.multiplier ?? 1;
  const nextMilestone = streakStatus?.nextMilestone;

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Cover Photo */}
      <View style={styles.coverPhoto}>
        <View style={styles.coverGradient} />
      </View>

      {/* Avatar + Name */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrapper}>
          <Avatar
            user={user ?? undefined}
            size={96}
            showStreakRing
          />
        </View>

        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>
              {user?.displayName || 'GymFire User'}
            </Text>
            {user?.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.accent}
                style={styles.verifiedBadge}
              />
            )}
          </View>
          <Text style={styles.username}>@{user?.username || 'unknown'}</Text>
          {user?.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : null}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statValueRow}>
            <Text style={styles.statEmoji}>{'\u{1F525}'}</Text>
            <Text style={styles.statNumber}>
              {user?.totalPoints?.toLocaleString() ?? 0}
            </Text>
          </View>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Streak Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streak</Text>
        <StreakCard
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          multiplier={multiplier}
          nextMilestone={nextMilestone}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={18} color={colors.text} />
          <Text style={styles.actionBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={18} color={colors.text} />
          <Text style={styles.actionBtnText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.placeholderCard}>
          <Ionicons name="time-outline" size={32} color={colors.textMuted} />
          <Text style={styles.placeholderText}>
            Your recent workouts and achievements will appear here.
          </Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.7}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.xxxl,
  },

  // Cover
  coverPhoto: {
    height: 140,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  coverGradient: {
    flex: 1,
    backgroundColor: colors.primary,
    opacity: 0.15,
  },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    marginTop: -48,
    paddingHorizontal: spacing.lg,
  },
  avatarWrapper: {
    borderRadius: 60,
    padding: 4,
    backgroundColor: colors.background,
  },
  nameSection: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    ...typography.h2,
    color: colors.text,
  },
  verifiedBadge: {
    marginLeft: spacing.xs,
  },
  username: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: fontSize.lg,
  },
  statNumber: {
    ...typography.h3,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.surfaceBorder,
  },

  // Sections
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  actionBtnText: {
    ...typography.button,
    color: colors.text,
  },

  // Placeholder
  placeholderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.md,
  },
  placeholderText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  logoutText: {
    ...typography.button,
    color: colors.error,
  },
});
