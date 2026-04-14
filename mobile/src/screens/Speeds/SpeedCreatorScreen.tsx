'use strict';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import api from '../../api/client';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'SpeedCreator'>;

export default function SpeedCreatorScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<HomeStackParamList, 'SpeedCreator'>>();

  const [image, setImage] = useState<{ uri: string; type: string; name: string } | null>(null);

  // Pre-populate image when coming from MediaPicker
  useEffect(() => {
    const mediaUri = route.params?.mediaUri;
    if (mediaUri) {
      const isVideo = /\.(mp4|mov|avi|webm)$/i.test(mediaUri);
      setImage({
        uri: mediaUri,
        type: isVideo ? 'video/mp4' : 'image/jpeg',
        name: isVideo ? 'gallery-video.mp4' : 'gallery-photo.jpg',
      });
    }
  }, [route.params?.mediaUri]);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [9, 16],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'photo.jpg',
      });
    }
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [9, 16],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const isVideo = asset.type === 'video';
      setImage({
        uri: asset.uri,
        type: isVideo ? 'video/mp4' : (asset.mimeType || 'image/jpeg'),
        name: asset.fileName || (isVideo ? 'video.mp4' : 'photo.jpg'),
      });
    }
  }

  async function handlePublish() {
    if (!image) return;
    setLoading(true);

    try {
      // Upload to Cloudinary via API
      const formData = new FormData();
      formData.append('file', {
        uri: image.uri,
        type: image.type,
        name: image.name,
      } as any);

      const token = await AsyncStorage.getItem('access_token');
      const uploadRes = await fetch('https://gymfire.vercel.app/api/drops/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload falhou');
      const { mediaUrl, mediaType } = await uploadRes.json();

      // Create drop
      await api.post('/drops', {
        mediaUrl,
        mediaType,
        caption: caption.trim() || undefined,
      });

      Alert.alert('Publicado!', 'Seu drop foi publicado.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {image ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(null)}>
              <Ionicons name="close-circle" size={32} color={colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Criar Drop</Text>
            <Text style={styles.pickerDesc}>Tire uma foto ou escolha da galeria</Text>
            <View style={styles.pickerButtons}>
              <TouchableOpacity style={styles.pickerBtn} onPress={pickFromCamera}>
                <Ionicons name="camera" size={32} color={colors.primary} />
                <Text style={styles.pickerBtnText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerBtn} onPress={pickFromGallery}>
                <Ionicons name="images" size={32} color={colors.accent} />
                <Text style={styles.pickerBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Caption */}
        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Adicionar legenda..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{caption.length}/200</Text>
        </View>

        {/* Publish */}
        <TouchableOpacity
          style={[styles.publishBtn, (!image || loading) && { opacity: 0.4 }]}
          onPress={handlePublish}
          disabled={!image || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <Ionicons name="flash" size={20} color={colors.textInverse} />
              <Text style={styles.publishText}>Publicar Drop</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Drops desaparecem após 24 horas. Adicione aos destaques para mantê-los no perfil.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  previewContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  preview: { width: '100%', aspectRatio: 9 / 16, borderRadius: 16 },
  removeBtn: { position: 'absolute', top: 12, right: 12 },
  pickerContainer: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 2, borderColor: colors.surfaceBorder, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 40, marginBottom: 16,
  },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  pickerDesc: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
  pickerButtons: { flexDirection: 'row', gap: 20 },
  pickerBtn: {
    alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceLight, borderRadius: 16,
    paddingVertical: 20, paddingHorizontal: 30,
  },
  pickerBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  captionContainer: { marginBottom: 16 },
  captionInput: {
    backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: colors.text, minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
  publishBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 14, marginBottom: 16,
  },
  publishText: { fontSize: 15, fontWeight: '700', color: colors.textInverse },
  infoText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
