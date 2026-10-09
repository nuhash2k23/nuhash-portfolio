'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { cardFrag, cardVert } from '@/lib/shaders';
import type { Project } from '@/lib/content';

export const STAIR = { angle: 0.95, step: 1.35, radius: 3.6, w: 3.3, h: 2.05 };

export type WorkLive = { progress: number; hovered: number; selected: number };

/** Placeholder cover drawn on a canvas until real images exist. */
function makeCover(p: Project, i: number) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 640;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 1024, 640);
  grd.addColorStop(0, p.palette[0]);
  grd.addColorStop(1, p.palette[1]);
  g.fillStyle = grd;
  g.fillRect(0, 0, 1024, 640);
  // soft shapes so the raster lines have something to bend around
  for (let k = 0; k < 5; k++) {
    const x = 180 + ((i * 197 + k * 263) % 700);
    const y = 120 + ((i * 131 + k * 173) % 420);
    const r = 90 + ((i * 53 + k * 71) % 180);
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(255,255,255,0.55)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.font = 'italic 92px Georgia, serif';
  g.fillText(p.title, 56, 560);
  g.font = '500 26px monospace';
  g.fillText(`0${i + 1} / 07 — ${p.category.toUpperCase()}`, 60, 80);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function Card({
  p,
  i,
  state,
  onSelect,
}: {
  p: Project;
  i: number;
  state: React.MutableRefObject<WorkLive>;
  onSelect: (i: number) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const hover = useRef(0);
  const dim = useRef(0);
  const focus = useRef(0);

  const material = useMemo(() => {
    let map: THREE.Texture;
    if (p.image) {
      map = new THREE.TextureLoader().load(p.image);
      map.colorSpace = THREE.SRGBColorSpace;
    } else {
      map = makeCover(p, i);
    }
    return new THREE.ShaderMaterial({
      vertexShader: cardVert,
      fragmentShader: cardFrag,
      uniforms: {
        uMap: { value: map },
        uHover: { value: 0 },
        uTime: { value: 0 },
        uDim: { value: 0 },
        uLines: { value: 46 },
        uSkew: { value: 0.32 },
        uAspect: { value: STAIR.w / STAIR.h },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [p, i]);

  useEffect(
    () => () => {
      (material.uniforms.uMap.value as THREE.Texture).dispose();
      material.dispose();
    },
    [material],
  );

  const a = i * STAIR.angle;
  const base = useMemo(
    () => new THREE.Vector3(Math.sin(a) * STAIR.radius, -i * STAIR.step, Math.cos(a) * STAIR.radius),
    [a, i],
  );

  useFrame((s, dt) => {
    const st = state.current;
    const isHover = st.hovered === i;
    const isSel = st.selected === i;
    const anySel = st.selected >= 0;
    const k = 1 - Math.pow(0.001, dt);
    hover.current += ((isHover || isSel ? 1 : 0) - hover.current) * k;
    dim.current += ((anySel && !isSel ? 1 : 0) - dim.current) * k;
    focus.current += ((isSel ? 1 : 0) - focus.current) * k;
    const u = material.uniforms;
    u.uTime.value = s.clock.elapsedTime;
    u.uHover.value = hover.current;
    // cards turned away from the camera fade out, so the back of the spiral never clutters
    const turn = a + (ref.current?.parent?.rotation.y ?? 0);
    const away = THREE.MathUtils.clamp((0.35 - Math.cos(turn)) / 0.7, 0, 1);
    u.uDim.value = Math.max(dim.current, away);
    if (ref.current) ref.current.visible = away < 0.99;
    u.uSkew.value = 0.32 * (1 - hover.current);
    const m = ref.current;
    if (m) {
      m.position.copy(base);
      m.position.z += focus.current * 1.2; // selected card steps toward you
      m.scale.setScalar(1 + focus.current * 0.18 + hover.current * 0.04);
    }
  });

  return (
    <mesh
      ref={ref}
      material={material}
      rotation-y={a}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        state.current.hovered = i;
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (state.current.hovered === i) state.current.hovered = -1;
        document.body.style.cursor = '';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(i);
      }}
    >
      <planeGeometry args={[STAIR.w, STAIR.h, 24, 1]} />
    </mesh>
  );
}

function Stair({
  projects,
  state,
  onSelect,
}: {
  projects: Project[];
  state: React.MutableRefObject<WorkLive>;
  onSelect: (i: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const n = projects.length;
  const smooth = useRef(0);
  useFrame((s, dt) => {
    smooth.current += (state.current.progress - smooth.current) * (1 - Math.pow(0.0005, dt));
    const t = smooth.current * (n - 1);
    const g = group.current;
    if (g) {
      g.rotation.y = -t * STAIR.angle;
      g.position.y = t * STAIR.step; // the stairs come up as you scroll
    }
    camera.position.x += (s.pointer.x * 0.4 - camera.position.x) * 0.05;
    camera.position.y += (0.4 + s.pointer.y * 0.25 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });
  return (
    <group ref={group}>
      {projects.map((p, i) => (
        <Card key={p.slug} p={p} i={i} state={state} onSelect={onSelect} />
      ))}
    </group>
  );
}

export default function WorkScene({
  projects,
  state,
  active,
  onSelect,
}: {
  projects: Project[];
  state: React.MutableRefObject<WorkLive>;
  active: boolean;
  onSelect: (i: number) => void;
}) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 32, position: [0, 0.4, 11.5] }}
      onPointerMissed={() => onSelect(-1)}
    >
      <Stair projects={projects} state={state} onSelect={onSelect} />
    </Canvas>
  );
}
