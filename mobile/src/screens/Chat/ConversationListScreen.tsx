import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { ChatStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import api from '../../api/client';

type Nav = NativeStackNavigationProp<ChatStackParamList, 'ConversationList'>;

interface ConversationItem {
  id: string;
  type: string;
  name?: string;
  participants: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string;
    };
  }>;
  lastMessage?: {
    id: string;
    content?: string;
    senderId: string;
    isDeleted: boolean;
    sender: { id: string; displayName: string };
    createdAt: string;
  };
  unreadCount: number;
  lastMessageAt?: string;
}

function avatarColor(name: string): string {
  const palette = ['#FF6B35', '#4ECDC4', '#22C55E', '#FACC15', '#EF4444', '#A855F7', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export default function ConversationListScreen() {
  const navigation = useNavigation<Nav>();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchConversations();
    }, [fetchConversations]),
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('NewConversation')}
          style={{ marginRight: spacing.sm }}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const getConversationName = (conv: ConversationItem): string => {
    if (conv.name) return conv.name;
    if (conv.type === 'DIRECT') {
      const other = conv.participants.find((p) => p.userId !== currentUserId);
      return other?.user?.displayName || 'Unknown';
    }
    return conv.participants.map((p) => p.user?.displayName).join(', ');
  };

  const getAvatarInitial = (conv: ConversationItem): string => {
    const name = getConversationName(conv);
    return name[0]?.toUpperCase() || '?';
  };

  const getLastMessagePreview = (conv: ConversationItem): string => {
    if (!conv.lastMessage) return 'No messages yet';
    if (conv.lastMessage.isDeleted) return 'Message deleted';
    const prefix =
      conv.lastMessage.senderId === currentUserId
        ? 'You: '
        : conv.type === 'GROUP'
          ? `${conv.lastMessage.sender?.displayName}: `
          : '';
    return `${prefix}${conv.lastMessage.content || ''}`;
  };

  const renderItem = ({ item }: { item: ConversationItem }) => {
    const name = getConversationName(item);
    const initial = getAvatarInitial(item);
    const bg = avatarColor(name);
    const preview = getLastMessagePreview(item);
    const time = item.lastMessageAt ? timeAgo(item.lastMessageAt) : '';
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.id,
            name,
          })
        }
      >
        <View style={[styles.avatar, { backgroundColor: bg }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.topRow}>
            <Text
              style={[styles.conversationName, hasUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text style={[styles.time, hasUnread && styles.unreadTime]}>
              {time}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            <Text
              style={[styles.preview, hasUnread && styles.unreadPreview]}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation with someone
          </Text>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => navigation.navigate('NewConversation')}
          >
            <Text style={styles.newButtonText}>New Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingVertical: spacing.sm,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  unreadTime: {
    color: colors.primary,
  },
  preview: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadText: {
    color: colors.text,
  },
  unreadPreview: {
    color: colors.textSecondary,
    fontWeight: fontWeight.medium as '500',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold as '600',
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  newButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  newButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    color: colors.text,
  },
});
