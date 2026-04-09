import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { useAuthStore } from '../../stores/authStore';
import { RankingEntry } from '../../types';
import api from '../../api/client';

type Tab = 'weekly' | 'allTime';

function avatarColor(name: string): string {
  const palette = ['#FF6B35', '#4ECDC4', '#22C55E', '#FACC15', '#EF4444', '#A855F7', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function RankingScreen() {
  const currentUser = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('weekly');
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = useCallback(async () => {
    try {
      const { data } = await api.get('/ranking', { params: { type: tab === 'weekly' ? 'weekly' : 'alltime' } });
      setEntries(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setEntries([]);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    fetchRanking().finally(() => setLoading(false));
  }, [fetchRanking]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRanking();
    setRefreshing(false);
  }, [fetchRanking]);

  const renderEntry = ({ item }: { item: RankingEntry }) => {
    const pos = item.posicao;
    const isTop3 = pos >= 1 && pos <= 3;
    const isMe = currentUser?.id === item.user.id;
    const initial = (item.user.displayName || item.user.username)[0].toUpperCase();
    const bg = avatarColor(item.user.username);
    const medalColor = isTop3 ? MEDAL_COLORS[pos - 1] : undefined;

    return (
      <View style={[styles.entry, isTop3 && styles.entryTop3, isMe && styles.entryMe]}>
        {/* Position */}
        <View style={[styles.positionBadge, isTop3 && { backgroundColor: medalColor }]}>
          {isTop3 ? (
            <Ionicons name="trophy" size={16} color="#0A0A0F" />
          ) : (
            <Text style={styles.positionText}>{pos}</Text>
          )}
        </View>

        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: bg },
            isTop3 && { width: 48, height: 48, borderRadius: 24 },
          ]}
        >
          <Text style={[styles.avatarText, isTop3 && { fontSize: fontSize.xl }]}>{initial}</Text>
        </View>

        {/* Info */}
        <View style={styles.entryInfo}>
          <Text style={[styles.displayName, isTop3 && { fontSize: fontSize.lg }]} numberOfLines={1}>
            {item.user.displayName}
          </Text>
          <Text style={styles.username}>@{item.user.username}</Text>
        </View>

        {/* Points */}
        <View style={styles.pointsCol}>
          <Text style={[styles.pointsValue, isTop3 && { color: medalColor, fontSize: fontSize.lg }]}>
            {item.points.toLocaleString()}
          </Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'weekly' && styles.tabActive]}
          onPress={() => setTab('weekly')}
        >
          <Text style={[styles.tabText, tab === 'weekly' && styles.tabTextActive]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'allTime' && styles.tabActive]}
          onPress={() => setTab('allTime')}
        >
          <Text style={[styles.tabText, tab === 'allTime' && styles.tabTextActive]}>All Time</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="podium-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyText}>No rankings yet</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => `${e.posicao}-${e.user.id}`}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
  },

  // List
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  entryTop3: {
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing.lg,
  },
  entryMe: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  positionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold as '700',
    color: colors.textSecondary,
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
  entryInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  displayName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    color: colors.text,
  },
  username: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  pointsCol: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold as '700',
    color: colors.accent,
  },
  pointsLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
