import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PostImage } from '../types';

interface Props {
  images: PostImage[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export default function ImageThumbnails({
  images,
  activeIndex,
  onSelect,
  onRemove,
  onAdd,
}: Props) {
  const handleLongPress = (img: PostImage) => {
    Alert.alert('', '', [
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          if (images.length <= 1) {
            Alert.alert('', 'Um post precisa ter pelo menos uma imagem.');
            return;
          }
          onRemove(img.id);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {images.map((img, i) => (
        <TouchableOpacity
          key={img.id}
          onPress={() => onSelect(i)}
          onLongPress={() => handleLongPress(img)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: img.cropped.uri }}
            style={[styles.thumb, i === activeIndex && styles.thumbActive]}
          />
        </TouchableOpacity>
      ))}
      {images.length < 10 && (
        <TouchableOpacity onPress={onAdd} style={styles.addBtn} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color="#888" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  thumb: {
    width: 56,
    height: 70,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: '#fff',
  },
  addBtn: {
    width: 56,
    height: 70,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#555',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
