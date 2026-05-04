import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Post } from '../../../components/Post/types';

interface Props {
  post: Post;
  size: number;
  isRightmost: boolean;
  onPress: () => void;
}

export default function ProfileGridItem({ post, size, isRightmost, onPress }: Props) {
  const imageUrl = post.images?.[0]?.url;

  if (!imageUrl) {
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: '#1a1a1a',
          marginRight: isRightmost ? 0 : 1.5,
          marginBottom: 1.5,
        }}
      />
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: size,
        height: size,
        marginRight: isRightmost ? 0 : 1.5,
        marginBottom: 1.5,
      }}
    >
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      {post.images.length > 1 && (
        <View style={styles.stackBadge}>
          <MaterialCommunityIcons name="image-multiple-outline" size={14} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  stackBadge: { position: 'absolute', top: 6, right: 6 },
});
