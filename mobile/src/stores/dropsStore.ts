import { create } from 'zustand';

interface DropsState {
  isDropsOpen: boolean;
  setDropsOpen: (open: boolean) => void;
}

export const useDropsStore = create<DropsState>((set) => ({
  isDropsOpen: false,
  setDropsOpen: (open) => set({ isDropsOpen: open }),
}));
