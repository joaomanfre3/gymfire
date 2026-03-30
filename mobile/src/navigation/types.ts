export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabsParamList = {
  HomeTab: undefined;
  WorkoutTab: undefined;
  SocialTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Feed: undefined;
  PostDetail: { postId: string };
  SpeedsViewer: { userId: string };
  SpeedCreator: undefined;
};

export type WorkoutStackParamList = {
  RoutinesList: undefined;
  RoutineDetail: { id: string };
  RoutineForm: undefined;
  WorkoutSelector: undefined;
  ActiveWorkout: { workoutId: string };
  WorkoutSummary: { workoutId: string };
  ExerciseList: { routineId?: string } | undefined;
  ExerciseDetail: { id: string };
};

export type SocialStackParamList = {
  Search: undefined;
  Ranking: undefined;
  UserProfile: { username: string };
  Followers: { userId: string };
  Following: { userId: string };
};

export type ChatStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: string; name: string };
  NewConversation: undefined;
};

export type ProfileStackParamList = {
  MyProfile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
  Premium: undefined;
};
