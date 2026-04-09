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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { colors } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'MediaPicker'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const THUMB_GAP = 2;
const THUMB_SIZE = (SCREEN_WIDTH - THUMB_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const PREVIEW_HEIGHT = SCREEN_WIDTH;

type Album = { id: string; title: string; assetCount: number };

export default function MediaPickerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaLibrary.Asset | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  // Request permissions
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Load albums
  useEffect(() => {
    if (!hasPermission) return;
    (async () => {
      const albumList = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
      const mapped: Album[] = albumList
        .filter((a) => a.assetCount > 0)
        .map((a) => ({ id: a.id, title: a.title, assetCount: a.assetCount }))
        .sort((a, b) => b.assetCount - a.assetCount);
      setAlbums(mapped);
    })();
  }, [hasPermission]);

  // Load assets
  const loadAssets = useCallback(
    async (reset: boolean) => {
      if (!hasPermission) return;
      const options: MediaLibrary.AssetsOptions = {
        first: 60,
        mediaType: [MediaLibrary.MediaType.photo],
        sortBy: [MediaLibrary.SortBy.creationTime],
        ...(currentAlbum ? { album: currentAlbum.id } : {}),
        ...(!reset && endCursor ? { after: endCursor } : {}),
      };

      const result = await MediaLibrary.getAssetsAsync(options);
      if (reset) {
        setAssets(result.assets);
        if (result.assets.length > 0) {
          setSelectedAsset(result.assets[0]);
        }
      } else {
        setAssets((prev) => [...prev, ...result.assets]);
      }
      setEndCursor(result.endCursor);
      setHasMore(result.hasNextPage);
      setLoading(false);
    },
    [hasPermission, currentAlbum, endCursor],
  );

  useEffect(() => {
    if (hasPermission) {
      setLoading(true);
      setEndCursor(undefined);
      loadAssets(true);
    }
  }, [hasPermission, currentAlbum]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadAssets(false);
    }
  }, [hasMore, loading, loadAssets]);

  const selectAlbum = (album: Album | null) => {
    setCurrentAlbum(album);
    setShowAlbumPicker(false);
    setAssets([]);
    setSelectedAsset(null);
    setEndCursor(undefined);
  };

  const handleNext = () => {
    if (selectedAsset) {
      navigation.navigate('CreatePost', { mediaUri: selectedAsset.uri });
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Spark</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.permissionBox}>
          <Ionicons name="images-outline" size={64} color={colors.textMuted} />
          <Text style={styles.permissionTitle}>Acesso à galeria necessário</Text>
          <Text style={styles.permissionSub}>
            Permita o acesso às fotos nas configurações do dispositivo.
          </Text>
        </View>
      </View>
    );
  }

  const renderThumb = ({ item }: { item: MediaLibrary.Asset }) => {
    const isSelected = selectedAsset?.id === item.id;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setSelectedAsset(item)}
        style={[styles.thumbWrap, isSelected && styles.thumbSelected]}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbImg} />
        {isSelected && (
          <View style={styles.thumbCheck}>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
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
        <Text style={styles.headerTitle}>Nova Spark</Text>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!selectedAsset}
          style={[styles.nextBtn, !selectedAsset && { opacity: 0.4 }]}
        >
          <Text style={styles.nextBtnText}>Avançar</Text>
        </TouchableOpacity>
      </View>

      {/* Preview */}
      <View style={styles.previewContainer}>
        {selectedAsset ? (
          <Image
            source={{ uri: selectedAsset.uri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Ionicons name="image-outline" size={64} color={colors.textMuted} />
          </View>
        )}
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

        <TouchableOpacity style={styles.multiSelectBtn}>
          <Ionicons name="copy-outline" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={() => {
            // Could open camera directly
          }}
        >
          <Ionicons name="camera-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Album picker dropdown */}
      {showAlbumPicker && (
        <View style={styles.albumDropdown}>
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

      {/* Gallery grid */}
      {loading && assets.length === 0 ? (
        <View style={styles.loadingGallery}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={assets}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },

  // Preview
  previewContainer: {
    width: SCREEN_WIDTH,
    height: PREVIEW_HEIGHT * 0.6,
    backgroundColor: colors.surface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Album bar
  albumBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.surfaceBorder,
  },
  albumSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  albumName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  multiSelectBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cameraBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  // Album dropdown
  albumDropdown: {
    position: 'absolute',
    top: 48 + PREVIEW_HEIGHT * 0.6 + 48,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    zIndex: 100,
    maxHeight: 300,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.surfaceBorder,
  },
  albumItemActive: {
    backgroundColor: colors.surfaceLight,
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
  thumbSelected: {
    opacity: 0.7,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },

  // Loading
  loadingGallery: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Permission
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
