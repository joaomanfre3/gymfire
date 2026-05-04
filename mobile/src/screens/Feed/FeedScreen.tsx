'use strict';

import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PostCard } from './components/PostCard';
import CommentsSheet from './sheets/CommentsSheet';
import ShareSheet from './sheets/ShareSheet';
import PostMenuSheet from './sheets/PostMenuSheet';
import { useFeedStore } from './store/feedStore';
import { useSheetsStore } from './store/sheetsStore';
import type { Post } from './types';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { posts, isLoading, isRefreshing, isLoadingMore, loadFirstPage, loadMore, refresh } =
    useFeedStore();
  const openSheet = useSheetsStore((s) => s.openSheet);

  useEffect(() => {
    if (posts.length === 0) loadFirstPage();
  }, []);

  const renderItem = useCallback(({ item }: { item: Post }) => <PostCard post={item} />, []);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return <ActivityIndicator color="#FF6B35" style={{ paddingVertical: 20 }} />;
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <Ionicons name="images-outline" size={56} color="#555" />
        <Text style={styles.emptyTitle}>Nenhum post ainda</Text>
        <Text style={styles.emptySubtitle}>Siga pessoas ou crie seu primeiro post!</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          scrollEnabled={openSheet === null}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor="#FF6B35"
              colors={['#FF6B35']}
            />
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          initialNumToRender={3}
          windowSize={5}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sheets — rendered outside FlatList */}
      {openSheet?.type === 'comments' && <CommentsSheet postId={openSheet.postId} />}
      {openSheet?.type === 'share' && <ShareSheet postId={openSheet.postId} />}
      {openSheet?.type === 'postMenu' && <PostMenuSheet post={openSheet.post} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#555', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#444', marginTop: 4 },
});
