import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FlatList,
  View,
  ActivityIndicator,
  RefreshControl,
  Text,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { postEvents } from '../../lib/postEvents';
import type { Post, FeedPage } from './types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Lazy import PostCard to avoid circular deps
let PostCardComponent: React.ComponentType<{ post: Post }> | null = null;
function getPostCard() {
  if (!PostCardComponent) {
    PostCardComponent = require('../../screens/Feed/components/PostCard').PostCard;
  }
  return PostCardComponent!;
}

interface PostListProps {
  fetchPage: (cursor?: string) => Promise<FeedPage>;
  initialPostId?: string;
  cacheKey: string;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement;
  scrollEnabled?: boolean;
}

export function PostList({
  fetchPage,
  initialPostId,
  cacheKey,
  ListHeaderComponent,
  scrollEnabled = true,
}: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Subscribe to post events (update/remove/add) for optimistic cross-view sync.
  useEffect(() => {
    return postEvents.subscribe((event) => {
      if (event.type === 'update') {
        setPosts((prev) => prev.map((p) => (p.id === event.post.id ? event.post : p)));
      } else if (event.type === 'remove') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setPosts((prev) => prev.filter((p) => p.id !== event.postId));
      } else if (event.type === 'add') {
        setPosts((prev) => (event.prepend ? [event.post, ...prev] : [...prev, event.post]));
      }
    });
  }, []);

  const loadFirst = useCallback(async () => {
    setIsLoading(true);
    try {
      const page = await fetchPage();
      setPosts(page.posts);
      setNextCursor(page.nextCursor);
    } catch {}
    setIsLoading(false);
  }, [fetchPage]);

  useEffect(() => {
    loadFirst();
  }, [cacheKey]);

  // Scroll to initial post after first load
  useEffect(() => {
    if (initialPostId && posts.length > 0) {
      const idx = posts.findIndex((p) => p.id === initialPostId);
      if (idx > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: idx, animated: false });
        }, 100);
      }
    }
  }, [initialPostId, posts.length > 0]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const page = await fetchPage();
      setPosts(page.posts);
      setNextCursor(page.nextCursor);
    } catch {}
    setIsRefreshing(false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await fetchPage(nextCursor);
      setPosts((prev) => [...prev, ...page.posts]);
      setNextCursor(page.nextCursor);
    } catch {}
    setIsLoadingMore(false);
  }, [nextCursor, isLoadingMore, fetchPage]);

  const PostCard = getPostCard();

  const renderItem = useCallback(
    ({ item }: { item: Post }) => <PostCard post={item} />,
    [],
  );

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={posts}
      keyExtractor={(p) => p.id}
      renderItem={renderItem}
      scrollEnabled={scrollEnabled}
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
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        isLoadingMore ? (
          <ActivityIndicator color="#FF6B35" style={{ paddingVertical: 20 }} />
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={56} color="#555" />
          <Text style={styles.emptyTitle}>Nenhum post ainda</Text>
        </View>
      }
      initialNumToRender={3}
      windowSize={5}
      showsVerticalScrollIndicator={false}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
        }, 100);
      }}
    />
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#555', marginTop: 12 },
});
