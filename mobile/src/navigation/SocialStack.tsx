import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SocialStackParamList } from './types';
import { colors } from '../theme';
import SearchScreen from '../screens/Social/SearchScreen';
import RankingScreen from '../screens/Social/RankingScreen';
import UserProfileScreen from '../screens/Social/UserProfileScreen';
import FollowersScreen from '../screens/Social/FollowersScreen';
import FollowingScreen from '../screens/Social/FollowingScreen';
import GroupsScreen from '../screens/Groups/GroupsScreen';

const Stack = createNativeStackNavigator<SocialStackParamList>();

export default function SocialStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Explore' }}
      />
      <Stack.Screen
        name="Ranking"
        component={RankingScreen}
        options={{ title: 'Ranking' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Followers"
        component={FollowersScreen}
        options={{ title: 'Followers' }}
      />
      <Stack.Screen
        name="Following"
        component={FollowingScreen}
        options={{ title: 'Following' }}
      />
      <Stack.Screen
        name="Groups"
        component={GroupsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
