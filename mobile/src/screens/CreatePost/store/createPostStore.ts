import { create } from 'zustand';
import type { PostImage, TaggedUser, PostVisibility } from '../types';

interface CreatePostState {
  images: PostImage[];
  caption: string;
  taggedUsers: TaggedUser[];
  visibility: PostVisibility;
  isSubmitting: boolean;
  error: string | null;

  addImage: (img: PostImage) => boolean;
  removeImage: (id: string) => void;
  updateImage: (id: string, patch: Partial<PostImage>) => void;
  reorderImages: (from: number, to: number) => void;
  setCaption: (text: string) => void;
  toggleTaggedUser: (user: TaggedUser) => void;
  removeTaggedUser: (id: string) => void;
  setVisibility: (v: PostVisibility) => void;
  setSubmitting: (b: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const INITIAL = {
  images: [] as PostImage[],
  caption: '',
  taggedUsers: [] as TaggedUser[],
  visibility: 'public' as PostVisibility,
  isSubmitting: false,
  error: null as string | null,
};

export const useCreatePostStore = create<CreatePostState>((set, get) => ({
  ...INITIAL,

  addImage: (img) => {
    if (get().images.length >= 10) return false;
    set((s) => ({ images: [...s.images, img] }));
    return true;
  },

  removeImage: (id) => {
    set((s) => ({ images: s.images.filter((i) => i.id !== id) }));
  },

  updateImage: (id, patch) => {
    set((s) => ({
      images: s.images.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  },

  reorderImages: (from, to) => {
    set((s) => {
      const arr = [...s.images];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { images: arr };
    });
  },

  setCaption: (text) => set({ caption: text }),

  toggleTaggedUser: (user) => {
    set((s) => {
      const exists = s.taggedUsers.find((u) => u.id === user.id);
      if (exists) return { taggedUsers: s.taggedUsers.filter((u) => u.id !== user.id) };
      return { taggedUsers: [...s.taggedUsers, user] };
    });
  },

  removeTaggedUser: (id) => {
    set((s) => ({ taggedUsers: s.taggedUsers.filter((u) => u.id !== id) }));
  },

  setVisibility: (v) => set({ visibility: v }),
  setSubmitting: (b) => set({ isSubmitting: b }),
  setError: (msg) => set({ error: msg }),
  reset: () => set(INITIAL),
}));
