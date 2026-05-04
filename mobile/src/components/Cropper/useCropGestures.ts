import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { resist, resistScale, limitX, limitY } from './cropMath';

const SPRING = { damping: 18, stiffness: 180, mass: 0.6 };

interface Params {
  Fw: number;
  Fh: number;
  Iw: number;
  Ih: number;
  minScale: number;
  maxScale: number;
}

export function useCropGestures({ Fw, Fh, Iw, Ih, minScale, maxScale }: Params) {
  const s0 = Math.max(Fw / Iw, Fh / Ih);

  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const savedScale = useSharedValue(1);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const anchorX = useSharedValue(0);
  const anchorY = useSharedValue(0);
  const pinchStarted = useSharedValue(false);

  const lx = (s: number) => {
    'worklet';
    return limitX(Iw, s0, s, Fw);
  };
  const ly = (s: number) => {
    'worklet';
    return limitY(Ih, s0, s, Fh);
  };

  const snapBack = () => {
    'worklet';
    const ts = Math.max(minScale, Math.min(maxScale, scale.value));
    const tlx = lx(ts);
    const tly = ly(ts);
    const ttx = Math.max(-tlx, Math.min(tlx, tx.value));
    const tty = Math.max(-tly, Math.min(tly, ty.value));

    scale.value = withSpring(ts, SPRING);
    tx.value = withSpring(ttx, SPRING);
    ty.value = withSpring(tty, SPRING);
  };

  // ── Pan ────────────────────────────────────────────────────
  const pan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    })
    .onUpdate((e) => {
      'worklet';
      const limXVal = lx(scale.value);
      const limYVal = ly(scale.value);
      tx.value = resist(savedTx.value + e.translationX, limXVal);
      ty.value = resist(savedTy.value + e.translationY, limYVal);
    })
    .onEnd(() => {
      'worklet';
      snapBack();
    });

  // ── Pinch (focal-point anchored) ──────────────────────────
  const pinch = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      savedScale.value = scale.value;
      savedTx.value = tx.value;
      savedTy.value = ty.value;
      pinchStarted.value = false;
    })
    .onUpdate((e) => {
      'worklet';
      // Capture focal on first update (Android focalX/Y=0 in onStart)
      if (!pinchStarted.value) {
        const fx = e.focalX - Fw / 2;
        const fy = e.focalY - Fh / 2;
        anchorX.value = (fx - savedTx.value) / savedScale.value;
        anchorY.value = (fy - savedTy.value) / savedScale.value;
        pinchStarted.value = true;
      }

      const newScale = resistScale(savedScale.value * e.scale, minScale, maxScale);
      const fx = e.focalX - Fw / 2;
      const fy = e.focalY - Fh / 2;
      const newTx = fx - anchorX.value * newScale;
      const newTy = fy - anchorY.value * newScale;

      scale.value = newScale;
      tx.value = resist(newTx, lx(newScale));
      ty.value = resist(newTy, ly(newScale));
    })
    .onEnd(() => {
      'worklet';
      snapBack();
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const reset = useCallback(() => {
    scale.value = withSpring(1, SPRING);
    tx.value = withSpring(0, SPRING);
    ty.value = withSpring(0, SPRING);
  }, [scale, tx, ty]);

  return { gesture, animatedStyle, scale, tx, ty, reset };
}
