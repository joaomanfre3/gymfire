import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSheetsStore } from '../../store/sheetsStore';
import type { Post } from '../../types';

function formatRelativeUpper(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'AGORA';
  if (mins < 60) return `${mins} MINUTOS ATRÁS`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HORAS ATRÁS`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} DIAS ATRÁS`;
  const weeks = Math.floor(days / 7);
  return `${weeks} SEMANAS ATRÁS`;
}

interface Props {
  post: Post;
}

export default function PostEngagement({ post }: Props) {
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const open = useSheetsStore((s) => s.open);

  return (
    <View style={styles.container}>
      {post.likesCount > 0 && (
        <Text style={styles.likes}>
          {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'curtida' : 'curtidas'}
        </Text>
      )}

      {post.caption ? (
        <Text
          style={styles.caption}
          numberOfLines={captionExpanded ? undefined : 2}
        >
          <Text style={styles.captionUser}>{post.author.username}</Text>
          {'  '}
          {post.caption}
        </Text>
      ) : null}

      {!captionExpanded && post.caption && post.caption.length > 100 && (
        <TouchableOpacity onPress={() => setCaptionExpanded(true)}>
          <Text style={styles.moreLink}>mais</Text>
        </TouchableOpacity>
      )}

      {post.commentsCount > 0 && (
        <TouchableOpacity onPress={() => open({ type: 'comments', postId: post.id })}>
          <Text style={styles.commentsLink}>
            Ver todos os {post.commentsCount} comentários
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.timestamp}>{formatRelativeUpper(post.createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 4, paddingBottom: 12 },
  likes: { fontSize: 14, fontWeight: '600', color: '#fff' },
  caption: { fontSize: 14, color: '#fff', lineHeight: 20 },
  captionUser: { fontWeight: '600' },
  moreLink: { fontSize: 14, color: '#a8a8a8' },
  commentsLink: { fontSize: 14, color: '#a8a8a8' },
  timestamp: { fontSize: 11, color: '#a8a8a8', letterSpacing: 0.5, marginTop: 2 },
});
