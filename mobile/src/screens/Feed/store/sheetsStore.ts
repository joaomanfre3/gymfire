import { create } from 'zustand';
import type { Post } from '../../../components/Post/types';

type OpenSheet =
  | { type: 'comments'; postId: string }
  | { type: 'share'; postId: string }
  | { type: 'postMenu'; post: Post }
  | { type: 'reportPost'; postId: string }
  | null;

interface SheetsState {
  openSheet: OpenSheet;
  open: (sheet: NonNullable<OpenSheet>) => void;
  close: () => void;
}

export const useSheetsStore = create<SheetsState>((set) => ({
  openSheet: null,
  open: (sheet) => set({ openSheet: sheet }),
  close: () => set({ openSheet: null }),
}));
