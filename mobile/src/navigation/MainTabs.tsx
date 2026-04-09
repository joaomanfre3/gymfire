import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabsParamList } from './types';
import { colors } from '../theme';
import { useAuthStore } from '../stores/authStore';
import HomeStack from './HomeStack';
import WorkoutStack from './WorkoutStack';
import SocialStack from './SocialStack';
import AIChatScreen from '../screens/AI/AIChatScreen';
import ChatStack from './ChatStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const VISIBLE_TABS = ['HomeTab', 'SocialTab', 'AITab', 'ChatTab', 'ProfileTab'];

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const user = useAuthStore((s) => s.user);
  const avatarUrl = (user as any)?.avatarUrl;
  const activeColor = '#FFFFFF';
  const inactiveColor = 'rgba(255,255,255,0.6)';

  switch (name) {
    case 'HomeTab':
      return <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={focused ? activeColor : inactiveColor} />;
    case 'SocialTab':
      return <Ionicons name={focused ? 'search' : 'search-outline'} size={26} color={focused ? activeColor : inactiveColor} />;
    case 'AITab':
      return <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={26} color={focused ? colors.primary : inactiveColor} />;
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

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 4 : 0);

  return (
    <View style={[styles.tabBar, { paddingBottom }]}>
      {state.routes
        .filter((route) => VISIBLE_TABS.includes(route.name))
        .map((route) => {
          const focused = state.index === state.routes.indexOf(route);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.7}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
            >
              <TabIcon name={route.name} focused={focused} />
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="SocialTab" component={SocialStack} />
      <Tab.Screen name="AITab" component={AIChatScreen} />
      <Tab.Screen name="ChatTab" component={ChatStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
      <Tab.Screen name="WorkoutTab" component={WorkoutStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
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
