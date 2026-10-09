'use client';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { live, registerTask, ui } from '@/lib/state';
import { T, dissolveAt } from '@/lib/timeline';
import { doorFrag, orbCoreFrag, orbVert, quadVert, riverFrag, worldVert } from '@/lib/shaders';
import { easeInOutCubic, easeOutExpo, range } from '@/lib/geometry';
import { createBrandEnvironment } from '@/lib/environment';
import { Aurora } from '@/components/three/Aurora';
import { CrystalRig } from '@/components/three/CrystalRig';
// Swap the hero centrepiece here — one is the procedural crystal, the other the GLB rock.
// Both are self-contained (model + its own shards + dissolve); render ONE of them.
// import { RockRig } from '@/components/three/RockRig';

const DOOR_POS = new THREE.Vector3(0, 1.15, -62);
const ORIGIN = new THREE.Vector3(0, 0, 0);

/* ------------------------------------------------------------------ */
/* The orb: the cursor becomes a glowing light in the dark            */
/* ------------------------------------------------------------------ */
const lightPos = new THREE.Vector3(0, 0, 3);
/** Light of the orb — near-white, a touch warm so the red river still glows under it. */
const ORB_WHITE = new THREE.Color('#fff6ee');

function Orb() {
  const light = useRef<THREE.PointLight>(null);
  const ball = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const dir = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  const ballMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: orbVert,
        fragmentShader: orbCoreFrag,
        uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
      }),
    [],
  );
  useEffect(() => () => ballMat.dispose(), [ballMat]);

  useFrame((s) => {
    dir.set(live.mouse.x, live.mouse.y, 0.5).unproject(camera).sub(camera.position).normalize();
    target.copy(camera.position).addScaledVector(dir, 5.5);
    lightPos.lerp(target, 0.14);

    const d = live.dark;
    const t = s.clock.elapsedTime;
    if (ball.current) {
      ball.current.position.copy(lightPos);
      ball.current.visible = d > 0.02;
      ball.current.scale.setScalar(Math.max(0.001, d));
      ball.current.rotation.y = t * 0.25;
    }
    ballMat.uniforms.uTime.value = t;
    ballMat.uniforms.uIntensity.value = d;
    if (light.current) {
      light.current.position.copy(lightPos);
      light.current.intensity = d * 220;
    }
  });

  return (
    <>
      <pointLight ref={light} color={ORB_WHITE} intensity={0} distance={30} decay={2} />
      <mesh ref={ball} material={ballMat} visible={false}>
        <sphereGeometry args={[0.24, 64, 64]} />
      </mesh>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Blood-red river                                                    */
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
          uLightColor: { value: ORB_WHITE },
          uDoor: { value: DOOR_POS },
          uImpact: { value: new THREE.Vector2(0, 0) },
          uSpread: { value: 0 },
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
    u.uReveal.value = Math.min(1, reveal * 3);
    u.uSpread.value = 1 + reveal * reveal * 70;
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
  const QUAD = [11, 13] as const;
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
    const near = range(p, T.lines[2][1], T.flight[1]);
    doorGlow.current = appear * (0.35 + near * near * near * 3.4);
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
/* Camera: hero framing → a calm, eased glide to the door             */
/* ------------------------------------------------------------------ */
export const CAMERA_PATH: [number, number, number][] = [
  [0, 0.15, 7.6],
  [0.55, 0.35, 0],
  [-0.4, 0.65, -14],
  [0.35, 0.85, -30],
  [0, 1.0, -45],
  [0, 1.12, -57.4],
];

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

function CameraRig() {
  const { camera } = useThree();
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(CAMERA_PATH.map((p) => new THREE.Vector3(...p)), false, 'centripetal'),
    [],
  );
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);
  const camPos = useMemo(() => new THREE.Vector3(0, 0, 7), []);
  const smoothLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const par = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const p = live.journey;
    const grow = easeInOutCubic(range(p, T.grow[0], T.grow[1]));
    const back = easeOutExpo(range(p, T.scatter[0], T.scatter[1]));
    const f = easeInOutSine(range(p, T.flight[0], T.flight[1]));

    if (f <= 0) {
      pos.set(0, 0.15 * range(p, 0.3, 0.58), 7 - grow * 0.8 + back * 1.4);
      look.copy(ORIGIN);
    } else {
      curve.getPointAt(f, pos);
      curve.getPointAt(Math.min(1, f + 0.1), ahead);
      look.copy(ahead).lerp(DOOR_POS, range(f, 0.55, 1));
      look.lerp(ORIGIN, 1 - range(f, 0, 0.15));
    }

    par.current.x += (live.mouse.x - par.current.x) * 0.04;
    par.current.y += (live.mouse.y - par.current.y) * 0.04;
    const amp = 1 - range(p, T.flight[1] - 0.06, T.flight[1]);
    pos.x += par.current.x * 0.35 * amp;
    pos.y += par.current.y * 0.22 * amp;

    const k = 1 - Math.exp(-dt * 3.2);
    camPos.lerp(pos, k);
    smoothLook.lerp(look, 1 - Math.exp(-dt * 2.6));
    camera.position.copy(camPos);
    camera.lookAt(smoothLook);
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Environment, readiness, dark flag                                  */
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
      <Aurora
        lowPower={lowPower}
        dissolve={() => dissolveAt(live.journey)}
        brush={() => 1 - live.dark}
        scroll={() => live.journey}
      />
      {/* The hero centrepiece + its own shards + dissolve. Swap for <RockRig/> to use the GLB.
          Suspense catches the GLB load (CrystalRig is procedural and never suspends). */}
      <Suspense fallback={null}>
        <CrystalRig lowPower={lowPower} />
      </Suspense>
      <Orb />
      <River doorGlow={doorGlow} />
      <Door doorGlow={doorGlow} />
      <CameraRig />
      <ambientLight intensity={0.5} />
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