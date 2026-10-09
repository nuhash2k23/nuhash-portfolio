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
 * ROCK hero rig — the real Blender rock from /public/models/rock.glb.
 *
 * Self-contained drop-in for the scene: renders the whole GLB with its OWN materials,
 * finds the "ring"-named objects and makes them glow hot red, and on scroll does a
 * SUBTLE, fractional shatter — only a small handful of chunks break off and FLOAT
 * (no spin, no vibration). Everything burns into black on the shared dissolve front.
 *
 * Swap <Diamond/> for <RockRig/> in JourneyScene's Scene().
 *
 * Bloom note: a true soft glow halo needs a post-process bloom pass (not in this project
 * yet). Rings use HDR-bright emissive so they read hot under ACES. Ask to wire in bloom.
 */

const ROCK_URL = '/models/rock.glb';
const HERO_SCALE = 1.4;

/** hot red for ring objects — HDR (>1) so ACES tone-maps it to a glowing colour */
const RING_GLOW = new THREE.Color(4.0, 0.25, 0.08);
const isRing = (name: string) => /ring/i.test(name);

type Chunk = {
  target: THREE.Vector3; // where it floats to after breaking off
  scale: THREE.Vector3;
  rot: THREE.Euler; // fixed birth orientation, never animated
  phase: number;
};

export function RockRig({ lowPower }: { lowPower: boolean }) {
  // FRACTIONAL shatter: only a few chunks, not a full blast
  const COUNT = lowPower ? 10 : 18;
  const gltf = useLoader(GLTFLoader, ROCK_URL);

  const groupRef = useRef<THREE.Group>(null);
  const holderRef = useRef<THREE.Group>(null);
  const stoneRef = useRef<THREE.Group>(null);
  const chunkRef = useRef<THREE.InstancedMesh>(null);

  // one burn front shared by the whole rock AND the chunks → dissolve together
  const burn = useMemo<ScreenBurn>(
    () => ({
      uDissolve: { value: 0 },
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uAspect: { value: 1 },
    }),
    [],
  );

  // clone the GLB, normalise to ~2 units, keep real materials, brand rings, add dissolve
  const prepared = useMemo(() => {
    const root = gltf.scene.clone(true);

    const box0 = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box0.getSize(size);
    const norm = 2 / (Math.max(size.x, size.y, size.z) || 1);
    root.scale.multiplyScalar(norm);
    root.updateMatrixWorld(true);
    const box1 = new THREE.Box3().setFromObject(root);
    const centre = new THREE.Vector3();
    box1.getCenter(centre);
    root.position.sub(centre);

    const holder = new THREE.Group();
    holder.add(root);

    const ringMeshes: THREE.Mesh[] = [];
    const materials: THREE.Material[] = [];
    let solidGeo: THREE.BufferGeometry | null = null;
    let solidMat: THREE.Material | null = null;

    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const ring = isRing(m.name) || isRing(m.parent?.name ?? '');
      const src = Array.isArray(m.material) ? m.material : [m.material];
      const branded = src.map((mm) => {
        const c = (mm as THREE.Material).clone();
        if (ring && 'emissive' in c) {
          (c as THREE.MeshStandardMaterial).emissive = RING_GLOW.clone();
          (c as THREE.MeshStandardMaterial).emissiveIntensity = 1;
        }
        withScreenDissolve(c, burn, snoise, `rockrig-${c.uuid}`);
        materials.push(c);
        return c;
      });
      m.material = branded.length === 1 ? branded[0] : branded;
      if (ring) ringMeshes.push(m);
      else if (!solidGeo) {
        solidGeo = m.geometry.clone();
        solidGeo.scale(0.18, 0.18, 0.18); // small chunks
        solidMat = (branded[0] as THREE.Material).clone();
        withScreenDissolve(solidMat, burn, snoise, 'rockrig-chunk');
      }
    });

    return { holder, ringMeshes, materials, solidGeo, solidMat };
  }, [gltf, burn]);

  // where the few chunks float to — gentle, close-in, no deep scatter
  const chunks = useMemo<Chunk[]>(() => {
    const rnd = mulberry32(7);
    const list: Chunk[] = [];
    for (let i = 0; i < COUNT; i++) {
      const dir = new THREE.Vector3(rnd() * 2 - 1, (rnd() * 2 - 1) * 0.8, rnd() * 2 - 1).normalize();
      const dist = 1.2 + rnd() * 2.2; // stay near the rock, not flung far
      const target = dir.multiplyScalar(dist);
      const s = 0.6 + rnd() * 1.1;
      list.push({
        target,
        scale: new THREE.Vector3(s * (0.7 + rnd() * 0.6), s * (0.8 + rnd() * 0.7), s * (0.6 + rnd() * 0.5)),
        rot: new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28),
        phase: rnd() * 6.28,
      });
    }
    return list;
  }, [COUNT]);

  useEffect(
    () => () => {
      prepared.materials.forEach((m) => m.dispose());
      // prepared.solidGeo?.dispose();
      // prepared.solidMat?.dispose();
    },
    [prepared],
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

    // ring glow heartbeat (emissive only — no geometry movement)
    const beat = 1 + Math.sin(t * 2.0) * 0.3;
    prepared.ringMeshes.forEach((rm) => {
      const mat = rm.material as THREE.MeshStandardMaterial;
      if (mat && 'emissiveIntensity' in mat) mat.emissiveIntensity = beat;
    });

    // whole rock drifts/tilts ONLY before it breaks; freezes at explosion
    const g = groupRef.current;
    if (g && !exploded) {
      g.rotation.y += dt * 0.08;
      g.rotation.x += (live.mouse.y * 0.2 - g.rotation.x) * 0.04;
      g.rotation.z += (-live.mouse.x * 0.1 - 0.05 - g.rotation.z) * 0.04;
      g.position.y = Math.sin(t * 0.6) * 0.05;
    }
    const scl = HERO_SCALE * (1 + grow * 0.25);
    const hd = holderRef.current;
    if (hd) hd.scale.setScalar(scl);
    if (stoneRef.current) stoneRef.current.visible = !exploded;

    const im = chunkRef.current;
    if (!im || !prepared.solidGeo) return;
    im.visible = exploded && burnt < 1;
    if (!im.visible) return;
    // gentle float drift AFTER they've settled — tiny, smooth, no spin, no vibration
    const floatAmt = range(p, T.scatter[1], T.scatter[1] + 0.25);
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      tmp.copy(c.target).multiplyScalar(ex);
      // suspended float: slow sine offsets, tiny amplitude, only once fully scattered
      tmp.y += Math.sin(t * 0.3 + c.phase) * 0.08 * floatAmt;
      tmp.x += Math.cos(t * 0.22 + c.phase) * 0.06 * floatAmt;
      e.copy(c.rot); // frozen orientation — never rotates
      q.setFromEuler(e);
      dummy.position.copy(tmp);
      dummy.quaternion.copy(q);
      dummy.scale.copy(c.scale).multiplyScalar(0.6 + 0.4 * ex);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <group ref={holderRef}>
        <group ref={stoneRef}>
          <primitive object={prepared.holder} />
        </group>
      </group>
      {prepared.solidGeo && prepared.solidMat && (
        <instancedMesh ref={chunkRef} args={[prepared.solidGeo, prepared.solidMat, COUNT]} frustumCulled={false} />
      )}
    </group>
  );
}
