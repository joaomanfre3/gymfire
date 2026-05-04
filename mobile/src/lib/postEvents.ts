import type { Post } from '../components/Post/types';

export type PostEvent =
  | { type: 'update'; post: Post }
  | { type: 'remove'; postId: string }
  | { type: 'add'; post: Post; prepend?: boolean };

type Listener = (event: PostEvent) => void;
const listeners = new Set<Listener>();

export const postEvents = {
  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  emit: (event: PostEvent) => listeners.forEach((fn) => fn(event)),
};
