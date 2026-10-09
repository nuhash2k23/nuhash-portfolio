/**
 * The sci-fi crystal, as pure maths (no three.js) so it can be tested anywhere.
 *
 * A tall, hand-cut octagonal crystal, split in three floating sections:
 *
 *        /\        top     (spins one way)
 *       /  \
 *      /____\      ← seam 1: light leaks out of the gap
 *      |    |      body    (holds the glowing core)
 *      |____|      ← seam 2
 *       \  /       base    (spins the other way)
 *        \/
 *
 * Rings alternate their angle by half a step, so the faces become triangles
 * (brilliant-cut look) instead of plain quads.
 */

export const CRYSTAL_SIDES = 8;

type Ring = { y: number; r: number; half: 0 | 1 };

/** Profile from the top tip down. r = 0 → a tip. Edit to reshape the crystal. */
export const CRYSTAL_PROFILE = {
  top: [
    { y: 1.62, r: 0, half: 0 },
    { y: 1.12, r: 0.2, half: 0 },
    { y: 0.5, r: 0.46, half: 1 },
  ] as Ring[],
  body: [
    { y: 0.5, r: 0.46, half: 1 },
    { y: 0.08, r: 0.56, half: 0 },
    { y: -0.12, r: 0.56, half: 0 },
    { y: -0.42, r: 0.5, half: 1 },
  ] as Ring[],
  base: [
    { y: -0.42, r: 0.5, half: 1 },
    { y: -0.86, r: 0.26, half: 0 },
    { y: -1.36, r: 0, half: 0 },
  ] as Ring[],
};

/** The two cuts between the sections: where the light leaks out. */
export const CRYSTAL_SEAMS = [
  { y: 0.5, r: 0.46 },
  { y: -0.42, r: 0.5 },
];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type V3 = [number, number, number];

/** Hand-cut feel: every ring vertex is nudged a little. Same seed → same nudges for a shared ring. */
function ringVerts(ring: Ring, seed: number): V3[] {
  if (ring.r === 0) return [[0, ring.y, 0]];
  const rnd = rng(Math.round(ring.y * 1000) + seed * 7919);
  const out: V3[] = [];
  for (let k = 0; k < CRYSTAL_SIDES; k++) {
    const a = ((k + ring.half * 0.5) / CRYSTAL_SIDES) * Math.PI * 2 + (rnd() - 0.5) * 0.08;
    const r = ring.r * (0.95 + rnd() * 0.1);
    out.push([Math.cos(a) * r, ring.y + (rnd() - 0.5) * 0.03, Math.sin(a) * r]);
  }
  return out;
}

function pushTri(out: number[], a: V3, b: V3, c: V3) {
  // make sure the face points away from the crystal's axis
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3, cz = (a[2] + b[2] + c[2]) / 3;
  // outward = away from the axis sideways, or up/down for caps (handled by the caller's centre)
  const flip = nx * cx + nz * cz + ny * (cy - pushTri.centreY) < 0;
  if (flip) out.push(...a, ...c, ...b);
  else out.push(...a, ...b, ...c);
}
pushTri.centreY = 0;

/** One closed section: side faces between rings + flat caps where it was cut. */
function section(rings: Ring[], seed: number): Float32Array {
  const out: number[] = [];
  const verts = rings.map((r) => ringVerts(r, seed));
  pushTri.centreY = (rings[0].y + rings[rings.length - 1].y) / 2;

  for (let i = 0; i < rings.length - 1; i++) {
    const A = verts[i];
    const B = verts[i + 1];
    const n = CRYSTAL_SIDES;
    if (A.length === 1 || B.length === 1) {
      // tip → fan
      const tip = A.length === 1 ? A[0] : B[0];
      const ring = A.length === 1 ? B : A;
      for (let k = 0; k < n; k++) pushTri(out, tip, ring[k], ring[(k + 1) % n]);
    } else if (rings[i].half === rings[i + 1].half) {
      // same angle → a band of quads (two triangles each)
      for (let k = 0; k < n; k++) {
        const a0 = A[k], a1 = A[(k + 1) % n], b0 = B[k], b1 = B[(k + 1) % n];
        pushTri(out, a0, b0, b1);
        pushTri(out, a0, b1, a1);
      }
    } else {
      // half-step apart → antiprism band of triangles (the brilliant cut)
      const lowerIsShifted = rings[i + 1].half === 1;
      for (let k = 0; k < n; k++) {
        if (lowerIsShifted) {
          const a0 = A[k], a1 = A[(k + 1) % n], b0 = B[k], bp = B[(k - 1 + n) % n];
          pushTri(out, a0, a1, b0);
          pushTri(out, a0, b0, bp);
        } else {
          const b0 = B[k], b1 = B[(k + 1) % n], a0 = A[k], ap = A[(k - 1 + n) % n];
          pushTri(out, b0, b1, a0);
          pushTri(out, b0, a0, ap);
        }
      }
    }
  }

  // caps on the cut ends (flat, so they catch a sharp reflection)
  const cap = (ring: V3[], up: boolean) => {
    if (ring.length === 1) return;
    let cy = 0;
    ring.forEach((v) => (cy += v[1]));
    const c: V3 = [0, cy / ring.length, 0];
    for (let k = 0; k < ring.length; k++) {
      const a = ring[k], b = ring[(k + 1) % ring.length];
      // winding decides the cap normal: counter-clockwise seen from above → up
      if (up) out.push(...c, ...b, ...a);
      else out.push(...c, ...a, ...b);
    }
  };
  cap(verts[0], true);
  cap(verts[verts.length - 1], false);
  return new Float32Array(out);
}

/** Triangle soup (non-indexed, flat-shaded) for each section, in crystal space. */
export function buildCrystal(seed = 5) {
  return {
    top: section(CRYSTAL_PROFILE.top, seed),
    body: section(CRYSTAL_PROFILE.body, seed),
    base: section(CRYSTAL_PROFILE.base, seed),
  };
}
