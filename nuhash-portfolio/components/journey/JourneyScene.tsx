'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { live, registerTask, ui } from '@/lib/state';
import { T } from '@/lib/timeline';
import {
  auroraFrag,
  doorFrag,
  glitterFrag,
  glitterVert,
  quadVert,
  riverFrag,
  screenQuadVert,
  trailFrag,
  worldVert,
} from '@/lib/shaders';
import {
  createRockGeometry,
  createShardGeometry,
  easeInOutCubic,
  easeOutExpo,
  fibonacciSphere,
  mulberry32,
  range,
} from '@/lib/geometry';
import { createBrandEnvironment } from '@/lib/environment';

const BRAND = {
  red: new THREE.Color('#c1121f'),
  orange: new THREE.Color('#ff5a1f'),
  deep: new THREE.Color('#2e0507'),
  light: new THREE.Color('#ff9a4d'),
};

const DOOR_POS = new THREE.Vector3(0, 1.15, -62);
const ORIGIN = new THREE.Vector3(0, 0, 0);

/* ------------------------------------------------------------------ */
/* Background: red/orange northern lights + paint-on-water brush       */
/* ------------------------------------------------------------------ */
function Aurora({ lowPower }: { lowPower: boolean }) {
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
    const p = live.journey;
    const aspect = size.width / Math.max(1, size.height);

    // pointer → uv velocity
    const mx = (live.mouse.x + 1) / 2;
    const my = (live.mouse.y + 1) / 2;
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
    u.uActive.value = 1 - live.dark; // the brush hands over to the light in the dark
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
    m.uDissolve.value = easeInOutCubic(range(p, T.dissolve[0], T.dissolve[1]));
    m.uScroll.value = p;
  }, -2);

  return (
    <mesh renderOrder={-1000} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* The alien rock, its glitter, and the fragments it breaks into      */
/* ------------------------------------------------------------------ */
type Frag = {
  start: THREE.Vector3;
  target: THREE.Vector3;
  scale: THREE.Vector3;
  rot: THREE.Euler;
  spin: THREE.Vector3;
  phase: number;
  scatter: boolean;
};

function Rock({ lowPower }: { lowPower: boolean }) {
  const COUNT = lowPower ? 70 : 160;
  const rockRef = useRef<THREE.Mesh>(null);
  const glitterRef = useRef<THREE.Points>(null);
  const fragRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);

  const rockGeo = useMemo(() => createRockGeometry(lowPower ? 3 : 4), [lowPower]);
  const shardGeo = useMemo(() => createShardGeometry(11), []);

  const rockMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#1a0706',
        metalness: 0.15,
        roughness: 0.04,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        iridescence: 0.85,
        iridescenceIOR: 1.8,
        ior: 2.4,
        specularIntensity: 1,
        envMapIntensity: 2.4,
        flatShading: true,
      }),
    [],
  );
  const fragMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1d0807',
        metalness: 0.55,
        roughness: 0.12,
        envMapIntensity: 2.2,
        flatShading: true,
      }),
    [],
  );

  const glitter = useMemo(() => {
    const pos = rockGeo.attributes.position as THREE.BufferAttribute;
    const rnd = mulberry32(5);
    const n = lowPower ? 120 : 280;
    const arr = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const k = Math.floor(rnd() * pos.count);
      arr[i * 3] = pos.getX(k) * 1.01;
      arr[i * 3 + 1] = pos.getY(k) * 1.01;
      arr[i * 3 + 2] = pos.getZ(k) * 1.01;
      seeds[i] = rnd();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: glitterVert,
      fragmentShader: glitterFrag,
      uniforms: { uTime: { value: 0 }, uSize: { value: 120 }, uIntensity: { value: 0.8 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo, mat };
  }, [rockGeo, lowPower]);

  const frags = useMemo<Frag[]>(() => {
    const rnd = mulberry32(42);
    const list: Frag[] = [];
    const sphereCount = Math.floor(COUNT * 0.58);
    for (let i = 0; i < COUNT; i++) {
      const dir = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
      const start = dir.clone().multiplyScalar(0.25 + Math.cbrt(rnd()) * 0.6);
      const scatter = i >= sphereCount;
      let target: THREE.Vector3;
      let s: number;
      if (!scatter) {
        // symmetric sphere around the old rock
        target = fibonacciSphere(i, sphereCount).multiplyScalar(2.5);
        s = 0.07 + rnd() * 0.12;
      } else {
        // drift down the river corridor, so the flight passes through them
        target = new THREE.Vector3((rnd() * 2 - 1) * 7, -0.4 + rnd() * 4.2, 2 - rnd() * 56);
        s = 0.1 + rnd() * 0.3;
      }
      list.push({
        start,
        target,
        scale: new THREE.Vector3(s * (0.7 + rnd() * 0.6), s * (0.7 + rnd() * 0.6), s * (0.7 + rnd() * 0.6)),
        rot: new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28),
        spin: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.8),
        phase: rnd() * 6.28,
        scatter,
      });
    }
    return list;
  }, [COUNT]);

  useEffect(
    () => () => {
      rockGeo.dispose();
      shardGeo.dispose();
      rockMat.dispose();
      fragMat.dispose();
      glitter.geo.dispose();
      glitter.mat.dispose();
    },
    [rockGeo, shardGeo, rockMat, fragMat, glitter],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = live.journey;
    const grow = easeInOutCubic(range(p, T.grow[0], T.grow[1]));
    const exploded = p >= T.explode;
    const ex = easeOutExpo(range(p, T.scatter[0], T.scatter[1]));
    const envScale = 1 - live.dark * 0.85;

    rockMat.envMapIntensity = 2.4 * envScale;
    fragMat.envMapIntensity = 2.2 * envScale;

    // the whole rock group drifts and leans toward the pointer
    const g = groupRef.current;
    if (g) {
      g.rotation.y += delta * (0.12 + grow * 0.5);
      g.rotation.x += ((live.mouse.y * 0.25) - g.rotation.x) * 0.04;
      g.rotation.z += ((-live.mouse.x * 0.12) - g.rotation.z) * 0.04;
      g.position.y = Math.sin(t * 0.6) * 0.06 * (1 - ex);
    }

    const rock = rockRef.current;
    const rockScale = 1 + grow * 0.6;
    if (rock) {
      rock.visible = !exploded;
      rock.scale.setScalar(rockScale);
      const shake = grow > 0.8 ? (grow - 0.8) * 0.12 : 0;
      rock.position.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0);
    }
    const gp = glitterRef.current;
    if (gp) {
      gp.visible = !exploded;
      gp.scale.setScalar(rockScale);
      glitter.mat.uniforms.uTime.value = t;
      glitter.mat.uniforms.uIntensity.value = 0.7 + grow * 2.4;
      glitter.mat.uniforms.uSize.value = 120 * state.viewport.dpr;
    }

    // flash at the break
    if (flashRef.current) {
      const k = p >= T.explode ? Math.exp(-(p - T.explode) * 90) : 0;
      flashRef.current.intensity = k * 60;
    }

    const im = fragRef.current;
    if (!im) return;
    im.visible = exploded;
    if (!exploded) return;
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i];
      tmp.copy(f.start).multiplyScalar(rockScale).lerp(f.target, ex);
      const bob = Math.sin(t * 0.7 + f.phase) * 0.12 * ex;
      tmp.y += bob;
      tmp.x += Math.cos(t * 0.45 + f.phase) * 0.06 * ex;
      e.set(f.rot.x + t * f.spin.x * (0.4 + ex), f.rot.y + t * f.spin.y * (0.4 + ex), f.rot.z + t * f.spin.z);
      q.setFromEuler(e);
      dummy.position.copy(tmp);
      dummy.quaternion.copy(q);
      dummy.scale.copy(f.scale).multiplyScalar(0.5 + 0.5 * ex + (1 - ex) * 0.6);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={rockRef} geometry={rockGeo} material={rockMat} />
      <points ref={glitterRef} geometry={glitter.geo} material={glitter.mat} />
      <instancedMesh ref={fragRef} args={[shardGeo, fragMat, COUNT]} frustumCulled={false} />
      <pointLight ref={flashRef} color="#ffd2b0" intensity={0} distance={12} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Cursor becomes a light in the dark                                 */
