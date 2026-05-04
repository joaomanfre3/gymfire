import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { colors } from '../theme';
import FeedScreen from '../screens/Home/FeedScreen';
import PostDetailScreen from '../screens/Home/PostDetailScreen';
import SpeedsViewerScreen from '../screens/Speeds/SpeedsViewerScreen';
import SpeedCreatorScreen from '../screens/Speeds/SpeedCreatorScreen';
import CreatePostScreen from '../screens/Home/CreatePostScreen';
import { NewCreatePostScreen } from '../screens/CreatePost';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import UserPostsScreen from '../screens/Profile2/UserPostsScreen';
import DropsFlowScreen from '../screens/Drops/DropsFlowScreen';
import DropsEditorScreen from '../screens/Drops/DropsEditorScreen';


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
        component={DropsFlowScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="DropsEditor"
        component={DropsEditorScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="NewPost"
        component={NewCreatePostScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="UserPosts"
        component={UserPostsScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
