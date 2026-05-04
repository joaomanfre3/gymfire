import React, { forwardRef, useImperativeHandle, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface FireLikeAnimationRef {
  play: () => void;
}

const FireLikeAnimation = forwardRef<FireLikeAnimationRef>(function FireLikeAnimation(_, ref) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const play = useCallback(() => {
    opacity.value = 1;
    scale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 15 }),
      withDelay(400, withTiming(1.1, { duration: 100 })),
    );
    opacity.value = withDelay(600, withTiming(0, { duration: 200 }));
    // Reset after animation
    setTimeout(() => {
      scale.value = 0;
    }, 900);
  }, [scale, opacity]);

  useImperativeHandle(ref, () => ({ play }));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animStyle]} pointerEvents="none">
      <MaterialCommunityIcons name="fire" size={80} color="#FF6B35" />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FireLikeAnimation;
