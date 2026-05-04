'use strict';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { useDropsStore } from '../../stores/dropsStore';
import DropsGalleryPage from './DropsGalleryPage';
import DropsCameraPage from './DropsCameraPage';

type Props = NativeStackScreenProps<HomeStackParamList, 'MediaPicker'>;

export default function DropsFlowScreen({ navigation }: Props) {
  const pagerRef = useRef<PagerView>(null);
  const setDropsOpen = useDropsStore((s) => s.setDropsOpen);
  const [activePage, setActivePage] = useState(1); // 0=camera, 1=gallery

  useEffect(() => {
    setDropsOpen(true);
    return () => setDropsOpen(false);
  }, [setDropsOpen]);

  const goToCamera = useCallback(() => {
    pagerRef.current?.setPage(0);
  }, []);

  const goToGallery = useCallback(() => {
    pagerRef.current?.setPage(1);
  }, []);

  const onPageSelected = useCallback((e: any) => {
    setActivePage(e.nativeEvent.position);
  }, []);

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={1}
        orientation="vertical"
        overdrag={true}
        onPageSelected={onPageSelected}
      >
        <View key="camera" style={styles.page}>
          {activePage === 0 ? (
            <DropsCameraPage
              onClose={() => navigation.goBack()}
              onSwipeToGallery={goToGallery}
              onCapture={(uri) => navigation.navigate('DropsEditor', { mediaUri: uri })}
            />
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
        <View key="gallery" style={styles.page}>
          <DropsGalleryPage
            onClose={() => navigation.goBack()}
            onSelectMedia={(uri) => navigation.navigate('DropsEditor', { mediaUri: uri })}
            onOpenCamera={goToCamera}
          />
        </View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#000',
  },
});
