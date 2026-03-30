import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { colors } from '../theme';
import FeedScreen from '../screens/Home/FeedScreen';
import PostDetailScreen from '../screens/Home/PostDetailScreen';
import SpeedsViewerScreen from '../screens/Speeds/SpeedsViewerScreen';
import SpeedCreatorScreen from '../screens/Speeds/SpeedCreatorScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
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
        name="Feed"
        component={FeedScreen}
        options={{ title: 'GymFire' }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
      <Stack.Screen
        name="SpeedsViewer"
        component={SpeedsViewerScreen}
        options={{
          headerShown: false,
          animation: 'fade',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="SpeedCreator"
        component={SpeedCreatorScreen}
        options={{ title: 'New Speed', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
