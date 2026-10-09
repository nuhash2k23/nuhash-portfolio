/**
 * One place for every scroll timing in the hero → door journey (0..1 of the journey section).
 * The WebGL scene and the DOM overlays both read from here, so they stay in sync.
 */
export const T = {
  heroOut: [0.02, 0.12] as const, // eyebrow, bar and portrait leave
  nameSplit: [0.0, 0.16] as const, // NUHASH slides left, JOBAYED slides right
  grow: [0.03, 0.17] as const, // rock swells and glitters harder
  explode: 0.17, // rock breaks
  scatter: [0.17, 0.32] as const, // pieces fly to the sphere / drift down the river
  dissolve: [0.27, 0.41] as const, // aurora burns away bottom → top
  dark: [0.36, 0.48] as const, // cursor becomes a light
  river: [0.4, 0.54] as const,
  introIn: [0.37, 0.43] as const,
  introWords: [0.41, 0.56] as const,
  introOut: [0.58, 0.63] as const,
  door: [0.5, 0.62] as const, // door appears on the horizon
  flight: [0.6, 0.985] as const, // camera path to the door
  lines: [
    [0.65, 0.74],
    [0.75, 0.84],
    [0.85, 0.93],
  ] as const,
  whiteout: [0.955, 0.995] as const,
};

/** Journey height in viewport heights. */
export const JOURNEY_VH = { desktop: 900, mobile: 650, reduced: 320 };
