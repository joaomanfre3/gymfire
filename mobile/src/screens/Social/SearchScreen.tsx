import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { SocialStackParamList } from '../../navigation/types';
import { User, Post } from '../../types';
import api from '../../api/client';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'Search'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

function avatarColor(name: string): string {
  const palette = ['#FF6B35', '#4ECDC4', '#22C55E', '#FACC15', '#EF4444', '#A855F7', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function PostTile({ post, onPress }: { post: Post; onPress: () => void }) {
  const workout = post.workout;
  const initial = (post.user?.displayName || post.user?.username || '?')[0].toUpperCase();
  const bg = avatarColor(post.user?.username || 'u');

  return (
    <TouchableOpacity style={styles.tile} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.tileInner, { backgroundColor: bg + '20' }]}>
        {workout ? (
          <>
            <Ionicons name="barbell-outline" size={24} color={bg} />
            <Text style={styles.tileName} numberOfLines={1}>{workout.name}</Text>
            <Text style={styles.tileStat}>{workout.totalSets} sets</Text>
          </>
        ) : post.content ? (
          <>
            <View style={[styles.tileAvatar, { backgroundColor: bg }]}>
              <Text style={styles.tileAvatarText}>{initial}</Text>
            </View>
            <Text style={styles.tileContent} numberOfLines={3}>{post.content}</Text>
          </>
        ) : (
          <>
            <View style={[styles.tileAvatar, { backgroundColor: bg }]}>
              <Text style={styles.tileAvatarText}>{initial}</Text>
            </View>
            <Text style={styles.tileName} numberOfLines={1}>
              {post.user?.displayName || 'Post'}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);

  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Explore grid state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExplore = useCallback(async () => {
    try {
      const { data } = await api.get('/feed', { params: { skip: 0, limit: 30 } });
      const list: Post[] = Array.isArray(data) ? data : data.data ?? [];
      setPosts(list);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExplore();
  }, [fetchExplore]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExplore();
  }, [fetchExplore]);

  // User search
  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setUserResults([]);
      setSearched(false);
      return;
    }
    setSearchLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get(`/users/search/${encodeURIComponent(q)}`);
      setUserResults(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setUserResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(query.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchMode, searchUsers]);

  const handleCancelSearch = () => {
    setSearchMode(false);
    setQuery('');
    setUserResults([]);
    setSearched(false);
  };

  const renderUser = ({ item }: { item: User }) => {
    const initial = (item.displayName || item.username)[0].toUpperCase();
    const bg = avatarColor(item.username);

    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('UserProfile', { username: item.username })}
      >
        <View style={[styles.userAvatar, { backgroundColor: bg }]}>
          <Text style={styles.userAvatarText}>{initial}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.displayName} numberOfLines={1}>{item.displayName}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
        <View style={styles.userStats}>
          <Text style={styles.points}>{(item.totalPoints ?? 0).toLocaleString()} pts</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={[styles.searchHeader, { paddingTop: topPadding + spacing.sm }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchMode(true)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {searchMode && (
          <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search results or Explore grid */}
      {searchMode ? (
        searchLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : userResults.length > 0 ? (
          <FlatList
            data={userResults}
            keyExtractor={(u) => u.id}
            renderItem={renderUser}
            contentContainerStyle={styles.userList}
          />
        ) : searched && query.length >= 2 ? (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
          </View>
        ) : (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Encontre atletas</Text>
            <Text style={styles.emptySubtitle}>Pesquise por nome ou username</Text>
          </View>
        )
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : posts.length > 0 ? (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          numColumns={NUM_COLUMNS}
          renderItem={({ item }) => (
            <PostTile
              post={item}
              onPress={() => {}}
            />
          )}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons name="compass-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Explore</Text>
          <Text style={styles.emptySubtitle}>Posts dos atletas aparecerão aqui</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    marginLeft: spacing.sm,
    paddingVertical: 2,
  },
  cancelBtn: {
    marginLeft: spacing.md,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.primary,
  },

  // Grid
  gridContent: {
    paddingBottom: spacing.xxl,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  tileInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  tileName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold as '600',
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  tileStat: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  tileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tileAvatarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  tileContent: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },

  // User search results
  userList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold as '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  displayName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    color: colors.text,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 1,
  },
  userStats: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as '600',
    color: colors.accent,
  },

  // Empty / center states
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold as '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
