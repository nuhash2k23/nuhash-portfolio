import * as THREE from 'three';

/** Seeded random so the rock looks the same on every load. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- small 3D value noise + fbm (CPU side, used for rock shape) ---
function hash3(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}
export function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  const l = THREE.MathUtils.lerp;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}
export function fbm3(x: number, y: number, z: number, oct = 4) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    v += a * noise3(x * f, y * f, z * f);
    f *= 2.03;
    a *= 0.5;
  }
  return v;
}

/**
 * Placeholder "alien rock": a displaced icosphere with hard facets.
 * Replace with your own Blender glb later (see README).
 */
export function createRockGeometry(detail = 4, seed = 7) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const off = seed * 3.17;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    // big lumps + sharp ridges
    const lumps = fbm3(v.x * 1.3 + off, v.y * 1.3, v.z * 1.3, 3);
    const ridge = 1 - Math.abs(noise3(v.x * 4 + off, v.y * 4, v.z * 4) * 2 - 1);
    const r = 0.78 + lumps * 0.45 + ridge * 0.08;
    // slightly elongated, tilted mass
    v.multiplyScalar(r);
    v.y *= 1.12;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  const flat = geo.toNonIndexed();
  flat.computeVertexNormals(); // non-indexed → faceted, diamond-like
  geo.dispose();
  return flat;
}

/**
 * Rough-cut gemstone: few, large facets so light breaks cleanly through it.
 * Replace with your own Blender glb later.
 */
export function createGemGeometry(seed = 7) {
  const rnd = mulberry32(seed);
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const cache = new Map<string, THREE.Vector3>();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${v.x.toFixed(3)}|${v.y.toFixed(3)}|${v.z.toFixed(3)}`;
    let j = cache.get(key);
    if (!j) {
      j = v.clone().normalize().multiplyScalar(0.84 + rnd() * 0.3);
      j.y *= 1.18; // a little taller than wide
      j.x *= 0.95;
      cache.set(key, j);
    }
    pos.setXYZ(i, j.x, j.y, j.z);
  }
  const flat = geo.index ? geo.toNonIndexed() : geo;
  flat.computeVertexNormals();
  return flat;
}

/** One chunky shard; instanced and scaled non-uniformly so every piece reads different. */
export function createShardGeometry(seed = 3) {
  const rnd = mulberry32(seed);
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  // Jitter shared vertices identically (positions are duplicated per face in this geometry).
  const cache = new Map<string, THREE.Vector3>();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${v.x.toFixed(3)}|${v.y.toFixed(3)}|${v.z.toFixed(3)}`;
    let j = cache.get(key);
    if (!j) {
      j = v.clone().multiplyScalar(0.7 + rnd() * 0.6);
      cache.set(key, j);
    }
    pos.setXYZ(i, j.x, j.y, j.z);
  }
  const flat = geo.index ? geo.toNonIndexed() : geo;
  flat.computeVertexNormals();
  return flat;
}

/** Evenly spread directions on a sphere. */
export function fibonacciSphere(i: number, n: number, out = new THREE.Vector3()) {
  const y = 1 - (i / Math.max(1, n - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const phi = i * Math.PI * (3 - Math.sqrt(5));
  return out.set(Math.cos(phi) * r, y, Math.sin(phi) * r);
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Map x from [a,b] to [0,1], clamped. */
export const range = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
