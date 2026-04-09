import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { colors } from '../theme';
import FeedScreen from '../screens/Home/FeedScreen';
import PostDetailScreen from '../screens/Home/PostDetailScreen';
import SpeedsViewerScreen from '../screens/Speeds/SpeedsViewerScreen';
import SpeedCreatorScreen from '../screens/Speeds/SpeedCreatorScreen';
import CreatePostScreen from '../screens/Home/CreatePostScreen';
import MediaPickerScreen from '../screens/Home/MediaPickerScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={{ headerShown: false }}
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
      <Stack.Screen
        name="MediaPicker"
        component={MediaPickerScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
