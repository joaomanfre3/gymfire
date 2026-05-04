/**
 * Pure math functions for the cropper.
 * All marked 'worklet' so they can be called from Reanimated worklets.
 */

/** Rubber-band resistance for translation. */
export function resist(value: number, limit: number, bounce = 0.3): number {
  'worklet';
  if (value > limit) return limit + (value - limit) * bounce;
  if (value < -limit) return -limit + (value + limit) * bounce;
  return value;
}

/** Rubber-band resistance for scale. */
export function resistScale(s: number, min: number, max: number, bounce = 0.3): number {
  'worklet';
  if (s < min) return min - (min - s) * bounce;
  if (s > max) return max + (s - max) * bounce;
  return s;
}

/** Max translation at a given scale so the image always covers the frame. */
export function limitX(Iw: number, s0: number, s: number, Fw: number): number {
  'worklet';
  return Math.max(0, (Iw * s0 * s - Fw) / 2);
}

export function limitY(Ih: number, s0: number, s: number, Fh: number): number {
  'worklet';
  return Math.max(0, (Ih * s0 * s - Fh) / 2);
}

/** Compute the crop rect in natural image coordinates for expo-image-manipulator. */
export function computeExportRect(params: {
  Fw: number; Fh: number;
  Iw: number; Ih: number;
  scale: number;
  tx: number; ty: number;
}): { originX: number; originY: number; width: number; height: number } {
  const { Fw, Fh, Iw, Ih, scale, tx, ty } = params;
  const s0 = Math.max(Fw / Iw, Fh / Ih);
  const total = s0 * scale;

  const originX = Iw / 2 - Fw / (2 * total) - tx / total;
  const originY = Ih / 2 - Fh / (2 * total) - ty / total;

  const width = Fw / total;
  const height = Fh / total;

  return {
    originX: Math.max(0, Math.min(Iw - width, originX)),
    originY: Math.max(0, Math.min(Ih - height, originY)),
    width: Math.min(width, Iw),
    height: Math.min(height, Ih),
  };
}
