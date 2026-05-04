import React from "react";
import { type ImageSourcePropType } from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const SPRING_CONFIG = { damping: 18, stiffness: 200, mass: 0.8 };
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

/**
 * Clamp a value between min and max.
 */
function clampSV(val: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(val, min), max);
}

/**
 * Given the current scale and container size, return the maximum
 * translation allowed so the image always covers the container.
 *
 * At scale=1 the image fills the container exactly, so maxTranslate=0.
 * At scale=2 an image of 300px in a 300px container can shift 150px
 * in either direction: (300*2 - 300) / 2 = 150.
 */
function maxTranslate(
  containerSize: number,
  scale: number
): number {
  "worklet";
  return Math.max(0, (containerSize * scale - containerSize) / 2);
}

/**
 * Clamp translation so the scaled image always covers the container.
 */
function clampTranslation(
  tx: number,
  ty: number,
  scale: number,
  containerW: number,
  containerH: number
): { x: number; y: number } {
  "worklet";
  const maxX = maxTranslate(containerW, scale);
  const maxY = maxTranslate(containerH, scale);
  return {
    x: clampSV(tx, -maxX, maxX),
    y: clampSV(ty, -maxY, maxY),
  };
}

interface ZoomableImageProps {
  source: ImageSourcePropType;
  /** Width of the container (default: use onLayout) */
  containerWidth: number;
  /** Height of the container (default: use onLayout) */
  containerHeight: number;
}

export default function ZoomableImage({
  source,
  containerWidth,
  containerHeight,
}: ZoomableImageProps) {
  // ---- shared values ----
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Focal point origin captured at pinch start (container coords)
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  // Whether we have captured the origin for the current pinch
  const isPinchActive = useSharedValue(false);

  // ---- gestures ----

  /**
   * PINCH - focal-point zoom.
   *
   * The math: to zoom toward focal point (fx, fy) relative to the
   * container center, we adjust translation so that the point under
   * the fingers stays fixed.
   *
   * newScale = savedScale * event.scale
   * newTx = savedTx + (1 - newScale/savedScale) * (fx - containerW/2 - savedTx)
   *        = savedTx + (fx - containerW/2 - savedTx) - (newScale/savedScale) * (fx - containerW/2 - savedTx)
   *
   * Simplified:
   *   adjustedFx = fx - containerW/2 - savedTx
   *   newTx = savedTx + adjustedFx * (1 - event.scale)
   *
   * (same for Y)
   */
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      // Save current state
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      isPinchActive.value = false;
    })
    .onUpdate((e) => {
      // On Android, focalX/focalY may be 0 in onStart; capture on first onUpdate
      if (!isPinchActive.value) {
        originX.value = e.focalX;
        originY.value = e.focalY;
        isPinchActive.value = true;
      }

      const newScale = clampSV(
        savedScale.value * e.scale,
        MIN_SCALE,
        MAX_SCALE
      );

      // Focal point relative to container center, accounting for current pan
      const adjustedFx =
        originX.value - containerWidth / 2 - savedTranslateX.value;
      const adjustedFy =
        originY.value - containerHeight / 2 - savedTranslateY.value;

      const scaleRatio = newScale / savedScale.value;
      const rawTx = savedTranslateX.value + adjustedFx * (1 - scaleRatio);
      const rawTy = savedTranslateY.value + adjustedFy * (1 - scaleRatio);

      const clamped = clampTranslation(
        rawTx,
        rawTy,
        newScale,
        containerWidth,
        containerHeight
      );

      scale.value = newScale;
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      // If pinched below minimum, spring back
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE, SPRING_CONFIG);
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  /**
   * PAN - single finger drag (only meaningful when zoomed in).
   */
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      const clamped = clampTranslation(
        savedTranslateX.value + e.translationX,
        savedTranslateY.value + e.translationY,
        scale.value,
        containerWidth,
        containerHeight
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  /**
   * DOUBLE TAP - toggle between 1x and DOUBLE_TAP_SCALE zoom,
   * zooming toward the tap location.
   */
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onEnd((e) => {
      if (scale.value > MIN_SCALE + 0.1) {
        // Already zoomed -> reset
        scale.value = withSpring(MIN_SCALE, SPRING_CONFIG);
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom toward tap point
        const targetScale = DOUBLE_TAP_SCALE;
        const fx = e.x - containerWidth / 2;
        const fy = e.y - containerHeight / 2;

        // Same focal-point math as pinch
        const targetTx = fx * (1 - targetScale);
        const targetTy = fy * (1 - targetScale);

        const clamped = clampTranslation(
          targetTx,
          targetTy,
          targetScale,
          containerWidth,
          containerHeight
        );

        scale.value = withSpring(targetScale, SPRING_CONFIG);
        translateX.value = withSpring(clamped.x, SPRING_CONFIG);
        translateY.value = withSpring(clamped.y, SPRING_CONFIG);
        savedScale.value = targetScale;
        savedTranslateX.value = clamped.x;
        savedTranslateY.value = clamped.y;
      }
    });

  // Compose: pinch + pan run simultaneously, double-tap is separate
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  const gesture = Gesture.Exclusive(doubleTapGesture, composedGesture);

  // ---- animated style ----
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            width: containerWidth,
            height: containerHeight,
            overflow: "hidden",
          },
        ]}
      >
        <Animated.Image
          source={source}
          style={[
            {
              width: containerWidth,
              height: containerHeight,
            },
            animatedStyle,
          ]}
          resizeMode="cover"
        />
      </Animated.View>
    </GestureDetector>
  );
}
