'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { live } from '@/lib/state';
import { withScreenDissolve } from '@/lib/diamond';
import { T, dissolveAt } from '@/lib/timeline';
import { snoise } from '@/lib/shaders';
import { easeInOutCubic, easeOutExpo, mulberry32, range } from '@/lib/geometry';
import type { ScreenBurn } from '@/components/three/Crystal';

/**
 * The real Blender rock, loaded from /public/models/rock.glb — WITH ITS OWN MATERIALS.
 *
 * Unlike a geometry-only loader, this keeps the GLB's authored look: every mesh keeps
 * the material you exported from Blender (PBR colour, metalness/roughness, textures).
 * Objects whose name contains "ring" (case-insensitive) are treated as emissive glow
 * rings — their emissive is pushed to a hot red so they read as glowing.
 *
 *   <RockModel/>   — the whole model, drop it anywhere (hero, footer, a card).
 *   <DiamondRock/> — hero drop-in for <Diamond/>: grow → tremble → burst → scatter → dissolve.
 *
 * Put your export at:  public/models/rock.glb   (a single .glb, textures embedded)
 *
 * NOTE ON BLOOM: a real glow/bloom halo needs a post-process bloom pass, which this project
 * does not have yet. The rings are pushed to HDR-bright emissive here so they glow under
 * ACES tone mapping, but for a true soft bloom you need @react-three/postprocessing
 * (<EffectComposer><Bloom/>) or a manual UnrealBloomPass. Ask me to wire that in.
 */

const ROCK_URL = '/models/rock.glb';

/** red glow for the ring objects — HDR values (>1) so ACES tone-maps them to a hot bloom-ready colour */
const RING_GLOW = new THREE.Color(4.0, 0.25, 0.08);

const isRing = (name: string) => /ring/i.test(name);

/**
 * Clone the whole GLB scene, normalise it to ~2 units tall and centred, keep every real
 * material, brand the ring objects as glowing, and (optionally) add the burn dissolve to
 * every mesh so the whole model burns into black on the shared flame front.
 */
function usePreparedRock(burn: ScreenBurn | undefined, key: string) {
  const gltf = useLoader(GLTFLoader, ROCK_URL);
  return useMemo(() => {
    const root = gltf.scene.clone(true);

    // normalise: longest side → 2 units (matches the crystal's footprint), then centre at origin.
    const box0 = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box0.getSize(size);
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const norm = 2 / maxAxis;
    root.scale.multiplyScalar(norm);

    // recentre using the bounding box measured AFTER scaling (so offset is in the scaled space)
    root.updateMatrixWorld(true);
    const box1 = new THREE.Box3().setFromObject(root);
    const centre = new THREE.Vector3();
    box1.getCenter(centre);
    root.position.sub(centre);

    // holder keeps a clean parent group to attach to the scene
    const holder = new THREE.Group();
    holder.add(root);

    const ringMeshes: THREE.Mesh[] = [];
    const allMaterials: THREE.Material[] = [];

    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const ring = isRing(m.name) || isRing(m.parent?.name ?? '');

      // keep the authored material, but clone it so two <RockModel>s don't share state,
      // then brand rings and add the dissolve
      const src = m.material as THREE.Material | THREE.Material[];
      const brand = (mat: THREE.Material) => {
        const c = mat.clone();
        if (ring && 'emissive' in c) {
          (c as THREE.MeshStandardMaterial).emissive = RING_GLOW.clone();
          (c as THREE.MeshStandardMaterial).emissiveIntensity = 1;
          (c as THREE.MeshStandardMaterial).toneMapped = true;
        }
        if (burn) withScreenDissolve(c, burn, snoise, `${key}-${c.uuid}`);
        allMaterials.push(c);
        return c;
      };
      m.material = Array.isArray(src) ? src.map(brand) : brand(src);
      if (ring) ringMeshes.push(m);
    });

    return { holder, ringMeshes, allMaterials };
  }, [gltf, burn, key]);
}

/* ================================================================== */
/*  Standalone rock — the whole model with its real materials          */
/* ================================================================== */
export function RockModel({
  burn,
  scale = 1,
  spin = 0.15,
  ringPulse = true,
}: {
  /** share the scene's burn front so this rock dissolves with everything else */
  burn?: ScreenBurn;
  scale?: number;
  /** idle y-spin, rad/sec */
  spin?: number;
  /** gently pulse the ring glow */
  ringPulse?: boolean;
}) {
  const { holder, ringMeshes, allMaterials } = usePreparedRock(burn, 'rockmodel');
  const ref = useRef<THREE.Group>(null);

  useEffect(
    () => () => {
      allMaterials.forEach((m) => m.dispose());
    },
    [allMaterials],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    if (ref.current) ref.current.rotation.y += dt * spin;
    if (ringPulse) {
      const beat = 1 + Math.sin(state.clock.elapsedTime * 2.0) * 0.35;
      ringMeshes.forEach((rm) => {
        const mat = rm.material as THREE.MeshStandardMaterial;
        if (mat && 'emissiveIntensity' in mat) mat.emissiveIntensity = beat;
      });
    }
  });

  return (
    <group ref={ref} scale={scale}>
      <primitive object={holder} />
    </group>
  );
}

/* ================================================================== */
/*  Full hero replacement for <Diamond/> — real rock + its rings       */
/*  grow → tremble → burst → scatter → dissolve                        */
/* ================================================================== */
type Frag = {
  start: THREE.Vector3;
  target: THREE.Vector3;
  scale: THREE.Vector3;
  rot: THREE.Euler;
  spin: THREE.Vector3;
  phase: number;
};

