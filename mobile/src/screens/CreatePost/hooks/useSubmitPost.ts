import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCreatePostStore } from '../store/createPostStore';
import api from '../../../api/client';

export function useSubmitPost() {
  const store = useCreatePostStore();
  const navigation = useNavigation<any>();

  return useCallback(async () => {
    if (store.images.length === 0) return;
    store.setSubmitting(true);
    store.setError(null);
    try {
      // 1. Upload each image to Cloudinary via existing endpoint
      const mediaUrls: string[] = [];
      const token = await AsyncStorage.getItem('access_token');

      for (const img of store.images) {
        const formData = new FormData();
        formData.append('file', {
          uri: img.cropped.uri,
          type: 'image/jpeg',
          name: 'post-image.jpg',
        } as any);

        const uploadRes = await fetch('https://gymfire.vercel.app/api/drops/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Upload da imagem falhou');
        const { mediaUrl } = await uploadRes.json();
        mediaUrls.push(mediaUrl);
      }

      // 2. Create post with uploaded URLs
      const visibility = store.visibility === 'friends' ? 'FOLLOWERS' : store.visibility.toUpperCase();

      await api.post('/social/posts', {
        caption: store.caption || '',
        type: 'MOTIVATION',
        visibility,
        mediaUrls,
      });

      store.reset();
      navigation.reset({ index: 0, routes: [{ name: 'Feed' }] });
    } catch (e: any) {
      const msg = e.message ?? 'Erro desconhecido';
      store.setError(msg);
      Alert.alert('Não foi possível publicar', msg);
    } finally {
      store.setSubmitting(false);
    }
  }, [store, navigation]);
}
