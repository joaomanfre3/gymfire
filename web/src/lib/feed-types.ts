export interface FeedAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  level: number;
}

export interface FeedWorkout {
  name: string;
  duration: string;
  volume?: string;
  sets?: number;
  exercises?: number;
  distance?: string;
  pace?: string;
  calories: number;
  avgBpm?: number;
}

export interface FeedPersonalRecord {
  exercise: string;
  newValue: string;
  previousValue: string;
  improvement: string;
}

export interface FeedEngagement {
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface FeedCommentPreview {
  username: string;
  text: string;
}

export interface FeedPost {
  id: string;
  author: FeedAuthor;
  type: 'workout' | 'run' | 'personal_record' | 'challenge' | 'photo' | 'text';
  content: {
    text: string;
    images?: string[];
  };
  workout?: FeedWorkout;
  personalRecord?: FeedPersonalRecord;
  location?: string;
  engagement: FeedEngagement;
  xpEarned: number;
  createdAt: string;
  commentPreview?: FeedCommentPreview;
}

export interface StoryUser {
  id: string;
  name: string;
  avatar: string;
  hasStory: boolean;
  seen: boolean;
}

export interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  mutualFollowers?: number;
}

export interface FeedChallenge {
  id: string;
  name: string;
  progress: number;
  participants: number;
}
