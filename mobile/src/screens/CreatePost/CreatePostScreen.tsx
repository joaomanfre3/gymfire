'use strict';

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useDropsStore } from '../../stores/dropsStore';
import { colors } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { useCreatePostStore } from './store/createPostStore';
import { useSubmitPost } from './hooks/useSubmitPost';

import Header from './components/Header';
import ImageCarousel from './components/ImageCarousel';
import ImageThumbnails from './components/ImageThumbnails';
import CaptionInput from './components/CaptionInput';
import SectionRow from './components/SectionRow';
import ShareButton from './components/ShareButton';
import VisibilitySheet from './modals/VisibilitySheet';
import TagPeopleSheet from './modals/TagPeopleSheet';

type Props = NativeStackScreenProps<HomeStackParamList, 'NewPost'>;

function generateId() {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const VISIBILITY_LABELS = {
  public: 'Público',
  friends: 'Amigos',
  private: 'Privado',
} as const;

const VISIBILITY_ICONS = {
  public: 'globe-outline',
  friends: 'people-outline',
  private: 'lock-closed-outline',
} as const;

export default function NewCreatePostScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const setDropsOpen = useDropsStore((s) => s.setDropsOpen);
  const store = useCreatePostStore();
  const submitPost = useSubmitPost();

  const [activeIndex, setActiveIndex] = useState(0);
  const [showVisibility, setShowVisibility] = useState(false);
  const [showTagPeople, setShowTagPeople] = useState(false);

  // Hide bottom tab bar
  useEffect(() => {
    setDropsOpen(true);
    return () => setDropsOpen(false);
  }, [setDropsOpen]);

  // Add initial image from params if store is empty
  useEffect(() => {
    const uri = route.params.mediaUri;
    if (uri && store.images.length === 0) {
      store.addImage({
        id: generateId(),
        originalUri: uri,
        cropped: { uri, width: 1080, height: 1350 },
      });
    }
  }, []);

  const handleBack = useCallback(() => {
    const hasContent = store.images.length > 0 || store.caption.length > 0 || store.taggedUsers.length > 0;
    if (hasContent) {
      Alert.alert('Descartar post?', 'Você perderá o conteúdo atual.', [
        { text: 'Continuar editando', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            store.reset();
            navigation.goBack();
          },
        },
      ]);
    } else {
      navigation.goBack();
    }
  }, [store, navigation]);

  const handleAddImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      store.addImage({
        id: generateId(),
        originalUri: asset.uri,
        cropped: { uri: asset.uri, width: asset.width || 1080, height: asset.height || 1350 },
      });
      setActiveIndex(store.images.length); // go to newly added
    }
  }, [store]);

  const handleRemoveImage = useCallback(
    (id: string) => {
      store.removeImage(id);
      if (activeIndex >= store.images.length - 1) {
        setActiveIndex(Math.max(0, store.images.length - 2));
      }
    },
    [store, activeIndex],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header onBack={handleBack} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Carousel */}
          {store.images.length > 0 && (
            <ImageCarousel
              images={store.images}
              activeIndex={activeIndex}
              onIndexChange={setActiveIndex}
            />
          )}

          {/* Thumbnails */}
          {store.images.length > 0 && (
            <ImageThumbnails
              images={store.images}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              onRemove={handleRemoveImage}
              onAdd={handleAddImage}
            />
          )}

          {/* Caption */}
          <CaptionInput value={store.caption} onChange={store.setCaption} />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Tag people */}
          <SectionRow
            icon="people-outline"
            label="Marcar pessoas"
            value={store.taggedUsers.length > 0 ? `${store.taggedUsers.length} pessoas` : undefined}
            onPress={() => setShowTagPeople(true)}
          />

          <View style={styles.divider} />

          {/* Visibility */}
          <SectionRow
            icon={VISIBILITY_ICONS[store.visibility] as any}
            label={VISIBILITY_LABELS[store.visibility]}
            onPress={() => setShowVisibility(true)}
          />

          <View style={styles.divider} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Share button */}
      <View style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
        <ShareButton
          onPress={submitPost}
          disabled={store.images.length === 0}
          loading={store.isSubmitting}
        />
      </View>

      {/* Bottom sheets */}
      {showVisibility && (
        <VisibilitySheet
          current={store.visibility}
          onSelect={store.setVisibility}
          onClose={() => setShowVisibility(false)}
        />
      )}

      {showTagPeople && (
        <TagPeopleSheet
          taggedUsers={store.taggedUsers}
          onToggle={store.toggleTaggedUser}
          onRemove={store.removeTaggedUser}
          onClose={() => setShowTagPeople(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  divider: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16 },
});
