'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createDiamondMaterial, withScreenDissolve } from '@/lib/diamond';
import { buildCrystal, CRYSTAL_SEAMS } from '@/lib/crystalShape';
import { snoise } from '@/lib/shaders';

/** Same screen-space burn edge the hero shards use — lets the rings dissolve into black with them. */
export type ScreenBurn = {
  uDissolve: THREE.IUniform<number>;
  uTime: THREE.IUniform<number>;
  uRes: THREE.IUniform<THREE.Vector2>;
  uAspect: THREE.IUniform<number>;
};

/**
 * The sci-fi crystal, shared by the hero and the footer.
 *
 *  - three floating, counter-rotating sections of real refracting diamond
 *  - a burning core inside, seen through the glass
 *  - light leaking out of the two seams
 *  - glowing cut lines with a scan band running over them
 *  - two orbiting tube rings (made of diamond) that animate continuously
 *
 * The parent drives it every frame through `drive()`:
 *   charge 0..1  → gaps open, everything spins faster and burns brighter
 *   hover  0..1  → cursor is on it: the orbiting rings glow brightly (main crystal remains stable)
 *   burst  0..1  → after the explosion: the rings fly outward as a shockwave
 *   whole        → false hides the stone itself (the parent shows the shards instead)
 *   fadeIn 0..1  → rings scale in as the dissolve begins; the burn front then eats them away
 *
 * When the parent passes `burn`, the ring materials share that screen-space flame and
 * dissolve into black edge-first — exactly like the shards — instead of just shrinking.
 */
export type CrystalDrive = { charge: number; hover: number; burst: number; whole: boolean; fadeIn: number };

const ORANGE = new THREE.Color('#ff5a1f');
const HOT = new THREE.Color('#ffd2b0');

