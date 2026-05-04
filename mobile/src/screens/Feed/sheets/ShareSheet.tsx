import React, { useRef, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSheetsStore } from '../store/sheetsStore';

interface Props {
  postId: string;
}

export default function ShareSheet({ postId }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const close = useSheetsStore((s) => s.close);

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={close}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={0.5}
        />
      )}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Enviar para...</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
          <BottomSheetTextInput
            style={styles.searchInput}
            placeholder="Buscar pessoas..."
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Busque por pessoas para compartilhar</Text>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  handle: { backgroundColor: '#555' },
  content: { padding: 16 },
  title: { fontSize: 17, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 12 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2a2a2a', borderRadius: 10,
    paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: '#888' },
});
