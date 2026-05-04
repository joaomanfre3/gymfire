import type { CropResult } from '../../components/Cropper';

export interface PostImage {
  id: string;
  originalUri: string;
  cropped: CropResult;
  cropState?: {
    scale: number;
    translateX: number;
    translateY: number;
  };
}

export interface TaggedUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

export type PostVisibility = 'public' | 'friends' | 'private';

export interface CreatePostPayload {
  images: PostImage[];
  caption: string;
  taggedUserIds: string[];
  visibility: PostVisibility;
}
