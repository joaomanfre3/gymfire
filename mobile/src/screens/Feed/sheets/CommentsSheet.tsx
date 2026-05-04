import React, { useRef, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { useComments } from '../hooks/useComments';
import { useSheetsStore } from '../store/sheetsStore';
import type { Comment } from '../types';

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface Props {
  postId: string;
}

export default function CommentsSheet({ postId }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const close = useSheetsStore((s) => s.close);
  const { comments, isLoading, add } = useComments(postId);
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    add(text.trim());
    setText('');
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const initial = (item.author.name || item.author.username)[0].toUpperCase();
    return (
      <View style={styles.commentRow}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.commentText}>
            <Text style={styles.commentUser}>{item.author.username}</Text>
            {'  '}
            {item.text}
          </Text>
          <View style={styles.commentMeta}>
            <Text style={styles.commentTime}>{formatTime(item.createdAt)}</Text>
            {item.likesCount > 0 && (
              <Text style={styles.commentTime}>{item.likesCount} curtidas</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={close}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={0.5}
        />
      )}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
    >
      <Text style={styles.title}>Comentários</Text>
      <View style={styles.divider} />

      <BottomSheetFlatList
        data={comments}
        keyExtractor={(i) => i.id}
        renderItem={renderComment}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
      />

      <View style={styles.inputBar}>
        <BottomSheetTextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Adicione um comentário..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim()}
          style={{ opacity: text.trim() ? 1 : 0.4 }}
        >
          <Text style={styles.sendBtn}>Publicar</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  handle: { backgroundColor: '#555' },
  title: { fontSize: 15, fontWeight: '600', color: '#fff', textAlign: 'center', paddingVertical: 10 },
  divider: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)' },
  commentRow: { flexDirection: 'row', paddingVertical: 10, gap: 10 },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center',
  },
  commentAvatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  commentText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  commentUser: { fontWeight: '600' },
  commentMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  commentTime: { fontSize: 12, color: '#a8a8a8' },
  inputBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1, fontSize: 14, color: '#fff',
    backgroundColor: '#2a2a2a', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    marginRight: 10,
  },
  sendBtn: { fontSize: 14, fontWeight: '600', color: '#FF6B35' },
});
