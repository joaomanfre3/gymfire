import React, { useRef, useCallback } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NavigationIndependentTree, NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { colors } from '../theme';
import { useAuthStore } from '../stores/authStore';
import HomeStack from './HomeStack';
import WorkoutStack from './WorkoutStack';
import SocialStack from './SocialStack';
import AIChatScreen from '../screens/AI/AIChatScreen';
import ChatStack from './ChatStack';
import ProfileStack from './ProfileStack';

const DarkTheme = {
  ...DefaultTheme,
  dark: true as const,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF6B35',
    background: '#0A0A0F',
    card: '#0A0A0F',
    text: '#FFFFFF',
    border: '#1A1A2E',
    notification: '#FF6B35',
  },
};

const TAB_KEYS = ['HomeTab', 'SocialTab', 'AITab', 'ChatTab', 'ProfileTab'] as const;

const TAB_SCREENS = [
  HomeStack,
  SocialStack,
  AIChatScreen,
  ChatStack,
  ProfileStack,
];

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const user = useAuthStore((s) => s.user);
  const avatarUrl = (user as any)?.avatarUrl;
  const activeColor = '#FFFFFF';
  const inactiveColor = '#FFFFFF';

  switch (name) {
    case 'HomeTab':
      return <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={focused ? activeColor : inactiveColor} />;
    case 'SocialTab':
      return <Ionicons name={focused ? 'search' : 'search-outline'} size={26} color={focused ? activeColor : inactiveColor} />;
    case 'AITab':
      return <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={26} color={focused ? activeColor : inactiveColor} />;
    case 'ChatTab':
      return <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={focused ? activeColor : inactiveColor} />;
    case 'ProfileTab': {
      if (avatarUrl) {
        return (
          <View style={[styles.avatar, focused && styles.avatarActive]}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          </View>
        );
      }
      return (
        <View style={[styles.avatar, focused && styles.avatarActive, { backgroundColor: focused ? '#fff' : 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="person" size={14} color={focused ? '#000' : 'rgba(255,255,255,0.5)'} />
        </View>
      );
    }
    default:
      return null;
  }
}

function CustomTabBar({
  activeIndex,
  onTabPress,
}: {
  activeIndex: number;
  onTabPress: (index: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 0);

  return (
    <View style={[styles.tabBar, { paddingBottom }]}>
      {TAB_KEYS.map((name, index) => (
        <TouchableOpacity
          key={name}
          activeOpacity={0.7}
          onPress={() => onTabPress(index)}
          style={styles.tabItem}
        >
          <TabIcon name={name} focused={activeIndex === index} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MainTabs() {
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const onTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  const onPageSelected = useCallback((e: any) => {
    setActiveIndex(e.nativeEvent.position);
  }, []);

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={onPageSelected}
        overdrag={true}
      >
        {TAB_SCREENS.map((Screen, index) => (
          <View key={TAB_KEYS[index]} style={styles.page}>
            <NavigationIndependentTree>
              <NavigationContainer theme={DarkTheme}>
                <Screen />
              </NavigationContainer>
            </NavigationIndependentTree>
          </View>
        ))}
      </PagerView>
      <CustomTabBar activeIndex={activeIndex} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.15)',
    height: 'auto' as any,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  avatarActive: {
    borderColor: '#FFFFFF',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
});
