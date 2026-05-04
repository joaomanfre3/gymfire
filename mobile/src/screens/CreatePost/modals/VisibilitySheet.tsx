import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import type { PostVisibility } from '../types';

const OPTIONS: { value: PostVisibility; icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { value: 'public', icon: 'globe-outline', title: 'Público', desc: 'Qualquer pessoa pode ver este post' },
  { value: 'friends', icon: 'people-outline', title: 'Amigos', desc: 'Apenas pessoas que você segue podem ver' },
  { value: 'private', icon: 'lock-closed-outline', title: 'Privado', desc: 'Apenas você pode ver este post' },
];

interface Props {
  current: PostVisibility;
  onSelect: (v: PostVisibility) => void;
  onClose: () => void;
}

export default function VisibilitySheet({ current, onSelect, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [320], []);

  const handleSelect = useCallback(
    (v: PostVisibility) => {
      onSelect(v);
      setTimeout(() => {
        sheetRef.current?.close();
        onClose();
      }, 120);
    },
    [onSelect, onClose],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Visibilidade</Text>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={styles.row}
            onPress={() => handleSelect(opt.value)}
            activeOpacity={0.6}
          >
            <Ionicons name={opt.icon} size={24} color="#fff" style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>{opt.title}</Text>
              <Text style={styles.optDesc}>{opt.desc}</Text>
            </View>
            <View style={[styles.radio, current === opt.value && styles.radioSelected]}>
              {current === opt.value && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  handle: { backgroundColor: '#555' },
  content: { padding: 16 },
  title: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 16, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  optTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  optDesc: { fontSize: 13, color: '#888', marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#555',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: '#FF6B35' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF6B35' },
});
