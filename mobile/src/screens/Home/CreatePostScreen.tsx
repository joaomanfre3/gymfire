'use strict';

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import api from '../../api/client';
import { HomeStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreatePost'>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PostType = 'WORKOUT' | 'MOTIVATION' | 'PROGRESS' | 'TIP';

const postTypes: Array<{ type: PostType; label: string; icon: string }> = [
  { type: 'WORKOUT', label: 'Treino', icon: 'barbell-outline' },
  { type: 'MOTIVATION', label: 'Motivação', icon: 'flame-outline' },
  { type: 'PROGRESS', label: 'Progresso', icon: 'trending-up-outline' },
  { type: 'TIP', label: 'Dica', icon: 'bulb-outline' },
];

export default function CreatePostScreen({ navigation, route }: Props) {
  const user = useAuthStore(s => s.user);
  const mediaUri = route.params?.mediaUri;
  const [caption, setCaption] = useState('');
  const [postType, setPostType] = useState<PostType>('WORKOUT');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!caption.trim()) return;
    setSubmitting(true);

    try {
      await api.post('/social/posts', {
        caption: caption.trim(),
        type: postType,
        visibility: 'PUBLIC',
      });
      Alert.alert('Publicado!', 'Seu post foi publicado com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.');
    }

    setSubmitting(false);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Spark</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !caption.trim()}
          style={[styles.postBtn, (!caption.trim() || submitting) && { opacity: 0.4 }]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.postBtnText}>Postar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Selected image preview */}
        {mediaUri && (
          <Image
            source={{ uri: mediaUri }}
            style={styles.mediaPreview}
            resizeMode="cover"
          />
        )}

        {/* Type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {postTypes.map(pt => (
              <TouchableOpacity
                key={pt.type}
                onPress={() => setPostType(pt.type)}
                style={[
                  styles.typeBtn,
                  postType === pt.type && styles.typeBtnActive,
                ]}
              >
                <Ionicons
                  name={pt.icon as any}
                  size={14}
                  color={postType === pt.type ? colors.textInverse : colors.textSecondary}
                />
                <Text style={[
                  styles.typeText,
                  postType === pt.type && { color: colors.textInverse },
                ]}>
                  {pt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* User info */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.username || '?')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.displayName || user?.username}</Text>
            <Text style={styles.userPublic}>Público</Text>
          </View>
        </View>

        {/* Caption */}
        <TextInput
          style={styles.textArea}
          value={caption}
          onChangeText={setCaption}
          placeholder="O que você quer compartilhar?"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          autoFocus={!mediaUri}
        />
        <Text style={styles.charCount}>{caption.length}/500</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  postBtn: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  postBtnText: { fontSize: 13, fontWeight: '700', color: colors.textInverse },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  typeBtnActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  typeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.text },
  userName: { fontSize: 14, fontWeight: '600', color: colors.text },
  userPublic: { fontSize: 11, color: colors.textMuted },
  textArea: {
    fontSize: 16, color: colors.text, lineHeight: 24,
    minHeight: 120, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
  mediaPreview: {
    width: SCREEN_WIDTH - 32,
    height: (SCREEN_WIDTH - 32) * 0.75,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
});
