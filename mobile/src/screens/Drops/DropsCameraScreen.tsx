import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { HomeStackParamList } from '../../navigation/types';
import { useDropsStore } from '../../stores/dropsStore';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'MediaPicker'>;

export default function DropsCameraScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const setDropsOpen = useDropsStore((s) => s.setDropsOpen);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<'picture' | 'video'>('picture');

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);

  useEffect(() => {
    setDropsOpen(true);
    return () => setDropsOpen(false);
  }, [setDropsOpen]);

  // Swipe up → go back to gallery
  const swipeUpGesture = Gesture.Pan()
    .onEnd((e) => {
      if (e.translationY < -100) {
        navigation.goBack();
      }
    });

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        navigation.replace('SpeedCreator', { mediaUri: photo.uri });
      }
    } catch (err) {
      console.log('[Camera] takePhoto error:', err);
    }
  }, [navigation]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;
    setIsRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (video?.uri) {
        navigation.replace('SpeedCreator', { mediaUri: video.uri });
      }
    } catch (err) {
      console.log('[Camera] recordAsync error:', err);
    } finally {
      setIsRecording(false);
    }
  }, [isRecording, navigation]);

  const stopRecording = useCallback(() => {
    if (!cameraRef.current || !isRecording) return;
    cameraRef.current.stopRecording();
  }, [isRecording]);

  const handleCapture = useCallback(() => {
    if (mode === 'picture') {
      takePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  }, [mode, isRecording, takePhoto, startRecording, stopRecording]);

  // Permission states
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.3)" />
        <Text style={styles.permTitle}>Acesso à câmera</Text>
        <Text style={styles.permSubtitle}>
          Permita o acesso à câmera para criar drops
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Permitir câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        mode={mode}
      >
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: topPadding }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBtn}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleFlash} style={styles.topBtn}>
            <Ionicons
              name={flash === 'on' ? 'flash' : 'flash-off'}
              size={24}
              color={flash === 'on' ? '#FFD700' : '#FFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Mode selector */}
          <View style={styles.modeRow}>
            <TouchableOpacity onPress={() => setMode('picture')}>
              <Text style={[styles.modeText, mode === 'picture' && styles.modeActive]}>
                FOTO
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('video')}>
              <Text style={[styles.modeText, mode === 'video' && styles.modeActive]}>
                VÍDEO
              </Text>
            </TouchableOpacity>
          </View>

          {/* Capture row */}
          <View style={styles.captureRow}>
            {/* Gallery shortcut */}
            <TouchableOpacity
              style={styles.sideBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="images-outline" size={28} color="#FFF" />
            </TouchableOpacity>

            {/* Capture button */}
            <TouchableOpacity
              style={[
                styles.captureBtn,
                mode === 'video' && styles.captureBtnVideo,
                isRecording && styles.captureBtnRecording,
              ]}
              onPress={handleCapture}
              activeOpacity={0.7}
            >
              {isRecording ? (
                <View style={styles.stopIcon} />
              ) : (
                <View
                  style={[
                    styles.captureInner,
                    mode === 'video' && styles.captureInnerVideo,
                  ]}
                />
              )}
            </TouchableOpacity>

            {/* Flip camera */}
            <TouchableOpacity style={styles.sideBtn} onPress={toggleFacing}>
              <Ionicons name="camera-reverse-outline" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 20,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  modeActive: {
    color: '#FFF',
  },

  // Capture row
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    paddingBottom: 16,
  },
  sideBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnVideo: {
    borderColor: '#EF4444',
  },
  captureBtnRecording: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  captureInnerVideo: {
    backgroundColor: '#EF4444',
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  // Permission screen
  permTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
  },
  permSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  permBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 12,
  },
  permBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  backBtn: {
    paddingVertical: 10,
  },
  backBtnText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});
