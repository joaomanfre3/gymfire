import type { Comment } from '../components/Post/types';

type Listener = {
  onUpdate?: (c: Comment) => void;
  onAdd?: (c: Comment) => void;
  onRemove?: (id: string, postId: string, replyToId?: string) => void;
  onReplace?: (tempId: string, real: Comment) => void;
};

const listeners = new Set<Listener>();

export const commentEvents = {
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
  update: (c: Comment) => listeners.forEach((l) => l.onUpdate?.(c)),
  add: (c: Comment) => listeners.forEach((l) => l.onAdd?.(c)),
  remove: (id: string, postId: string, replyToId?: string) =>
    listeners.forEach((l) => l.onRemove?.(id, postId, replyToId)),
  replace: (tempId: string, real: Comment) =>
    listeners.forEach((l) => l.onReplace?.(tempId, real)),
};
