import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import FireLikeAnimation, { FireLikeAnimationRef } from './FireLikeAnimation';
import type { PostImageAsset } from '../../types';

const SCREEN_W = Dimensions.get('window').width;

interface Props {
  images: PostImageAsset[];
  postId: string;
  viewerLiked: boolean;
  onDoubleTap: () => void;
}

export default function PostImageCarousel({ images, postId, viewerLiked, onDoubleTap }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const fireRef = useRef<FireLikeAnimationRef>(null);

  const onMomentum = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      setActiveIndex(idx);
    },
    [],
  );

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      fireRef.current?.play();
      onDoubleTap();
    });

  const renderImage = useCallback(
    ({ item }: { item: PostImageAsset }) => (
      <Image
        source={{ uri: item.url }}
        style={{ width: SCREEN_W, aspectRatio: 4 / 5 }}
        resizeMode="cover"
      />
    ),
    [],
  );

  return (
    <GestureDetector gesture={doubleTap}>
      <View style={styles.container}>
        <FlatList
          data={images}
          keyExtractor={(i) => i.id}
          renderItem={renderImage}
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
              <View key={img.id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
            ))}
          </View>
        )}
        <FireLikeAnimation ref={fireRef} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
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
