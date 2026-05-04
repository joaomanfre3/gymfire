'use strict';

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import ProfilePrivateState from './components/ProfilePrivateState';
import ProfileTopBar from './components/ProfileTopBar';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs, { ProfileTab } from './components/ProfileTabs';
import TabPlaceholder from './components/TabPlaceholder';
import ProfileGridItem from './components/ProfileGridItem';
import { useProfile } from './hooks/useProfile';
import { useUserPosts } from './hooks/useUserPosts';
import { canViewContent } from './api/profile';
import type { Post } from '../../components/Post/types';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const currentUser = useAuthStore((s) => s.user) as any;
  const logout = useAuthStore((s) => s.logout);

  const userId = route.params?.userId ?? currentUser?.id;
  const isOwnProfile = !route.params?.userId || route.params?.userId === currentUser?.id;

  const { profile, toggleFollow } = useProfile(userId ?? '');
  const canView = profile ? canViewContent(profile) : true;
  const { posts, isLoading: postsLoading } = useUserPosts(userId ?? '', canView);

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const thumbSize = screenWidth / 3 - 1;

  const handleLeftPress = useCallback(() => {
    if (isOwnProfile) {
      // Cross-stack: go to HomeTab → CreatePost modal
      navigation.getParent()?.navigate('HomeTab', { screen: 'CreatePost' });
    } else {
      navigation.goBack();
    }
  }, [isOwnProfile, navigation]);

  const handleRightPress = useCallback(() => {
    if (isOwnProfile) {
      Alert.alert('Menu', undefined, [
        { text: 'Configurações', onPress: () => navigation.navigate('Settings') },
        { text: 'Sair', style: 'destructive', onPress: () => logout() },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Em breve', 'Opções do perfil em breve.');
    }
  }, [isOwnProfile, navigation, logout]);

  const handleShareProfile = useCallback(() => {
    if (!profile) return;
    const url = `https://gymfire.app/u/${profile.user.username}`;
    Share.share({ url, message: url }).catch(() => {});
  }, [profile]);

  const handleFollowingMenu = useCallback(() => {
    Alert.alert('Seguindo', undefined, [
      { text: 'Deixar de seguir', style: 'destructive', onPress: () => toggleFollow() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [toggleFollow]);

  const handleGridItemPress = useCallback(
    (post: Post) => {
      navigation.navigate('UserPosts', { userId, initialPostId: post.id });
    },
    [navigation, userId]
  );

  const showPostsGrid = activeTab === 'posts' && canView;
  const data = showPostsGrid ? posts : [];

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <ProfileGridItem
        post={item}
        size={thumbSize}
        isRightmost={index % 3 === 2}
        onPress={() => handleGridItemPress(item)}
      />
    ),
    [thumbSize, handleGridItemPress]
  );

  const listHeader = useMemo(() => {
    if (!profile) return null;
    return (
      <View>
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          onEditProfile={() => navigation.navigate('EditProfile')}
          onShareProfile={handleShareProfile}
          onToggleFollow={toggleFollow}
          onMessage={() => Alert.alert('Em breve', 'Mensagens em breve.')}
          onFollowingMenu={handleFollowingMenu}
        />
        <ProfileTabs active={activeTab} onChange={setActiveTab} isOwnProfile={isOwnProfile} />
      </View>
    );
  }, [
    profile,
    isOwnProfile,
    activeTab,
    navigation,
    handleShareProfile,
    toggleFollow,
    handleFollowingMenu,
  ]);

  const listEmpty = useMemo(() => {
    if (!profile) return null;
    if (!canView) return <ProfilePrivateState />;
    if (activeTab === 'reels') return <TabPlaceholder variant="reels" />;
    if (activeTab === 'saved') return <TabPlaceholder variant="saved" />;
    if (postsLoading) return <ActivityIndicator color="#FF6B35" style={{ paddingVertical: 40 }} />;
    return (
      <View style={styles.emptyGrid}>
        <Feather name="camera" size={48} color="#666" />
        <Text style={styles.emptyTitle}>
          {isOwnProfile ? 'Compartilhe sua primeira foto' : 'Sem posts ainda'}
        </Text>
        {isOwnProfile && (
          <Text style={styles.emptySubtitle}>Suas fotos aparecerão aqui</Text>
        )}
      </View>
    );
  }, [profile, canView, activeTab, postsLoading, isOwnProfile]);

  if (!userId || !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FF6B35" style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ProfileTopBar
        username={profile.user.username}
        isOwnProfile={isOwnProfile}
        onLeftPress={handleLeftPress}
        onRightPress={handleRightPress}
      />
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        numColumns={3}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  emptyGrid: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  emptySubtitle: { fontSize: 13, color: '#a8a8a8' },
});