/* ------------------------------------------------------------------ */
const lightPos = new THREE.Vector3(0, 0, 3);

function CursorLight() {
  const ref = useRef<THREE.PointLight>(null);
  const { camera } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    v.set(live.mouse.x, live.mouse.y, 0.5).unproject(camera).sub(camera.position).normalize();
    target.copy(camera.position).addScaledVector(v, 5.5);
    lightPos.lerp(target, 0.18);
    if (ref.current) {
      ref.current.position.copy(lightPos);
      ref.current.intensity = live.dark * 70;
    }
  });
  return <pointLight ref={ref} color={BRAND.light} intensity={0} distance={16} decay={2} />;
}

/* ------------------------------------------------------------------ */
/* Black liquid river                                                 */
/* ------------------------------------------------------------------ */
function River({ doorGlow }: { doorGlow: { current: number } }) {
  const ref = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: worldVert,
        fragmentShader: riverFrag,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uLightInt: { value: 0 },
          uDoorGlow: { value: 0 },
          uLight: { value: lightPos },
          uLightColor: { value: BRAND.light },
          uDoor: { value: DOOR_POS },
        },
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => {
    const reveal = range(live.journey, T.river[0], T.river[1]);
    if (ref.current) ref.current.visible = reveal > 0.001;
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uReveal.value = reveal;
    u.uLightInt.value = live.dark;
    u.uDoorGlow.value = doorGlow.current;
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position={[0, -1.9, -48]} material={material} visible={false}>
      <planeGeometry args={[80, 150, 1, 1]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* The door on the horizon                                            */
/* ------------------------------------------------------------------ */
function Door({ doorGlow }: { doorGlow: { current: number } }) {
  const QUAD = [9, 11] as const;
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: quadVert,
        fragmentShader: doorFrag,
        uniforms: {
          uGlow: { value: 0 },
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uQuad: { value: new THREE.Vector2(QUAD[0], QUAD[1]) },
          uHalf: { value: new THREE.Vector2(1.05, 2.05) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => {
    const p = live.journey;
    const appear = range(p, T.door[0], T.door[1]);
    const near = range(p, T.flight[0], T.flight[1]);
    doorGlow.current = appear * (0.35 + near * near * 3.2);
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uOpacity.value = appear;
    u.uGlow.value = doorGlow.current;
  });
  return (
    <mesh position={DOOR_POS} material={material} renderOrder={10}>
      <planeGeometry args={[QUAD[0], QUAD[1]]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Camera: hero framing → scroll-driven path to the door              */
/* Replace PATH with points exported from your camera path editor.    */
/* ------------------------------------------------------------------ */
export const CAMERA_PATH: [number, number, number][] = [
  [0, 0.15, 7.6],
  [1.7, 0.55, 1.2],
  [-1.5, 0.95, -12],
  [1.1, 0.8, -28],
  [-0.5, 1.05, -44],
  [0, 1.15, -57.2],
];

function CameraRig() {
  const { camera } = useThree();
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(CAMERA_PATH.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5),
    [],
  );
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);
  const smoothLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const par = useRef({ x: 0, y: 0 });

  useFrame(() => {
    const p = live.journey;
    const grow = easeInOutCubic(range(p, T.grow[0], T.grow[1]));
    const back = easeOutExpo(range(p, T.scatter[0], T.scatter[1]));
    const f = easeInOutCubic(range(p, T.flight[0], T.flight[1]));

    if (f <= 0) {
      pos.set(0, 0.15 * range(p, 0.3, 0.6), 7 - grow * 0.9 + back * 1.5);
      look.set(0, 0, 0);
    } else {
      curve.getPointAt(f, pos);
      curve.getPointAt(Math.min(1, f + 0.06), ahead);
      const toDoor = range(f, 0.75, 1);
      look.copy(ahead).lerp(DOOR_POS, toDoor);
      look.lerp(ORIGIN, 1 - range(f, 0, 0.12));
    }

    par.current.x += (live.mouse.x - par.current.x) * 0.05;
    par.current.y += (live.mouse.y - par.current.y) * 0.05;
    const amp = 1 - range(p, T.flight[1] - 0.06, T.flight[1]);
    camera.position.set(pos.x + par.current.x * 0.45 * amp, pos.y + par.current.y * 0.28 * amp, pos.z);
    smoothLook.lerp(look, 0.12);
    camera.lookAt(smoothLook.x + par.current.x * 0.15 * amp, smoothLook.y + par.current.y * 0.1 * amp, smoothLook.z);
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Environment, readiness, dark-mode flag                             */
/* ------------------------------------------------------------------ */
function SceneSetup() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    const markEnv = registerTask('environment');
    const markScene = registerTask('scene');
    const env = createBrandEnvironment(gl);
    scene.environment = env;
    markEnv(1);
    let raf = 0;
    let frames = 0;
    // compile everything now, then wait two frames so the first view is ready under the shutter
    Promise.resolve((gl as THREE.WebGLRenderer).compile(scene, camera)).then(() => {
      const tick = () => {
        frames++;
        markScene(Math.min(1, frames / 3));
        if (frames < 3) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(raf);
      env.dispose();
      scene.environment = null;
    };
  }, [gl, scene, camera]);

  useFrame(() => {
    live.dark = easeInOutCubic(range(live.journey, T.dark[0], T.dark[1]));
    const inDark = live.dark > 0.5 && live.journey < T.whiteout[0];
    if (ui.get().inDark !== inDark) ui.set({ inDark });
  });
  return null;
}

function Scene({ lowPower }: { lowPower: boolean }) {
  const doorGlow = useRef(0);
  return (
    <>
      <SceneSetup />
      <Aurora lowPower={lowPower} />
      <Rock lowPower={lowPower} />
      <CursorLight />
      <River doorGlow={doorGlow} />
      <Door doorGlow={doorGlow} />
      <CameraRig />
      <ambientLight intensity={0.05} />
    </>
  );
}

export default function JourneyScene({ active, lowPower }: { active: boolean; lowPower: boolean }) {
  return (
    <Canvas
      className="journey-canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, lowPower ? 1.25 : 1.75]}
      gl={{ antialias: !lowPower, alpha: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 35, near: 0.1, far: 220, position: [0, 0, 7] }}
      onCreated={({ gl }) => {
        gl.setClearColor('#050303', 1);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      aria-hidden
    >
      <Scene lowPower={lowPower} />
    </Canvas>
  );
}
