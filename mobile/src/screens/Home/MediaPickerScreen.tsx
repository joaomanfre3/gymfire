'use strict';

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'MediaPicker'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const THUMB_GAP = 2;
const THUMB_SIZE = (SCREEN_WIDTH - THUMB_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const CAMERA_ID = '__camera__';

type Album = { id: string; title: string; assetCount: number };
type GalleryMode = 'loading' | 'native' | 'fallback';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MediaPickerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<GalleryMode>('loading');
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaLibrary.Asset | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  // ── Try native gallery, fallback to system picker ────────────
  const initGallery = useCallback(async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (perm.status !== 'granted' && (perm as any).accessPrivileges === 'none') {
        throw new Error('Permission denied');
      }

      const result = await MediaLibrary.getAssetsAsync({
        first: 60,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      setAssets(result.assets);
      setEndCursor(result.endCursor);
      setHasMore(result.hasNextPage);
      setMode('native');
      setLoading(false);

      // Load albums
      try {
        const albumList = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
        const mapped: Album[] = albumList
          .filter((a) => a.assetCount > 0)
          .map((a) => ({ id: a.id, title: a.title, assetCount: a.assetCount }))
          .sort((a, b) => b.assetCount - a.assetCount);
        setAlbums(mapped);
      } catch {}
    } catch {
      setMode('fallback');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initGallery();
  }, [initGallery]);

  // ── Pagination (native mode only) ───────────────────────────
  const loadAssets = useCallback(
    async (reset: boolean) => {
      try {
        const options: MediaLibrary.AssetsOptions = {
          first: 60,
          mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
          sortBy: [MediaLibrary.SortBy.creationTime],
          ...(currentAlbum ? { album: currentAlbum.id } : {}),
          ...(!reset && endCursor ? { after: endCursor } : {}),
        };
        const result = await MediaLibrary.getAssetsAsync(options);
        if (reset) {
          setAssets(result.assets);
        } else {
          setAssets((prev) => [...prev, ...result.assets]);
        }
        setEndCursor(result.endCursor);
        setHasMore(result.hasNextPage);
      } catch {
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [currentAlbum, endCursor],
  );

  useEffect(() => {
    if (mode === 'native' && currentAlbum !== null) {
      setLoading(true);
      setEndCursor(undefined);
      loadAssets(true);
    }
  }, [currentAlbum]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && mode === 'native') {
      loadAssets(false);
    }
  }, [hasMore, loading, loadAssets, mode]);

  const selectAlbum = (album: Album | null) => {
    setCurrentAlbum(album);
    setShowAlbumPicker(false);
    setAssets([]);
    setSelectedAsset(null);
    setEndCursor(undefined);
  };

  const handleNext = () => {
    if (selectedAsset) {
      navigation.navigate('SpeedCreator', { mediaUri: selectedAsset.uri });
    }
  };

  // ── Fallback: open system picker ─────────────────────────────
  const openSystemPicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [9, 16],
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      navigation.navigate('SpeedCreator', { mediaUri: result.assets[0].uri });
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [9, 16],
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      navigation.navigate('SpeedCreator', { mediaUri: result.assets[0].uri });
    }
  };

  // ── Loading state ────────────────────────────────────────────
  if (mode === 'loading') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Adicionar ao drop</Text>
          <View style={styles.headerBtn} />
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </View>
    );
  }

  // ── Fallback mode (Expo Go) ──────────────────────────────────
  if (mode === 'fallback') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Adicionar ao drop</Text>
          <View style={styles.headerBtn} />
        </View>

        {/* Quick action chips */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipEmoji}>🎭</Text>
            <Text style={styles.chipText}>GIF</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="grid-outline" size={16} color={colors.text} />
            <Text style={styles.chipText}>Modelos</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="musical-notes-outline" size={16} color={colors.text} />
            <Text style={styles.chipText}>Música</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="copy-outline" size={16} color={colors.text} />
            <Text style={styles.chipText}>Colagem</Text>
          </View>
        </View>

        {/* Fallback picker options */}
        <View style={styles.fallbackContent}>
          <TouchableOpacity style={styles.fallbackCard} onPress={openCamera} activeOpacity={0.7}>
            <View style={styles.fallbackIconWrap}>
              <Ionicons name="camera" size={36} color="#FFF" />
            </View>
            <Text style={styles.fallbackCardTitle}>Câmera</Text>
            <Text style={styles.fallbackCardSub}>Tirar foto ou gravar vídeo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fallbackCard} onPress={openSystemPicker} activeOpacity={0.7}>
            <View style={[styles.fallbackIconWrap, { backgroundColor: 'rgba(139,92,246,0.25)' }]}>
              <Ionicons name="images" size={36} color="#8B5CF6" />
            </View>
            <Text style={styles.fallbackCardTitle}>Galeria</Text>
            <Text style={styles.fallbackCardSub}>Escolher da galeria</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fallbackFooter}>Drops expiram em 24h</Text>
      </View>
    );
  }

  // ── Native mode (dev build / production) ─────────────────────
  const gridData = [{ id: CAMERA_ID } as MediaLibrary.Asset, ...assets];

  const renderThumb = ({ item }: { item: MediaLibrary.Asset }) => {
    if (item.id === CAMERA_ID) {
      return (
        <TouchableOpacity
          style={[styles.thumbWrap, styles.cameraCard]}
          onPress={openCamera}
          activeOpacity={0.7}
        >
          <Ionicons name="camera" size={32} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      );
    }

    const isSelected = selectedAsset?.id === item.id;
    const isVideo = item.mediaType === 'video';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setSelectedAsset(item)}
        style={styles.thumbWrap}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbImg} />
        {isVideo && (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>{formatDuration(item.duration)}</Text>
          </View>
        )}
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.selectedCircle}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adicionar ao drop</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Quick action chips */}
      <View style={styles.chipsRow}>
        <View style={styles.chip}>
          <Text style={styles.chipEmoji}>🎭</Text>
          <Text style={styles.chipText}>GIF</Text>
        </View>
        <View style={styles.chip}>
          <Ionicons name="grid-outline" size={16} color={colors.text} />
          <Text style={styles.chipText}>Modelos</Text>
        </View>
        <View style={styles.chip}>
          <Ionicons name="musical-notes-outline" size={16} color={colors.text} />
          <Text style={styles.chipText}>Música</Text>
        </View>
        <View style={styles.chip}>
          <Ionicons name="copy-outline" size={16} color={colors.text} />
          <Text style={styles.chipText}>Colagem</Text>
        </View>
      </View>

      {/* Album selector */}
      <View style={styles.albumBar}>
        <TouchableOpacity
          style={styles.albumSelector}
          onPress={() => setShowAlbumPicker(!showAlbumPicker)}
        >
          <Text style={styles.albumName}>
            {currentAlbum ? currentAlbum.title : 'Recentes'}
          </Text>
          <Ionicons
            name={showAlbumPicker ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Album picker dropdown */}
      {showAlbumPicker && (
        <View style={styles.albumDropdown}>
          <TouchableOpacity
            style={[styles.albumItem, !currentAlbum && styles.albumItemActive]}
            onPress={() => selectAlbum(null)}
          >
            <Text style={[styles.albumItemText, !currentAlbum && { color: colors.primary }]}>
              Recentes
            </Text>
          </TouchableOpacity>
          {albums.map((album) => (
            <TouchableOpacity
              key={album.id}
              style={[
                styles.albumItem,
                currentAlbum?.id === album.id && styles.albumItemActive,
              ]}
              onPress={() => selectAlbum(album)}
            >
              <Text
                style={[
                  styles.albumItemText,
                  currentAlbum?.id === album.id && { color: colors.primary },
                ]}
              >
                {album.title}
              </Text>
              <Text style={styles.albumCount}>{album.assetCount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Gallery grid */}
      {loading && assets.length === 0 ? (
        <View style={styles.loadingGallery}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={gridData}
          keyExtractor={(item) => item.id}
          renderItem={renderThumb}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ gap: THUMB_GAP }}
          contentContainerStyle={{ gap: THUMB_GAP }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
        />
      )}

      {/* Floating next button */}
      {selectedAsset && (
        <View style={[styles.floatingBtnWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.floatingBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.floatingBtnText}>Avançar</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 48,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },

  // Album bar
  albumBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  albumSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  albumName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },

  // Album dropdown
  albumDropdown: {
    position: 'absolute',
    top: 48 + 44 + 44,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    zIndex: 100,
    maxHeight: 300,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  albumItemActive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  albumItemText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  albumCount: {
    fontSize: 13,
    color: colors.textMuted,
  },

  // Thumbnails
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  cameraCard: {
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  videoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  selectedCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0095F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating button
  floatingBtnWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0095F6',
    borderRadius: 12,
    paddingVertical: 14,
  },
  floatingBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  // Loading
  loadingGallery: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fallback mode (Expo Go)
  fallbackContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  fallbackCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  fallbackIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,107,53,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  fallbackCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  fallbackCardSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  fallbackFooter: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    paddingBottom: 20,
  },
});
