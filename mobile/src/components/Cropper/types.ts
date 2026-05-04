import type { StyleProp, ViewStyle, ImageSourcePropType } from 'react-native';

export interface CropperProps {
  source: { uri: string };
  /** If provided, skip Image.getSize and use these dimensions directly. */
  imageSize?: { width: number; height: number };
  aspectRatio?: { width: number; height: number };
  minScale?: number;
  maxScale?: number;
  width?: number;
  onCropChange?: (state: CropState) => void;
  style?: StyleProp<ViewStyle>;
}

export interface CropState {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface CropResult {
  uri: string;
  width: number;
  height: number;
}

export interface CropperRef {
  export: (options?: { outputWidth?: number; quality?: number }) => Promise<CropResult>;
  reset: () => void;
}
