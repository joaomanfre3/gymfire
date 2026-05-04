import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useUserSearch } from '../hooks/useUserSearch';
import type { TaggedUser } from '../types';

interface Props {
  taggedUsers: TaggedUser[];
  onToggle: (user: TaggedUser) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export default function TagPeopleSheet({ taggedUsers, onToggle, onRemove, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const { query, setQuery, results, isLoading } = useUserSearch();

  const isTagged = (id: string) => taggedUsers.some((u) => u.id === id);

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
      <View style={styles.header}>
        <Text style={styles.title}>Marcar pessoas</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar pessoas..."
            placeholderTextColor="#888"
            autoCapitalize="none"
          />
        </View>

        {taggedUsers.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {taggedUsers.map((u) => (
              <View key={u.id} style={styles.chip}>
                <Text style={styles.chipText}>{u.name.split(' ')[0]}</Text>
                <TouchableOpacity onPress={() => onRemove(u.id)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {isLoading && <ActivityIndicator color="#FF6B35" style={{ marginTop: 16 }} />}

      <BottomSheetFlatList
        data={results}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => onToggle(item)}
            activeOpacity={0.6}
          >
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {(item.name || item.username)[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
            {isTagged(item.id) && (
              <Ionicons name="checkmark-circle" size={22} color="#FF6B35" />
            )}
          </TouchableOpacity>
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  handle: { backgroundColor: '#555' },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 17, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 12 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2a2a2a', borderRadius: 10,
    paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  chips: { marginTop: 10, marginBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#333', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 6, marginRight: 6,
  },
  chipText: { fontSize: 13, color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  name: { fontSize: 14, fontWeight: '600', color: '#fff' },
  username: { fontSize: 13, color: '#888' },
});
