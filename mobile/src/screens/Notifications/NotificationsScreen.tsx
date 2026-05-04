'use strict';

import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import NotificationItem from './components/NotificationItem';
import { fetchNotifications, markAsRead } from './api/notifications';
import type { Notification } from './types';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications()
      .then((r) => {
        setNotifications(r.notifications);
        // Mark visible as read after 2s
        const unreadIds = r.notifications.filter((n) => !n.isRead).map((n) => n.id);
        if (unreadIds.length > 0) {
          setTimeout(() => {
            markAsRead(unreadIds);
            setNotifications((prev) =>
              prev.map((n) => (unreadIds.includes(n.id) ? { ...n, isRead: true } : n)),
            );
          }, 2000);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handlePress = useCallback(
    (n: Notification) => {
      switch (n.type) {
        case 'follow':
          navigation.navigate('Profile', { userId: n.actor.id });
          break;
        default:
          if (n.post) {
            navigation.navigate('PostDetail', { postId: n.post.id });
          }
          break;
      }
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF6B35" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotificationItem notification={item} onPress={() => handlePress(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color="#555" />
              <Text style={styles.emptyText}>Nenhuma notificação</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { height: 56, justifyContent: 'center', paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 16, color: '#555' },
});