const HERO_SCALE = 0.78;

export function DiamondRock({ lowPower }: { lowPower: boolean }) {
  const COUNT = lowPower ? 60 : 130;
  const fragRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const holderRef = useRef<THREE.Group>(null);
  const stoneRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);

  // one burn front shared by the whole model AND the shards → they dissolve together
  const burn = useMemo<ScreenBurn>(
    () => ({
      uDissolve: { value: 0 },
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uAspect: { value: 1 },
    }),
    [],
  );

  const { holder, ringMeshes, allMaterials } = usePreparedRock(burn, 'diamondrock');

  // shards reuse the first solid (non-ring) mesh geometry from the model
  const shard = useMemo<{ geo: THREE.BufferGeometry | null; mat: THREE.Material | null }>(() => {
    let geo: THREE.BufferGeometry | null = null;
    let mat: THREE.Material | null = null;
    holder.traverse((o) => {
      if (geo) return;
      const m = o as THREE.Mesh;
      if (m.isMesh && m.geometry && !isRing(m.name)) {
        geo = m.geometry.clone();
        geo.scale(0.22, 0.22, 0.22);
        const src = Array.isArray(m.material) ? m.material[0] : m.material;
        mat = (src as THREE.Material).clone();
        withScreenDissolve(mat, burn, snoise, 'rock-shard');
      }
    });
    return { geo, mat };
  }, [holder, burn]);

  const frags = useMemo<Frag[]>(() => {
    const rnd = mulberry32(42);
    const list: Frag[] = [];
    for (let i = 0; i < COUNT; i++) {
      const dir = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
      const start = dir.clone().multiplyScalar(0.15 + Math.cbrt(rnd()) * 0.5);
      start.y *= 1.6;

      const distV = Math.pow(rnd(), 0.3) * 12.0 + 1.5;
      const dx = rnd() * 2 - 1;
      const dy = (rnd() * 2 - 1) * 0.7;
      const dz = -(rnd() * 0.6 + 0.4);
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const target = new THREE.Vector3(dx / len, dy / len, dz / len).multiplyScalar(distV);
      target.z -= rnd() * 22;
      const s = 0.5 + rnd() * 1.4;

      list.push({
        start,
        target,
        scale: new THREE.Vector3(s * (0.7 + rnd() * 0.6), s * (0.8 + rnd() * 0.7), s * (0.6 + rnd() * 0.5)),
        rot: new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28),
        spin: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.6),
        phase: rnd() * 6.28,
      });
    }
    return list;
  }, [COUNT]);

  useEffect(
    () => () => {
      allMaterials.forEach((m) => m.dispose());
      shard.geo?.dispose();
      shard.mat?.dispose();
    },
    [allMaterials, shard],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const p = live.journey;
    const grow = easeInOutCubic(range(p, T.grow[0], T.grow[1]));
    const exploded = p >= T.explode;
    const ex = easeOutExpo(range(p, T.scatter[0], T.scatter[1]));
    const burnt = dissolveAt(p);

    burn.uDissolve.value = burnt;
    burn.uTime.value = t;
    state.gl.getDrawingBufferSize(burn.uRes.value);
    burn.uAspect.value = state.size.width / Math.max(1, state.size.height);

    // ring glow heartbeat
    const beat = 1 + Math.sin(t * 2.0) * 0.35;
    ringMeshes.forEach((rm) => {
      const mat = rm.material as THREE.MeshStandardMaterial;
      if (mat && 'emissiveIntensity' in mat) mat.emissiveIntensity = beat;
    });

    const g = groupRef.current;
    if (g && !exploded) {
      // only the whole rock drifts/tilts; once it breaks the group freezes so the
      // flying shards don't get carried around by any parent rotation
      g.rotation.y += dt * 0.08;
      g.rotation.x += (live.mouse.y * 0.25 - g.rotation.x) * 0.04;
      g.rotation.z += (-live.mouse.x * 0.12 - 0.1 - g.rotation.z) * 0.04;
      g.position.y = Math.sin(t * 0.6) * 0.06 * (1 - ex);
    }
    const scl = HERO_SCALE * (1 + grow * 0.25);
    const hd = holderRef.current;
    if (hd) {
      hd.scale.setScalar(scl);
      const shake = grow > 0.8 ? (grow - 0.8) * 0.12 : 0;
      hd.position.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0);
    }
    if (stoneRef.current) stoneRef.current.visible = !exploded;

    if (flashRef.current) {
      const k = exploded ? Math.exp(-(p - T.explode) * 90) : 0;
      flashRef.current.intensity = k * 90;
    }

    const im = fragRef.current;
    if (!im) return;
    im.visible = exploded && burnt < 1;
    if (!im.visible) return;
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i];
      // outward scatter only — no time-driven spin or wobble, so scroll never rotates the shards
      tmp.copy(f.start).multiplyScalar(scl).lerp(f.target, ex);
      e.copy(f.rot); // keep each shard's fixed birth orientation, frozen
      q.setFromEuler(e);
      dummy.position.copy(tmp);
      dummy.quaternion.copy(q);
      dummy.scale.copy(f.scale).multiplyScalar(0.55 + 0.45 * ex + (1 - ex) * 0.55);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <group ref={holderRef}>
        <group ref={stoneRef}>
          <primitive object={holder} />
        </group>
      </group>
      {shard.geo && shard.mat && (
        <instancedMesh ref={fragRef} args={[shard.geo, shard.mat, COUNT]} frustumCulled={false} />
      )}
      <pointLight ref={flashRef} color="#ffd2b0" intensity={0} distance={14} decay={2} />
    </group>
  );
}