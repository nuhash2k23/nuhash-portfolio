'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { live } from '@/lib/state';
import { createDiamondMaterial, withScreenDissolve } from '@/lib/diamond';
import { T, dissolveAt } from '@/lib/timeline';
import { snoise } from '@/lib/shaders';
import { createShardGeometry, easeInOutCubic, easeOutExpo, fibonacciSphere, mulberry32, range } from '@/lib/geometry';
import Crystal, { type CrystalDrive, type ScreenBurn } from '@/components/three/Crystal';

/**
 * CRYSTAL hero rig — the procedural sci-fi crystal + its shards, self-contained.
 *
 * Scroll timeline: grow → tremble → burst → scatter → dissolve.
 * After the explosion the shards FLY OUT ONCE, then gently float (slow drift, NO spin,
 * NO vibration); the parent group freezes so scroll never rotates the cloud. Rings and
 * shards burn into black on the shared flame front.
 *
 * Swap <Diamond/> for <CrystalRig/> in JourneyScene's Scene().
 */

const HERO_SCALE = 0.78;

type Frag = {
  start: THREE.Vector3;
  target: THREE.Vector3;
  scale: THREE.Vector3;
  rot: THREE.Euler; // fixed birth orientation — frozen, never animated
  phase: number;
};

export function CrystalRig({ lowPower }: { lowPower: boolean }) {
  const COUNT = lowPower ? 40 : 110;
  const fragRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const holder = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const { camera } = useThree();

  const shardGeo = useMemo(() => createShardGeometry(11), []);
  const burn = useMemo<ScreenBurn>(
    () => ({
      uDissolve: { value: 0 },
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uAspect: { value: 1 },
    }),
    [],
  );
  const shardMat = useMemo(() => {
    const m = createDiamondMaterial({ dispersion: 1, thickness: 0.4 });
    m.emissive = new THREE.Color('#000000');
    return withScreenDissolve(m, burn, snoise, 'crystal-shard-burn');
  }, [burn]);

  const frags = useMemo<Frag[]>(() => {
    const rnd = mulberry32(92);
    const list: Frag[] = [];
    const sphereCount = Math.floor(COUNT * .4);
    for (let i = 0; i < COUNT; i++) {
      const dir = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
      const start = dir.clone().multiplyScalar(0.15 + Math.cbrt(rnd()) * 0.5);
      start.y *= 2;
      let target: THREE.Vector3;
      let s: number;
      if (i < sphereCount) {
        target = fibonacciSphere(i, sphereCount).multiplyScalar(2.6);
        s = 0.08 + rnd() * 0.12;
      } else {
        target = new THREE.Vector3((rnd() * 2 - 1) * 6, -0.6 + rnd() * 3.8, 1 - rnd() * 34);
        s = 0.1 + rnd() * 0.4;
      }
      list.push({
        start,
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
      shardGeo.dispose();
      shardMat.dispose();
    },
    [shardGeo, shardMat],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const scr = useMemo(() => new THREE.Vector3(), []);
  const hover = useRef(0);

  const d = useMemo<CrystalDrive>(() => ({ charge: 0, hover: 0, burst: 0, whole: true, fadeIn: 1 }), []);
  const drive = () => {
    const p = live.journey;
    d.charge = easeInOutCubic(range(p, T.grow[0], T.grow[1]));
    d.whole = p < T.explode;
    d.burst = range(p, T.explode, T.explode + 0.07);
    d.hover = hover.current;
    d.fadeIn = 1; // rings present from the start; the dissolve removes them
    return d;
  };

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
    shardMat.envMapIntensity = 2 * (1 - live.dark * 0.18);

    // cursor on the crystal? (pre-explosion only)
    scr.set(0, 0, 0).project(camera);
    const dist = Math.hypot(live.mouse.x - scr.x, (live.mouse.y - scr.y) / Math.max(0.5, state.size.width / state.size.height));
    const on = !exploded && p < 0.1 && dist < 0.22 ? 1 : 0;
    hover.current += (on - hover.current) * (1 - Math.pow(0.004, dt));

    // whole crystal drifts/tilts ONLY before it breaks; freezes at explosion
    const g = groupRef.current;
    if (g && !exploded) {
      g.rotation.y += dt * 0.08;
      g.rotation.x += (live.mouse.y * 0.25 - g.rotation.x) * 0.04;
      g.rotation.z += (-live.mouse.x * 0.12 - 0.1 - g.rotation.z) * 0.04;
      g.position.y = Math.sin(t * 0.6) * 0.06;
    }
    const scale = HERO_SCALE * (1 + grow * 0.25);
    const hd = holder.current;
    if (hd) {
      hd.scale.setScalar(scale);
      const shake = grow > 0.8 ? (grow - 0.8) * 0.12 : 0;
      hd.position.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0);
    }

    if (flashRef.current) {
      const k = exploded ? Math.exp(-(p - T.explode) * 90) : 0;
      flashRef.current.intensity = k * 90;
    }

    const im = fragRef.current;
    if (!im) return;
    im.visible = exploded && burnt < 1;
    if (!im.visible) return;
    // gentle float only once fully scattered — tiny amplitude, no spin, no vibration
    const floatAmt = range(p, T.scatter[1], T.scatter[1] + 0.25);
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i];
      tmp.copy(f.start).multiplyScalar(scale).lerp(f.target, ex);
      tmp.y += Math.sin(t * 0.3 + f.phase) * 0.08 * floatAmt;
      tmp.x += Math.cos(t * 0.22 + f.phase) * 0.06 * floatAmt;
      e.copy(f.rot); // frozen orientation
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
      <group ref={holder}>
        <Crystal drive={drive} lowPower={lowPower} burn={burn} />
      </group>
      <instancedMesh ref={fragRef} args={[shardGeo, shardMat, COUNT]} frustumCulled={false} />
      <pointLight ref={flashRef} color="#ffd2b0" intensity={0} distance={14} decay={2} />
    </group>
  );
}
