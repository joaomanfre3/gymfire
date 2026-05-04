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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Cropper, CropperRef } from '../../components/Cropper';
import { colors } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { useDropsStore } from '../../stores/dropsStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreatePost'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const THUMB_GAP = 2;
const THUMB_SIZE = (SCREEN_WIDTH - THUMB_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const PREVIEW_HEIGHT = (SCREEN_WIDTH * 5) / 4; // 4:5 Instagram post ratio

const CAMERA_ID = '__camera__';

type Album = { id: string; title: string; assetCount: number };

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}


export default function CreatePostScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setDropsOpen = useDropsStore((s) => s.setDropsOpen);

  useEffect(() => {
    setDropsOpen(true);
    return () => setDropsOpen(false);
  }, [setDropsOpen]);

  const cropperRef = useRef<CropperRef>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>([]);
  const [multiSelect, setMultiSelect] = useState(false);
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hasNativeAccess, setHasNativeAccess] = useState(true);

  // ── Preview collapse/expand (reanimated for fluid animation) ──
  const expanded = useSharedValue(1); // 1 = open, 0 = closed
  const [isExpanded, setIsExpanded] = useState(true);

  const collapse = useCallback(() => {
    if (!isExpanded) return;
    setIsExpanded(false);
    expanded.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
  }, [isExpanded, expanded]);

  const expand = useCallback(() => {
    if (isExpanded) return;
    setIsExpanded(true);
    expanded.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
  }, [isExpanded, expanded]);

  const previewWrapStyle = useAnimatedStyle(() => ({
    height: expanded.value * PREVIEW_HEIGHT,
    opacity: expanded.value,
    overflow: 'hidden' as const,
  }));

  const handleGalleryScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (y > 20 && isExpanded) {
        collapse();
      }
    },
    [isExpanded, collapse],
  );

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

      if (result.assets.length > 0) {
        setSelectedAssets([result.assets[0]]);
      }

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

  // ── Load assets ─────────────────────────────────────────────
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
          if (result.assets.length > 0) {
            setSelectedAssets([result.assets[0]]);
          }
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

  const albumChangeRef = useRef(false);
  useEffect(() => {
    if (hasNativeAccess && albumChangeRef.current) {
      setLoading(true);
      setEndCursor(undefined);
      setSelectedAssets([]);
      loadAssets(true);
    }
    albumChangeRef.current = true;
  }, [currentAlbum]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && hasNativeAccess) loadAssets(false);
  }, [hasMore, loading, loadAssets, hasNativeAccess]);

  const selectAlbum = (album: Album | null) => {
    setCurrentAlbum(album);
    setShowAlbumPicker(false);
    setAssets([]);
    setEndCursor(undefined);
  };

  // ── Selection logic ─────────────────────────────────────────
  const toggleSelect = (asset: MediaLibrary.Asset) => {
    if (multiSelect) {
      setSelectedAssets((prev) => {
        const exists = prev.find((a) => a.id === asset.id);
        if (exists) return prev.filter((a) => a.id !== asset.id);
        return [...prev, asset];
      });
    } else {
      setSelectedAssets([asset]);
    }
  };

  const toggleMultiSelect = () => {
    if (multiSelect) {
      setSelectedAssets((prev) => (prev.length > 0 ? [prev[0]] : []));
    }
    setMultiSelect(!multiSelect);
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 5],
    });
    if (!result.canceled && result.assets[0]) {
      // TODO
    }
  };

  const openSystemPicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      allowsMultipleSelection: multiSelect,
      selectionLimit: 10,
    });
    if (!result.canceled && result.assets.length > 0) {
      // TODO
    }
  };

  const handleNext = async () => {
    if (selectedAssets.length === 0 || isExporting) return;
    setIsExporting(true);
    try {
      const cropResult = await cropperRef.current?.export();
      if (!cropResult) throw new Error('Export failed');
      navigation.navigate('NewPost', { mediaUri: cropResult.uri });
    } catch (e: any) {
      console.error('Crop export error:', e);
      // Alert to debug — remove later
      const { Alert } = require('react-native');
      Alert.alert('Erro ao recortar', e?.message ?? String(e));
    } finally {
      setIsExporting(false);
    }
  };

  const previewUri = selectedAssets.length > 0 ? selectedAssets[0].uri : null;
  const previewAsset = selectedAssets.length > 0 ? selectedAssets[0] : null;
  const gridData = [{ id: CAMERA_ID } as MediaLibrary.Asset, ...assets];

  const getSelectionIndex = (assetId: string) => {
    const idx = selectedAssets.findIndex((a) => a.id === assetId);
    return idx >= 0 ? idx + 1 : -1;
  };

  const renderThumb = ({ item }: { item: MediaLibrary.Asset }) => {
    if (item.id === CAMERA_ID) {
      return (
        <TouchableOpacity
          style={[styles.thumbWrap, styles.cameraCard]}
          onPress={openCamera}
          activeOpacity={0.7}
        >
          <Ionicons name="camera" size={28} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      );
    }

    const selIndex = getSelectionIndex(item.id);
    const isSelected = selIndex > 0;
    const isVideo = item.mediaType === 'video';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggleSelect(item)}
        style={styles.thumbWrap}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbImg} />
        {isVideo && (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>{formatDuration(item.duration)}</Text>
          </View>
        )}
        {isSelected && (
          <>
            <View style={styles.selectedOverlay} />
            <View style={styles.selectedCircle}>
              {multiSelect ? (
                <Text style={styles.selectedNumber}>{selIndex}</Text>
              ) : (
                <Ionicons name="checkmark" size={14} color="#FFF" />
              )}
            </View>
          </>
        )}
        {!isSelected && multiSelect && <View style={styles.unselectedCircle} />}
      </TouchableOpacity>
    );
  };

  // ── Loading state ───────────────────────────────────────────
  if (loading && assets.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo post</Text>
          <View style={{ width: 44 }} />
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo post</Text>
        <TouchableOpacity
          onPress={handleNext}
          disabled={selectedAssets.length === 0 || isExporting}
          style={styles.nextBtn}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[styles.nextText, selectedAssets.length === 0 && { opacity: 0.4 }]}
            >
              Avançar
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Preview (collapses smoothly) ────────────────────── */}
      <Animated.View style={previewWrapStyle}>
        {previewUri ? (
          <Cropper
            key={previewUri}
            ref={cropperRef}
            source={{ uri: previewUri }}
            imageSize={previewAsset ? { width: previewAsset.width, height: previewAsset.height } : undefined}
            aspectRatio={{ width: 4, height: 5 }}
            width={SCREEN_WIDTH}
            style={{ backgroundColor: '#111' }}
          />
        ) : (
          <View style={styles.previewClip}>
            <View style={styles.previewPlaceholder}>
              <Ionicons name="image-outline" size={48} color={colors.textMuted} />
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── Album bar ───────────────────────────────────────── */}
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
            size={16}
            color={colors.text}
          />
        </TouchableOpacity>

        {!isExpanded && (
          <TouchableOpacity onPress={expand} style={styles.expandBtn}>
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={hasNativeAccess ? toggleMultiSelect : openSystemPicker}
          style={[styles.selectBtn, multiSelect && styles.selectBtnActive]}
        >
          <Ionicons
            name="copy-outline"
            size={16}
            color={multiSelect ? '#FFF' : colors.text}
          />
          <Text style={[styles.selectBtnText, multiSelect && { color: '#FFF' }]}>
            Selecionar
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Gallery grid ────────────────────────────────────── */}
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
          onScroll={handleGalleryScroll}
          scrollEventThrottle={16}
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
        <View style={styles.fallbackGrid}>
          <TouchableOpacity
            style={[styles.thumbWrap, styles.cameraCard]}
            onPress={openCamera}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={28} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.thumbWrap, styles.galleryPickerCard]}
            onPress={openSystemPicker}
            activeOpacity={0.7}
          >
            <Ionicons name="images" size={24} color={colors.primary} />
            <Text style={styles.galleryPickerText}>Escolher{'\n'}foto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.thumbWrap, styles.galleryPickerCard]}
            onPress={openSystemPicker}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam" size={24} color={colors.accent} />
            <Text style={styles.galleryPickerText}>Escolher{'\n'}vídeo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Album dropdown ──────────────────────────────────── */}
      {showAlbumPicker && (
        <View
          style={[
            styles.albumDropdown,
            { top: 48 + (isExpanded ? PREVIEW_HEIGHT : 0) + 44 },
          ]}
        >
          <TouchableOpacity
            style={[styles.albumItem, !currentAlbum && styles.albumItemActive]}
            onPress={() => selectAlbum(null)}
          >
            <Text
              style={[styles.albumItemText, !currentAlbum && { color: colors.primary }]}
            >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 48,
  },
  headerBtn: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  nextBtn: { paddingHorizontal: 8, height: 40, justifyContent: 'center' },
  nextText: { fontSize: 15, fontWeight: '700', color: colors.primary },

  // Preview clip area — overflow hidden crops the image to 4:5
  previewClip: {
    width: SCREEN_WIDTH,
    height: PREVIEW_HEIGHT,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  previewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Album bar
  albumBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  albumSelector: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  albumName: { fontSize: 15, fontWeight: '600', color: colors.text },
  expandBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
  selectBtnActive: { backgroundColor: colors.primary },
  selectBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },

  // Album dropdown
  albumDropdown: {
    position: 'absolute',
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
  albumItemActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  albumItemText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  albumCount: { fontSize: 13, color: colors.textMuted },

  // Thumbnails
  thumbWrap: { width: THUMB_SIZE, height: THUMB_SIZE, position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  cameraCard: { backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  videoBadgeText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  selectedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  selectedCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedNumber: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  unselectedCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  // Fallback
  fallbackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: THUMB_GAP },
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
