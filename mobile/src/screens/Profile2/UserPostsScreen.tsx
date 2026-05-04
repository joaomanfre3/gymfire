'use strict';

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PostList } from '../../components/Post';
import { fetchUserPosts } from './api/profile';
import { useSheetsStore } from '../Feed/store/sheetsStore';
import CommentsSheet from '../Feed/sheets/CommentsSheet';
import ShareSheet from '../Feed/sheets/ShareSheet';
import PostMenuSheet from '../Feed/sheets/PostMenuSheet';

type Props = NativeStackScreenProps<any, 'UserPosts'>;

export default function UserPostsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { userId, initialPostId } = route.params as { userId: string; initialPostId?: string };
  const openSheet = useSheetsStore((s) => s.openSheet);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Posts</Text>
        <View style={styles.headerBtn} />
      </View>
      <PostList
        fetchPage={(cursor) => fetchUserPosts(userId, cursor)}
        initialPostId={initialPostId}
        cacheKey={`user-posts-${userId}`}
        scrollEnabled={openSheet === null}
      />

      {openSheet?.type === 'comments' && <CommentsSheet postId={openSheet.postId} />}
      {openSheet?.type === 'share' && <ShareSheet postId={openSheet.postId} />}
      {openSheet?.type === 'postMenu' && <PostMenuSheet post={openSheet.post} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 56, paddingHorizontal: 8,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
