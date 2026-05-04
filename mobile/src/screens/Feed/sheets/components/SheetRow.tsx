import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

export default function SheetRow({ icon, label, onPress, destructive, rightElement, disabled }: Props) {
  const color = destructive ? '#EF4444' : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: 'rgba(255,255,255,0.04)' },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Feather name={icon} size={22} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
      <View style={styles.right}>{rightElement}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 20,
    gap: 16,
  },
  label: { flex: 1, fontSize: 16, fontWeight: '500' },
  right: { marginLeft: 'auto' },
});
