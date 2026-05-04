'use strict';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { useDropsStore } from '../../stores/dropsStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'MediaPicker'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const THUMB_GAP = 2;
const THUMB_SIZE = (SCREEN_WIDTH - THUMB_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const CAMERA_ID = '__camera__';

type Album = { id: string; title: string; assetCount: number };

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MediaPickerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setDropsOpen = useDropsStore((s) => s.setDropsOpen);

  useEffect(() => {
    setDropsOpen(true);
    return () => setDropsOpen(false);
  }, [setDropsOpen]);

  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hasNativeAccess, setHasNativeAccess] = useState(true);

  // ── Init gallery ────────────────────────────────────────────
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

      // Expo Go on Android returns 0 assets due to limited access
      if (result.assets.length === 0) {
        setHasNativeAccess(false);
        setLoading(false);
        return;
      }

      setAssets(result.assets);
      setEndCursor(result.endCursor);
      setHasMore(result.hasNextPage);
      setHasNativeAccess(true);
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
      setHasNativeAccess(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initGallery();
  }, [initGallery]);

  // ── Pagination ──────────────────────────────────────────────
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
    if (hasNativeAccess && currentAlbum !== null) {
      setLoading(true);
      setEndCursor(undefined);
      loadAssets(true);
    }
  }, [currentAlbum]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && hasNativeAccess) {
      loadAssets(false);
    }
  }, [hasMore, loading, loadAssets, hasNativeAccess]);

  const selectAlbum = (album: Album | null) => {
    setCurrentAlbum(album);
    setShowAlbumPicker(false);
    setAssets([]);
    setEndCursor(undefined);
  };

  const openEditor = (uri: string) => {
    navigation.navigate('DropsEditor', { mediaUri: uri });
  };

  const openCamera = () => {
    // Camera is now handled by DropsFlowScreen
  };


  // Fallback: if no native gallery access, open system picker when tapping a "gallery" area
  const openSystemPicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [9, 16],
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      openEditor(result.assets[0].uri);
    }
  };

  // ── Loading state ────────────────────────────────────────────
  if (loading && assets.length === 0) {
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

  // ── Grid data ───────────────────────────────────────────────
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

    const isVideo = item.mediaType === 'video';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openEditor(item.uri)}
        style={styles.thumbWrap}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbImg} />
        {isVideo && (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>{formatDuration(item.duration)}</Text>
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

      {/* Album selector + Selecionar */}
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

        {!hasNativeAccess && (
          <TouchableOpacity onPress={openSystemPicker} style={styles.selectBtn}>
            <Ionicons name="albums-outline" size={16} color={colors.text} />
            <Text style={styles.selectBtnText}>Selecionar</Text>
          </TouchableOpacity>
        )}
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
      {hasNativeAccess ? (
        <FlatList
          data={gridData}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          renderItem={renderThumb}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ gap: THUMB_GAP }}
          contentContainerStyle={{ gap: THUMB_GAP }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_data, index) => ({
            length: THUMB_SIZE + THUMB_GAP,
            offset: (THUMB_SIZE + THUMB_GAP) * Math.floor(index / NUM_COLUMNS),
            index,
          })}
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
      ) : (
        /* Fallback: Expo Go limited access — grid with camera + gallery picker cards */
        <View style={styles.fallbackGrid}>
          {/* Camera card */}
          <TouchableOpacity
            style={[styles.thumbWrap, styles.cameraCard]}
            onPress={openCamera}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={32} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>

          {/* Gallery picker cards - fill the rest of the row */}
          <TouchableOpacity
            style={[styles.thumbWrap, styles.galleryPickerCard]}
            onPress={openSystemPicker}
            activeOpacity={0.7}
          >
            <Ionicons name="images" size={28} color="#FF6B35" />
            <Text style={styles.galleryPickerText}>Escolher{'\n'}foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.thumbWrap, styles.galleryPickerCard]}
            onPress={openSystemPicker}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam" size={28} color="#4ECDC4" />
            <Text style={styles.galleryPickerText}>Escolher{'\n'}vídeo</Text>
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
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },

  // Album bar
  albumBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectBtnText: {
    fontSize: 13,
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

  // Fallback (no native gallery access — Expo Go)
  fallbackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THUMB_GAP,
  },
  galleryPickerCard: {
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  galleryPickerText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 14,
  },
});
