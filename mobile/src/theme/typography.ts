import { TextStyle } from 'react-native';

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 40,
} as const;

export const fontWeight: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const typography = {
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  } as TextStyle,
  h1: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  } as TextStyle,
  h2: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  } as TextStyle,
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
  } as TextStyle,
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
  } as TextStyle,
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  } as TextStyle,
  button: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  } as TextStyle,
} as const;
