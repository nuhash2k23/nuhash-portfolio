/**
 * One place for every scroll timing in the hero → door journey (0..1 of the journey section).
 * The WebGL scene, the DOM overlays and the sound all read from here, so they stay in sync.
 */
export const T = {
  heroOut: [0.02, 0.12] as const, // eyebrow, bar and video tile leave
  nameSplit: [0.0, 0.16] as const, // NUHASH slides left, JOBAYED slides right
  grow: [0.03, 0.17] as const, // the crystal charges: seams open, rings spin up
  explode: 0.17, // it breaks
  scatter: [0.17, 0.33] as const, // shards fly to the sphere / drift over the river
  dissolve: [0.27, 0.41] as const, // the lights burn away bottom → top
  dark: [0.36, 0.48] as const, // cursor becomes the orb
  river: [0.4, 0.54] as const,
  introIn: [0.37, 0.43] as const,
  introWords: [0.41, 0.55] as const,
  introOut: [0.56, 0.6] as const,
  door: [0.5, 0.62] as const, // door appears on the horizon
  flight: [0.58, 0.985] as const, // camera path to the door
  lines: [
    [0.62, 0.71],
    [0.71, 0.8],
    [0.8, 0.88],
  ] as const,
  collectOut: [0.92, 0.95] as const, // the collected red words leave before the door
  riser: 0.86, // sound swell toward the door
  whiteout: [0.955, 0.995] as const,
};

/** Bottom → top burn. The aurora AND the shards read this one value, so they burn together. */
export const dissolveAt = (p: number) => {
  const t = Math.min(1, Math.max(0, (p - T.dissolve[0]) / (T.dissolve[1] - T.dissolve[0])));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
};

/** Journey height in viewport heights. Longer = slower, calmer camera. */
export const JOURNEY_VH = { desktop: 1150, mobile: 760, reduced: 320 };
