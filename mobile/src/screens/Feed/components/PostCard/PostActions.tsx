import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useSheetsStore } from '../../store/sheetsStore';
import { usePostActions } from '../../hooks/usePostActions';
import type { Post } from '../../types';

interface Props {
  post: Post;
}

export default function PostActions({ post }: Props) {
  const { toggleLike, toggleSave } = usePostActions(post);
  const open = useSheetsStore((s) => s.open);
  const likeScale = useSharedValue(1);

  const handleLike = () => {
    likeScale.value = withSpring(1.3, { damping: 8 }, () => {
      likeScale.value = withSpring(1);
    });
    toggleLike();
  };

  const likeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <TouchableOpacity onPress={handleLike} style={styles.hitArea}>
          <Animated.View style={likeStyle}>
            <MaterialCommunityIcons
              name={post.viewerLiked ? 'fire' : 'fire'}
              size={26}
              color={post.viewerLiked ? '#FF6B35' : '#fff'}
            />
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => open({ type: 'comments', postId: post.id })}
          style={styles.hitArea}
        >
          <Feather name="message-circle" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => open({ type: 'share', postId: post.id })}
          style={styles.hitArea}
        >
          <Feather name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={toggleSave} style={styles.hitArea}>
        <Feather
          name="bookmark"
          size={24}
          color="#fff"
          style={post.viewerSaved ? { fill: '#fff' } as any : undefined}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  hitArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
