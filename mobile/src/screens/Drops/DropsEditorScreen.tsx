import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeStackParamList } from '../../navigation/types';
import { useDropsStore } from '../../stores/dropsStore';
import api from '../../api/client';
import TextOverlay, { TextItem } from '../../components/DropsEditor/TextOverlay';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'DropsEditor'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TOOL_ITEMS = [
  { icon: 'text-outline' as const, label: 'Texto' },
  { icon: 'musical-notes-outline' as const, label: 'Músicas' },
  { icon: 'at-outline' as const, label: 'Mencionar' },
  { icon: 'brush-outline' as const, label: 'Desenhar' },
  { icon: 'download-outline' as const, label: 'Salvar' },
];

export default function DropsEditorScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<HomeStackParamList, 'DropsEditor'>>();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);
  const bottomPadding = Math.max(insets.bottom, 16);
  const viewShotRef = useRef<View>(null);
  const setDropsOpen = useDropsStore((s) => s.setDropsOpen);

  const { mediaUri } = route.params;
  const [caption, setCaption] = useState('');
  const [showTools, setShowTools] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [textEditing, setTextEditing] = useState(false);
  const [textItems, setTextItems] = useState<TextItem[]>([]);

  useEffect(() => {
    setDropsOpen(true);
    return () => setDropsOpen(false);
  }, [setDropsOpen]);

  // Gesture values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      scale.value = withSpring(1);
      savedScale.value = 1;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handlePublish = useCallback(async () => {
    if (publishing) return;
    setPublishing(true);

    try {
      const isVideo = /\.(mp4|mov|avi|webm)$/i.test(mediaUri);
      const formData = new FormData();
      formData.append('file', {
        uri: mediaUri,
        type: isVideo ? 'video/mp4' : 'image/jpeg',
        name: isVideo ? 'drop-video.mp4' : 'drop-photo.jpg',
      } as any);

      const token = await AsyncStorage.getItem('access_token');
      const uploadRes = await fetch('https://gymfire.vercel.app/api/drops/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload falhou');
      const { mediaUrl, mediaType } = await uploadRes.json();

      await api.post('/drops', {
        mediaUrl,
        mediaType,
        caption: caption.trim() || undefined,
      });

      Alert.alert('Publicado!', 'Seu drop foi publicado.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.');
    } finally {
      setPublishing(false);
    }
  }, [publishing, mediaUri, caption, navigation]);

  const toggleTools = useCallback(() => {
    setShowTools((prev) => !prev);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Viewport */}
      <View style={styles.viewport} ref={viewShotRef}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
            <Image
              source={{ uri: mediaUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBtn}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.topRight}>
          <TouchableOpacity style={styles.topBtn} onPress={toggleTools}>
            <Ionicons name="options-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Text items on image */}
      <TextOverlay
        visible={textMode}
        onClose={() => setTextMode(false)}
        textItems={textItems}
        setTextItems={setTextItems}
        onEditingChange={setTextEditing}
      />

      {/* Side tools */}
      {showTools && !textMode && !textEditing && (
        <View style={[styles.toolsSidebar, { top: topPadding + 60 }]}>
          {TOOL_ITEMS.map((tool) => (
            <TouchableOpacity
              key={tool.label}
              style={styles.toolItem}
              activeOpacity={0.7}
              onPress={() => {
                if (tool.label === 'Texto') setTextMode(true);
              }}
            >
              <View style={styles.toolIconWrap}>
                <Ionicons name={tool.icon} size={22} color="#FFF" />
              </View>
              <Text style={styles.toolLabel}>{tool.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bottom area */}
      {!textMode && !textEditing && <View style={[styles.bottomArea, { paddingBottom: bottomPadding }]}>
        {/* Caption */}
        <View style={styles.captionRow}>
          <TextInput
            style={styles.captionInput}
            placeholder="Adicione uma legenda..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={200}
          />
        </View>

        {/* Publish button */}
        <TouchableOpacity
          style={[styles.publishBtn, publishing && styles.publishBtnDisabled]}
          onPress={handlePublish}
          activeOpacity={0.8}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="flash" size={18} color="#FFF" />
              <Text style={styles.publishBtnText}>Publicar Drop</Text>
            </>
          )}
        </TouchableOpacity>
      </View>}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewport: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 10,
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
  },

  // Side tools
  toolsSidebar: {
    position: 'absolute',
    right: 12,
    zIndex: 10,
    gap: 4,
  },
  toolItem: {
    alignItems: 'center',
    paddingVertical: 6,
    width: 64,
  },
  toolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  toolLabel: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },

  // Bottom area
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  captionRow: {
    marginBottom: 12,
  },
  captionInput: {
    fontSize: 14,
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 80,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 24,
    paddingVertical: 14,
    marginBottom: 8,
  },
  publishBtnDisabled: {
    opacity: 0.6,
  },
  publishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
