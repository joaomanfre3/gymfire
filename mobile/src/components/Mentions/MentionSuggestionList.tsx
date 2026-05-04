import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';

interface UserResult {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

interface Props {
  results: UserResult[];
  onSelect: (user: UserResult) => void;
}

export function MentionSuggestionList({ results, onSelect }: Props) {
  if (results.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(u) => u.id}
        keyboardShouldPersistTaps="always"
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>
                  {(item.name || item.username)[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#333',
    marginBottom: 4,
    zIndex: 100,
  },
  list: { maxHeight: 200 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  name: { fontSize: 14, fontWeight: '600', color: '#fff' },
  username: { fontSize: 13, color: '#a8a8a8' },
});