const seamFrag = /* glsl */ `
uniform float uIntensity;
uniform vec3 uColor;
uniform vec3 uHot;
varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, d);
  vec3 col = mix(uColor, uHot, pow(a, 4.0));
  gl_FragColor = vec4(col * a * a * uIntensity, 1.0);
}`;
const uvVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const lineVert = /* glsl */ `
varying float vY;
void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const lineFrag = /* glsl */ `
uniform float uScan;
uniform float uIntensity;
uniform vec3 uColor;
varying float vY;
void main(){
  float band = exp(-pow((vY - uScan) / 0.1, 2.0));
  float a = (0.14 + band * 1.2) * uIntensity;
  gl_FragColor = vec4(uColor * a, 1.0);
}`;

const additive = (fragmentShader: string, vertexShader: string, uniforms: Record<string, THREE.IUniform>) =>
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });

export default function Crystal({
  drive,
  lowPower = false,
  burn,
}: {
  drive: () => CrystalDrive;
  lowPower?: boolean;
  /** When supplied, the rings share this burn front and dissolve into black with the shards. */
  burn?: ScreenBurn;
}) {
  const top = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const base = useRef<THREE.Group>(null);
  const stone = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const coreLight = useRef<THREE.PointLight>(null);
  const seams = useRef<(THREE.Mesh | null)[]>([]);

  const rings = useRef<THREE.Group>(null);
  const ring1Pivot = useRef<THREE.Group>(null);
  const ring2Pivot = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);

  /* ---------- geometry ---------- */
  const geo = useMemo(() => {
    const b = buildCrystal(6);
    const mk = (arr: Float32Array) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      g.computeVertexNormals();
      return g;
    };
    const parts = { top: mk(b.top), body: mk(b.body), base: mk(b.base) };
    const edges = {
      top: new THREE.EdgesGeometry(parts.top, 10),
      body: new THREE.EdgesGeometry(parts.body, 10),
      base: new THREE.EdgesGeometry(parts.base, 10),
    };
    const seam = new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2);
    const coreOuter = new THREE.OctahedronGeometry(0.17, 0);
    const coreInner = new THREE.IcosahedronGeometry(0.075, 0);

    const tubularSegs = lowPower ? 64 : 128;
    const radialSegs = lowPower ? 16 : 32;
    const ring1 = new THREE.TorusGeometry(1.28, 0.025, radialSegs, tubularSegs);
    const ring2 = new THREE.TorusGeometry(1.46, 0.035, radialSegs, tubularSegs);

    return { parts, edges, seam, coreOuter, coreInner, ring1, ring2 };
  }, [lowPower]);

  /* ---------- materials ---------- */
  const mat = useMemo(() => {
    const glass = createDiamondMaterial({ dispersion: .7, thickness: .14 });
    const ringGlass = createDiamondMaterial({ dispersion: .6, thickness: 0.2 });
    // rings burn into black with the shards when the scene hands us its burn front
    if (burn) withScreenDissolve(ringGlass, burn, snoise, 'ring-glass-burn');

    const coreOuter = new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(20.2), toneMapped: false });
    const coreInner = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4, 3.4), toneMapped: false });
    const seam = additive(seamFrag, uvVert, {
      uIntensity: { value: 1 },
      uColor: { value: ORANGE },
      uHot: { value: HOT },
    });
    const line = additive(lineFrag, lineVert, {
      uScan: { value: 0 },
      uIntensity: { value: 1 },
      uColor: { value: new THREE.Color('#ff9041') },
    });

    const ringGlow = new THREE.MeshBasicMaterial({
      color: HOT,
      transparent: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: true,
    });
    // the glow halo discards behind the same burn front (no rim — MeshBasic has no emissive slot)
    if (burn) withScreenDissolve(ringGlow, burn, snoise, 'ring-glow-burn');

    return { glass, ringGlass, coreOuter, coreInner, seam, line, ringGlow };
  }, [burn]);

  useEffect(
    () => () => {
      Object.values(geo.parts).forEach((g) => g.dispose());
      Object.values(geo.edges).forEach((g) => g.dispose());
      [geo.seam, geo.coreOuter, geo.coreInner, geo.ring1, geo.ring2].forEach((g) => g.dispose());
      Object.values(mat).forEach((m) => m.dispose());
    },
    [geo, mat],
  );

  const spin = useRef({ top: 0, body: 0, base: 0, ring1: 0, ring2: 0, scan: -1.6 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const d = drive();
    const c = d.charge;
    const h = d.hover;
    const fi = d.fadeIn ?? 1; // 0→1 ease-in after dissolve starts
    const sp = spin.current;

    /* the stone */
    if (stone.current) stone.current.visible = d.whole;
    if (d.whole) {
      sp.top += dt * (0.22 + c * 2.2);
      sp.body += dt * (0.05 + c * 0.4);
      sp.base -= dt * (0.16 + c * 1.8);

      const gap = 0.045 + c * 0.14 + Math.sin(t * 1.4) * 0.008;
      if (top.current) {
        top.current.rotation.y = sp.top;
        top.current.position.y = gap;
      }
      if (body.current) body.current.rotation.y = sp.body;
      if (base.current) {
        base.current.rotation.y = sp.base;
        base.current.position.y = -gap;
      }
      seams.current.forEach((m, i) => {
        if (!m) return;
        m.position.y = CRYSTAL_SEAMS[i].y + (i === 0 ? gap * 0.5 : -gap * 0.5);
        m.scale.setScalar(CRYSTAL_SEAMS[i].r * (1.25 + c * 0.5));
      });

      const beat = Math.pow(0.5 + 0.5 * Math.sin(t * 2.2), 6) * 0.6;
      mat.seam.uniforms.uIntensity.value = 0.7 + c * 2.4 + beat * 0.6;

      if (core.current) {
        core.current.rotation.set(t * 0.7, t * 1.1, 0);
        core.current.scale.setScalar(1 + beat * 0.15 + c * 0.35);
      }
      if (coreLight.current) coreLight.current.intensity = 5 + c * 18 + beat * 4;

      sp.scan += dt * (0.7 + c * 3);
      if (sp.scan > 2.2) sp.scan = -1.8;
      mat.line.uniforms.uScan.value = sp.scan;
      mat.line.uniforms.uIntensity.value = 0.6 + c * 1.1;
    }

    /* rings: continuous living orbital motion */
    const b = d.burst;
    if (rings.current) {
      const out = 1 - Math.pow(1 - b, 3);
      // scale encodes the burst fly-out and the fade-IN (0→1 via fi); the burn shader
      // handles the vanish, so fi never fades back out — the flame eats the rings instead
      rings.current.scale.setScalar((1 - c * 0.12) * (1 + out * 3.2) * fi);
    }

    {
      // Each ring spins on its own axis — faster with charge, extra burst on hover
      const baseSpeed1 = 0.28 + c * 3.5 + h * 1.2;
      const baseSpeed2 = 0.14 + c * 2.4 + h * 0.8;
      sp.ring1 += dt * baseSpeed1;
      sp.ring2 -= dt * baseSpeed2;

      if (ring1Ref.current) ring1Ref.current.rotation.z = sp.ring1;
      if (ring2Ref.current) ring2Ref.current.rotation.z = sp.ring2;

      // Pivots wobble their tilt slowly — the rings precess like gyroscopes
      if (ring1Pivot.current) {
        ring1Pivot.current.rotation.y = Math.sin(t * 0.18) * 3.4;
        ring1Pivot.current.rotation.x = 1.22 + Math.cos(t * 0.13) * 0.15;
      }
      if (ring2Pivot.current) {
        ring2Pivot.current.rotation.y = Math.sin(t * 0.22 + 1.1) * 4.35;
        ring2Pivot.current.rotation.x = 1.42 + Math.cos(t * 0.17 + 2.0) * 0.12;
      }

      // Glow pulses with a heartbeat + hover
      const beat = Math.pow(0.5 + 0.5 * Math.sin(t * 2.2), 6);
      mat.ringGlow.opacity = (c * 0.12 + h * 0.88 + beat * 0.08);
    }
  });

  return (
    <group>
      <group ref={stone}>
        <group ref={top}>
          <mesh geometry={geo.parts.top} material={mat.glass} />
          <lineSegments geometry={geo.edges.top} material={mat.line} />
        </group>
        <group ref={body}>
          <mesh geometry={geo.parts.body} material={mat.glass} />
          <lineSegments geometry={geo.edges.body} material={mat.line} />
        </group>
        <group ref={base}>
          <mesh geometry={geo.parts.base} material={mat.glass} />
          <lineSegments geometry={geo.edges.base} material={mat.line} />
        </group>

        {/* the core, burning inside the body */}
        <group ref={core}>
          <mesh geometry={geo.coreOuter} material={mat.coreOuter} />
          <mesh geometry={geo.coreInner} material={mat.coreInner} />
        </group>
        <pointLight ref={coreLight} color="#ff5a2a" intensity={5} distance={4} decay={2} />

        {CRYSTAL_SEAMS.map((s, i) => (
          <mesh key={i} ref={(m) => void (seams.current[i] = m)} geometry={geo.seam} material={mat.seam} position-y={s.y} renderOrder={5} />
        ))}
      </group>

      <group ref={rings}>
        {/* Inner ring — tilted plane that precesses slowly */}
        <group ref={ring1Pivot} rotation={[1.22, 0.18, 0.35]}>
          <group ref={ring1Ref}>
            <mesh geometry={geo.ring1} material={mat.ringGlass} renderOrder={6} />
            <mesh geometry={geo.ring1} material={mat.ringGlow} scale={1.06} renderOrder={7} />
          </group>
        </group>
        {/* Outer ring — opposite tilt, opposite precession */}
        <group ref={ring2Pivot} rotation={[1.42, -0.12, -0.55]}>
          <group ref={ring2Ref}>
            <mesh geometry={geo.ring2} material={mat.ringGlass} renderOrder={6} />
            <mesh geometry={geo.ring2} material={mat.ringGlow} scale={1.06} renderOrder={7} />
          </group>
        </group>
      </group>
    </group>
  );
}