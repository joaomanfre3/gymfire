import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

interface DropUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface DropGroup {
  user: DropUser;
  speeds: { id: string; isViewed?: boolean }[];
  hasUnseen: boolean;
}

interface DropsBarProps {
  onOpenDrops: (userId: string) => void;
  onCreateDrop: () => void;
}

function avatarColor(name: string): string {
  const palette = ['#FF6B35', '#4ECDC4', '#22C55E', '#FACC15', '#EF4444', '#A855F7', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function DropsBar({ onOpenDrops, onCreateDrop }: DropsBarProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState<DropGroup[]>([]);

  const fetchDrops = useCallback(async () => {
    try {
      const res = await api.get('/drops');
      const payload = res.data;
      const raw = Array.isArray(payload) ? payload : (payload?.data ?? []);
      // Filter out entries with missing user or speeds
      const feed: DropGroup[] = raw.filter(
        (g: any) => g && g.user && g.user.id && Array.isArray(g.speeds),
      );
      // Sort: unseen first, seen last
      feed.sort((a, b) => {
        const aUnseen = a.speeds.some((s) => !s.isViewed);
        const bUnseen = b.speeds.some((s) => !s.isViewed);
        if (aUnseen && !bUnseen) return -1;
        if (!aUnseen && bUnseen) return 1;
        return 0;
      });
      setGroups(feed);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchDrops();
  }, [fetchDrops]);

  const myId = currentUser?.id;
  const myGroup = myId ? groups.find((g) => g.user.id === myId) : undefined;
  const otherGroups = myId ? groups.filter((g) => g.user.id !== myId) : groups;

  const renderAvatar = (user: DropUser, hasUnseen: boolean, size: number) => {
    const initial = (user.displayName || user.username || '?')[0].toUpperCase();
    const bgColor = avatarColor(user.username || 'u');
    const avatarSize = size - 6;

    const avatarContent = user.avatarUrl ? (
      <Image source={{ uri: user.avatarUrl }} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} />
    ) : (
      <View style={[styles.avatarFallback, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: bgColor }]}>
        <Text style={[styles.avatarInitial, { fontSize: avatarSize * 0.4 }]}>{initial}</Text>
      </View>
    );

    if (hasUnseen) {
      return (
        <LinearGradient
          colors={['#FBBF24', '#F97316', '#EF4444', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientRing, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <View style={[styles.avatarInner, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
            {avatarContent}
          </View>
        </LinearGradient>
      );
    }

    return (
      <View style={[styles.seenRing, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={[styles.avatarInner, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
          {avatarContent}
        </View>
      </View>
    );
  };

  const renderMyDrop = () => {
    if (!currentUser) return null;
    const hasMyDrops = !!myGroup;
    const hasUnseen = myGroup ? myGroup.speeds.some((s) => !s.isViewed) : false;

    return (
      <TouchableOpacity
        style={styles.dropItem}
        onPress={hasMyDrops ? () => onOpenDrops(currentUser.id) : onCreateDrop}
      >
        <View>
          {renderAvatar(
            {
              id: currentUser.id,
              username: currentUser.username,
              displayName: currentUser.displayName || currentUser.username,
              avatarUrl: currentUser.avatarUrl,
            },
            hasUnseen,
            68,
          )}
          {/* "+" button */}
          <View style={styles.addBtnContainer}>
            <TouchableOpacity style={styles.addBtn} onPress={onCreateDrop}>
              <Ionicons name="add" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.dropUsername} numberOfLines={1}>Seu drop</Text>
      </TouchableOpacity>
    );
  };

  const renderDropItem = ({ item }: { item: DropGroup }) => {
    const hasUnseen = item.speeds.some((s) => !s.isViewed);
    return (
      <TouchableOpacity
        style={styles.dropItem}
        onPress={() => onOpenDrops(item.user.id)}
      >
        {renderAvatar(item.user, hasUnseen, 68)}
        <Text style={[styles.dropUsername, !hasUnseen && styles.dropUsernameSeen]} numberOfLines={1}>
          {item.user.username}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={otherGroups}
        keyExtractor={(item) => item.user.id}
        renderItem={renderDropItem}
        ListHeaderComponent={renderMyDrop}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  dropItem: {
    alignItems: 'center',
    marginRight: 14,
    width: 72,
  },
  gradientRing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  seenRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 1,
  },
  avatarInner: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000000',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addBtnContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  addBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0095F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  dropUsername: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  dropUsernameSeen: {
    color: 'rgba(255,255,255,0.4)',
  },
});
