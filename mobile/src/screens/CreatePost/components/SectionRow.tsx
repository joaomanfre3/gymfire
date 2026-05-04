import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
}

export default function SectionRow({ icon, label, value, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.row} activeOpacity={0.6}>
      <Ionicons name={icon} size={22} color="#fff" style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value ? <Text style={styles.value}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color="#555" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  icon: { marginRight: 14 },
  label: { fontSize: 15, color: '#fff' },
  value: { fontSize: 14, color: '#aaa', marginRight: 8 },
});
