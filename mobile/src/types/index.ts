// ============================================================
// Enum types (string unions)
// ============================================================

export type MuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'FOREARMS'
  | 'CORE'
  | 'QUADS'
  | 'HAMSTRINGS'
  | 'GLUTES'
  | 'CALVES'
  | 'FULL_BODY'
  | 'CARDIO'
  | 'OTHER';

export type Equipment =
  | 'BARBELL'
  | 'DUMBBELL'
  | 'MACHINE'
  | 'CABLE'
  | 'BODYWEIGHT'
  | 'KETTLEBELL'
  | 'BAND'
  | 'SMITH_MACHINE'
  | 'OTHER'
  | 'NONE';

export type Difficulty =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED';

export type ExerciseCategory =
  | 'STRENGTH'
  | 'CARDIO'
  | 'FLEXIBILITY'
  | 'OLYMPIC'
  | 'PLYOMETRIC'
  | 'STRONGMAN'
  | 'OTHER';

export type WeekDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type PRType =
  | 'MAX_WEIGHT'
  | 'MAX_REPS'
  | 'MAX_VOLUME'
  | 'MAX_ONE_RM'
  | 'MAX_DURATION'
  | 'MAX_DISTANCE';

export type Mood =
  | 'TERRIBLE'
  | 'BAD'
  | 'NEUTRAL'
  | 'GOOD'
  | 'AMAZING';

export type PostType =
  | 'WORKOUT'
  | 'ACHIEVEMENT'
  | 'PR'
  | 'STREAK'
  | 'PHOTO'
  | 'TEXT';

export type Visibility =
  | 'PUBLIC'
  | 'FOLLOWERS'
  | 'PRIVATE';

export type PointType =
  | 'WORKOUT_COMPLETED'
  | 'PR_ACHIEVED'
  | 'STREAK_BONUS'
  | 'SOCIAL_INTERACTION'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'CHALLENGE_COMPLETED';

export type SetType =
  | 'NORMAL'
  | 'WARMUP'
  | 'DROP'
  | 'FAILURE'
  | 'SUPERSET';

export type FollowStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED';

// ============================================================
// Entity interfaces
// ============================================================

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  isVerified: boolean;
  isPremium: boolean;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutAt?: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  description?: string;
  instructions: string[];
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  difficulty: Difficulty;
  category: ExerciseCategory;
  videoUrl?: string;
  gifUrl?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  isFromLibrary: boolean;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  order: number;
  items: FolderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FolderItem {
  id: string;
  folderId: string;
  routineId: string;
  order: number;
  routine?: Routine;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  sets: RoutineSet[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineSet {
  id: string;
  routineId: string;
  exerciseId: string;
  exercise?: Exercise;
  order: number;
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  restSeconds?: number;
  type: SetType;
  notes?: string;
}

export interface Workout {
  id: string;
  userId: string;
  user?: User;
  routineId?: string;
  routine?: Routine;
  name: string;
  description?: string;
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  mood?: Mood;
  notes?: string;
  sets: WorkoutSet[];
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise?: Exercise;
  order: number;
  setNumber: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  type: SetType;
  isPR: boolean;
  notes?: string;
  completedAt?: string;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exercise?: Exercise;
  workoutId: string;
  workoutSetId: string;
  type: PRType;
  value: number;
  previousValue?: number;
  achievedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  user?: User;
  workoutId?: string;
  workout?: Workout;
  type: PostType;
  content?: string;
  imageUrls: string[];
  visibility: Visibility;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isFired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Like {
  id: string;
  userId: string;
  user?: User;
  postId: string;
  createdAt: string;
}

export interface FireReaction {
  id: string;
  userId: string;
  user?: User;
  postId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  user?: User;
  postId: string;
  parentId?: string;
  content: string;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  follower?: User;
  followingId: string;
  following?: User;
  status: FollowStatus;
  createdAt: string;
}

export interface RankingEntry {
  posicao: number;
  user: User;
  points: number;
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: PointType;
  points: number;
  description?: string;
  referenceId?: string;
  createdAt: string;
}

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  multiplier: number;
  nextMilestone: number;
}

export interface Token {
  access_token: string;
  refresh_token: string;
}

export interface Notification {
  id: string;
  userId: string;
  fromUserId?: string;
  fromUser?: User;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface Speed {
  id: string;
  userId: string;
  user?: User;
  content: string;
  imageUrls: string[];
  expiresAt: string;
  views: SpeedView[];
  highlights: Highlight[];
  createdAt: string;
}

export interface SpeedView {
  id: string;
  speedId: string;
  userId: string;
  user?: User;
  viewedAt: string;
}

export interface Highlight {
  id: string;
  userId: string;
  name: string;
  coverUrl?: string;
  speeds: Speed[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  messages: Message[];
  lastMessageAt?: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  conversationId: string;
  userId: string;
  user?: User;
  joinedAt: string;
  lastReadAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  imageUrl?: string;
  readBy: string[];
  createdAt: string;
}
