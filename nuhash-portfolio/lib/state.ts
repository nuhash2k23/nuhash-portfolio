'use client';
import { useSyncExternalStore } from 'react';

/**
 * Two kinds of shared state:
 * - `live`: mutable values read every frame by WebGL code (no React re-render).
 * - `createStore`: tiny subscribable stores for UI that must re-render.
 */

export const live = {
  /** Journey progress 0..1 (hero → door). */
  journey: 0,
  /** 0 = northern lights, 1 = fully dark scene (cursor becomes a light). */
  dark: 0,
  /** Pointer in normalised device coords (-1..1). */
  mouse: { x: 0, y: 0 },
  /** Pointer in pixels. */
  px: { x: 0, y: 0 },
  /** Smoothed pointer velocity in uv units per second. */
  vel: { x: 0, y: 0 },
  /** Page scroll 0..1. */
  scroll: 0,
  reducedMotion: false,
  lowPower: false,
};

type Listener = () => void;

export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set: (patch: Partial<T>) => {
      state = { ...state, ...patch };
      listeners.forEach((l) => l());
    },
    subscribe: (l: Listener) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export function useStore<T extends object, S>(
  store: ReturnType<typeof createStore<T>>,
  select: (s: T) => S,
): S {
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => select(store.get()),
  );
}

/** UI state */
export const ui = createStore({
  loaded: false, // loader finished (shutter opened)
  soundOn: false,
  section: 'hero',
  inDark: false, // cursor shows as a light bulb
  webgl: true, // false → static fallback
});

/** Loading registry: real progress of real tasks. */
const tasks = new Map<string, number>();
export const loading = createStore({ progress: 0, ready: false });

export function registerTask(name: string) {
  if (!tasks.has(name)) tasks.set(name, 0);
  recompute();
  return (value: number) => {
    tasks.set(name, Math.max(tasks.get(name) ?? 0, Math.min(1, value)));
    recompute();
  };
}

function recompute() {
  if (tasks.size === 0) return;
  let sum = 0;
  tasks.forEach((v) => (sum += v));
  const progress = sum / tasks.size;
  loading.set({ progress, ready: progress >= 1 });
}
