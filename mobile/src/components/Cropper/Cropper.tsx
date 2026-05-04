import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Image, StyleSheet, LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useCropGestures } from './useCropGestures';
import { exportCrop } from './exportCrop';
import type { CropperProps, CropperRef } from './types';

const Cropper = forwardRef<CropperRef, CropperProps>(function Cropper(
  {
    source,
    imageSize: imageSizeProp,
    aspectRatio = { width: 4, height: 5 },
    minScale = 1,
    maxScale = 5,
    width: propWidth,
    style,
  },
  ref,
) {
  const [frameSize, setFrameSize] = useState<{ w: number; h: number } | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(
    imageSizeProp ? { w: imageSizeProp.width, h: imageSizeProp.height } : null,
  );

  // Measure frame
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width: lw } = e.nativeEvent.layout;
      const w = propWidth ?? lw;
      const h = w * (aspectRatio.height / aspectRatio.width);
      setFrameSize({ w, h });
    },
    [propWidth, aspectRatio],
  );

  // Load image natural size (skip if imageSize prop provided)
  useEffect(() => {
    if (imageSizeProp) {
      setImgSize({ w: imageSizeProp.width, h: imageSizeProp.height });
      return;
    }
    setImgSize(null);
    Image.getSize(
      source.uri,
      (w, h) => {
        console.log('[Cropper] Image.getSize:', w, h, source.uri.slice(-30));
        setImgSize({ w, h });
      },
      (err) => {
        console.error('[Cropper] Image.getSize failed:', err);
      },
    );
  }, [source.uri, imageSizeProp]);

  const ready = frameSize && imgSize;

  const Fw = frameSize?.w ?? 0;
  const Fh = frameSize?.h ?? 0;
  const Iw = imgSize?.w ?? 0;
  const Ih = imgSize?.h ?? 0;

  // Cover dimensions: image scaled to fill frame completely
  const s0 = Iw && Ih ? Math.max(Fw / Iw, Fh / Ih) : 1;
  const coverW = Math.ceil(Iw * s0);
  const coverH = Math.ceil(Ih * s0);

  const { gesture, animatedStyle, scale, tx, ty, reset } = useCropGestures({
    Fw: ready ? Fw : 100,
    Fh: ready ? Fh : 125,
    Iw: ready ? Iw : 100,
    Ih: ready ? Ih : 125,
    minScale,
    maxScale,
  });

  useImperativeHandle(ref, () => ({
    export: async (options) => {
      if (!imgSize || !frameSize) {
        throw new Error('Image not loaded yet');
      }
      const params = {
        uri: source.uri,
        Iw: imgSize.w,
        Ih: imgSize.h,
        Fw: frameSize.w,
        Fh: frameSize.h,
        scale: scale.value,
        tx: tx.value,
        ty: ty.value,
        outputWidth: options?.outputWidth,
        quality: options?.quality,
      };
      console.log('[Cropper.export] params:', JSON.stringify(params, null, 2));
      return exportCrop(params);
    },
    reset,
  }));

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.frame,
        { aspectRatio: aspectRatio.width / aspectRatio.height },
        propWidth ? { width: propWidth } : undefined,
        style,
      ]}
    >
      {ready && (
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              {
                width: coverW,
                height: coverH,
                position: 'absolute',
                left: (Fw - coverW) / 2,
                top: (Fh - coverH) / 2,
              },
              animatedStyle,
            ]}
          >
            <Image
              source={source}
              style={{ width: coverW, height: coverH }}
              resizeMode="cover"
            />
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});

export default Cropper;
