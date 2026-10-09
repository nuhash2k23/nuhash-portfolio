'use client';
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { live } from '@/lib/state';
import { auroraFrag, screenQuadVert, trailFrag } from '@/lib/shaders';

export const BRAND = {
  red: new THREE.Color('#c1121f'),
  orange: new THREE.Color('#ff5a1f'),
  deep: new THREE.Color('#2e0507'),
  light: new THREE.Color('#ffb27a'),
  gold: new THREE.Color('#f5c451'),
};

/* ------------------------------------------------------------------ */
/* Background: red/orange northern lights + paint-on-water brush       */
/* ------------------------------------------------------------------ */
export function Aurora({
  lowPower = false,
  dissolve = () => 0,
  brush = () => 1,
  scroll = () => 0,
  pointer,
}: {
  lowPower?: boolean;
  /** 0..1 bottom-to-top burn-away */
  dissolve?: () => number;
  /** 0..1 how strongly the cursor paints the light */
  brush?: () => number;
  scroll?: () => number;
  /** pointer in canvas uv (0..1); defaults to the window pointer */
  pointer?: () => { x: number; y: number };
}) {
  const { gl, size } = useThree();
  const SIM = lowPower ? 128 : 256;

  const sim = useMemo(() => {
    const opts: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    };
    const a = new THREE.WebGLRenderTarget(SIM, SIM, opts);
    const b = new THREE.WebGLRenderTarget(SIM, SIM, opts);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader: screenQuadVert,
      fragmentShader: trailFrag,
      uniforms: {
        uPrev: { value: a.texture },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uVel: { value: new THREE.Vector2() },
        uAspect: { value: 1 },
        uDt: { value: 0.016 },
        uActive: { value: 1 },
        uTexel: { value: new THREE.Vector2(1 / SIM, 1 / SIM) },
      },
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    scene.add(quad);
    // clear both targets to zero
    const prev = gl.getRenderTarget();
    gl.setRenderTarget(a);
    gl.clear();
    gl.setRenderTarget(b);
    gl.clear();
    gl.setRenderTarget(prev);
    return { a, b, scene, camera, material, last: new THREE.Vector2(0.5, 0.5), vel: new THREE.Vector2() };
  }, [gl, SIM]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: screenQuadVert,
        fragmentShader: auroraFrag,
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uDissolve: { value: 0 },
          uScroll: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
          uTrail: { value: sim.a.texture },
          uRed: { value: BRAND.red },
          uOrange: { value: BRAND.orange },
          uDeep: { value: BRAND.deep },
          uGold: { value: BRAND.gold },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [sim],
  );

  useEffect(
    () => () => {
      sim.a.dispose();
      sim.b.dispose();
      sim.material.dispose();
      material.dispose();
    },
    [sim, material],
  );

  // runs before the main render (negative priority keeps auto-rendering on)
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const aspect = size.width / Math.max(1, size.height);

    // pointer → uv velocity
    const pt = pointer ? pointer() : { x: (live.mouse.x + 1) / 2, y: (live.mouse.y + 1) / 2 };
    const mx = pt.x;
    const my = pt.y;
    const vx = (mx - sim.last.x) / Math.max(dt, 1e-3);
    const vy = (my - sim.last.y) / Math.max(dt, 1e-3);
    sim.vel.x += (vx - sim.vel.x) * 0.35;
    sim.vel.y += (vy - sim.vel.y) * 0.35;
    sim.last.set(mx, my);

    const u = sim.material.uniforms;
    u.uPrev.value = sim.a.texture;
    u.uMouse.value.set(mx, my);
    u.uVel.value.copy(sim.vel);
    u.uAspect.value = aspect;
    u.uDt.value = dt;
    u.uActive.value = brush();
    gl.setRenderTarget(sim.b);
    gl.render(sim.scene, sim.camera);
    gl.setRenderTarget(null);
    const tmp = sim.a;
    sim.a = sim.b;
    sim.b = tmp;

    const m = material.uniforms;
    m.uTime.value = state.clock.elapsedTime;
    m.uAspect.value = aspect;
    m.uRes.value.set(size.width, size.height);
    m.uTrail.value = sim.a.texture;
    m.uDissolve.value = dissolve();
    m.uScroll.value = scroll();
  }, -2);

  return (
    <mesh renderOrder={-1000} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}