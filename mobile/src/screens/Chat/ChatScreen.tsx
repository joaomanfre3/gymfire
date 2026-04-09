import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { ChatStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import api from '../../api/client';

type ChatRoute = RouteProp<ChatStackParamList, 'Chat'>;
type Nav = NativeStackNavigationProp<ChatStackParamList, 'Chat'>;

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  type: string;
  isDeleted: boolean;
  isEdited: boolean;
  replyToId?: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  readBy?: Array<{ userId: string; readAt: string }>;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function ChatScreen() {
  const route = useRoute<ChatRoute>();
  const navigation = useNavigation<Nav>();
  const { conversationId, name } = route.params;
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: name,
    });
  }, [navigation, name]);

  const fetchMessages = useCallback(
    async (skip = 0, append = false) => {
      try {
        const { data } = await api.get(
          `/messages/${conversationId}`,
          { params: { skip, limit: 50 } },
        );
        const msgs: MessageItem[] = Array.isArray(data) ? data : [];
        if (msgs.length < 50) setHasMore(false);
        setMessages((prev) => (append ? [...prev, ...msgs] : msgs));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Mark as read on focus
  useFocusEffect(
    useCallback(() => {
      api.post(`/messages/${conversationId}/read`).catch(() => {});
    }, [conversationId]),
  );

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText('');

    try {
      const { data } = await api.post(
        `/messages/${conversationId}`,
        { content: trimmed },
      );
      setMessages((prev) => [data, ...prev]);
    } catch {
      setText(trimmed); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    fetchMessages(messages.length, true);
  };

  const renderMessage = ({ item, index }: { item: MessageItem; index: number }) => {
    const isMine = item.senderId === currentUserId;
    const showSenderName =
      !isMine &&
      (index === messages.length - 1 ||
        messages[index + 1]?.senderId !== item.senderId);

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleSent : styles.bubbleReceived,
          ]}
        >
          {showSenderName && (
            <Text style={styles.senderName}>{item.sender.displayName}</Text>
          )}
          {item.isDeleted ? (
            <Text style={styles.deletedText}>Message deleted</Text>
          ) : (
            <Text
              style={[
                styles.messageText,
                isMine ? styles.messageTextSent : styles.messageTextReceived,
              ]}
            >
              {item.content}
            </Text>
          )}
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMine ? styles.messageTimeSent : styles.messageTimeReceived,
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
            {isMine && !item.isDeleted && (
              <Ionicons
                name={
                  item.readBy && item.readBy.length > 0
                    ? 'checkmark-done'
                    : 'checkmark'
                }
                size={14}
                color={
                  item.readBy && item.readBy.length > 0
                    ? colors.accent
                    : 'rgba(255,255,255,0.5)'
                }
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messageList}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              No messages yet. Say hello!
            </Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            text.trim().length === 0 && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={text.trim().length === 0 || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons name="send" size={20} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: colors.background,
  },
  messageList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  messageRow: {
    marginVertical: 2,
    maxWidth: '80%',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
  },
  messageRowLeft: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleSent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  senderName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold as '600',
    color: colors.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  messageTextSent: {
    color: '#FFFFFF',
  },
  messageTextReceived: {
    color: colors.text,
  },
  deletedText: {
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeSent: {
    color: 'rgba(255,255,255,0.6)',
  },
  messageTimeReceived: {
    color: colors.textMuted,
  },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    // Inverted list: this shows at the bottom visually
    transform: [{ scaleY: -1 }],
  },
  emptyChatText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
});
