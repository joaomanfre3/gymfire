import React, { useRef, useCallback } from 'react';
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import type { PostImage } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const CAROUSEL_H = (SCREEN_W * 5) / 4;

interface Props {
  images: PostImage[];
  activeIndex: number;
  onIndexChange: (i: number) => void;
}

export default function ImageCarousel({ images, activeIndex, onIndexChange }: Props) {
  const listRef = useRef<FlatList>(null);

  const onMomentum = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      if (idx !== activeIndex) onIndexChange(idx);
    },
    [activeIndex, onIndexChange],
  );

  const renderItem = useCallback(
    ({ item }: { item: PostImage }) => (
      <Image
        source={{ uri: item.cropped.uri }}
        style={{ width: SCREEN_W, height: CAROUSEL_H }}
        resizeMode="cover"
      />
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentum}
        getItemLayout={(_, idx) => ({
          length: SCREEN_W,
          offset: SCREEN_W * idx,
          index: idx,
        })}
      />
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((img, i) => (
            <View
              key={img.id}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: SCREEN_W, height: CAROUSEL_H, backgroundColor: '#000' },
  dots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: '#fff' },
});
