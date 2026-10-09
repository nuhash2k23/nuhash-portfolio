'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Project } from '@/lib/content';

/** Live state shared from the page: which project is active + how far between. */
export type CoverLive = { index: number; prev: number; blend: number };

/** Placeholder cover drawn on a canvas until real images exist. */
function makeCover(p: Project, i: number) {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 1150;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 900, 1150);
  grd.addColorStop(0, p.palette[0]);
  grd.addColorStop(1, p.palette[1]);
  g.fillStyle = grd;
  g.fillRect(0, 0, 900, 1150);
  for (let k = 0; k < 5; k++) {
    const x = 150 + ((i * 197 + k * 263) % 620);
    const y = 200 + ((i * 131 + k * 173) % 740);
    const r = 110 + ((i * 53 + k * 71) % 180);
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(255,255,255,0.5)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.font = 'italic 92px Georgia, serif';
  g.fillText(p.title, 48, 1050);
  g.font = '500 26px monospace';
  g.fillText(`${String(i + 1).padStart(2, '0')} — ${p.category.toUpperCase()}`, 52, 80);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/* focused card small + centred; next steps to TOP-LEFT, earlier to BOTTOM-RIGHT */
const PLANE = { w: 3.19, h: 2.2 };

const vert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/* texture sampled with a cheap 9-tap blur scaled by uBlur → depth-of-field focus feel */
const frag = /* glsl */ `
uniform sampler2D uMap;
uniform float uBlur;    // uniform out-of-focus (sliding / neighbour fade)
uniform float uDepth;   // depth blur that ramps over the LOWER HALF of the card
uniform float uOpacity;
uniform float uLum;     // hover luminosity lift (screen-ish)
varying vec2 vUv;
void main(){
  // depth-of-field: top half stays crisp, blur grows toward the bottom edge
  float lower = smoothstep(0.5, 0.0, vUv.y); // 0 at mid-height → 1 at bottom
  float b = uBlur + uDepth * lower;
  vec2 px = vec2(b) * 0.012;
  vec4 c = vec4(0.0);
  c += texture2D(uMap, vUv + px * vec2(-1.0, -1.0)) * 0.0625;
  c += texture2D(uMap, vUv + px * vec2( 0.0, -1.0)) * 0.125;
  c += texture2D(uMap, vUv + px * vec2( 1.0, -1.0)) * 0.0625;
  c += texture2D(uMap, vUv + px * vec2(-1.0,  0.0)) * 0.125;
  c += texture2D(uMap, vUv)                          * 0.25;
  c += texture2D(uMap, vUv + px * vec2( 1.0,  0.0)) * 0.125;
  c += texture2D(uMap, vUv + px * vec2(-1.0,  1.0)) * 0.0625;
  c += texture2D(uMap, vUv + px * vec2( 0.0,  1.0)) * 0.125;
  c += texture2D(uMap, vUv + px * vec2( 1.0,  1.0)) * 0.0625;
  // hover luminosity: lift toward white like a 'luminosity' blend
  c.rgb = mix(c.rgb, 1.0 - (1.0 - c.rgb) * (1.0 - uLum), uLum);
  gl_FragColor = vec4(c.rgb, c.a * uOpacity);
}`;

function Stack({ projects, state }: { projects: Project[]; state: React.MutableRefObject<CoverLive> }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const tilt = useRef({ x: 0, y: 0 });

  const textures = useMemo(
    () =>
      projects.map((p, i) => {
        if (p.image) {
          const t = new THREE.TextureLoader().load(p.image);
          t.colorSpace = THREE.SRGBColorSpace;
          return t;
        }
        return makeCover(p, i);
      }),
    [projects],
  );

  const materials = useMemo(
    () =>
      textures.map(
        (map) =>
          new THREE.ShaderMaterial({
            vertexShader: vert,
            fragmentShader: frag,
            uniforms: {
              uMap: { value: map },
              uBlur: { value: 0 },
              uDepth: { value: 0 },
              uOpacity: { value: 1 },
              uLum: { value: 0 },
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
      ),
    [textures],
  );

  const geo = useMemo(() => new THREE.PlaneGeometry(PLANE.w, PLANE.h, 1, 1), []);

  useEffect(
    () => () => {
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
      geo.dispose();
    },
    [textures, materials, geo],
  );

  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  // per-card smoothed drivers so entering/leaving cards ease rather than pop
  const ease = useRef(projects.map(() => ({ x: 0, y: 0, z: 0, rz: 0, sc: 0.7, op: 0, blur: 3, depth: 0, lum: 0 })));

  useFrame((_, dt) => {
    const dts = Math.min(dt, 1 / 30);
    const kTilt = 1 - Math.pow(0.0015, dts);
    // the whole stack tilts toward the cursor (gyroscopic parallax)
    tilt.current.x += (pointer.y * 0.14 - tilt.current.x) * kTilt;
    tilt.current.y += (pointer.x * 0.18 - tilt.current.y) * kTilt;
    const g = group.current;
    if (g) {
      g.rotation.x = tilt.current.x;
      g.rotation.y = tilt.current.y;
    }

    const st = state.current;
    const activeF = st.prev + (st.index - st.prev) * st.blend; // fractional active index
    // SNAP easing: fast catch-up, then settle (feels premium vs. linear follow)
    const kSnap = 1 - Math.pow(0.000045, dts);

    for (let i = 0; i < meshes.current.length; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const d = i - activeF; // +1 = the NEXT project, -1 = the EARLIER one
      const ad = Math.abs(d);
      const vis = ad < 2.4;
      m.visible = vis;
      if (!vis) continue;

      // ARC / fanned-deck: inactive cards tuck BEHIND the active one along a curve.
      // sign: next (d>0) fans one way, earlier (d<0) the other — both pushed back + down.
      const s = Math.sign(d || 1);
      const arc = Math.min(5, ad); // first neighbour arcs fully, further ones clamp
      const tx = s * arc * 1.95;                 // small sideways offset along the arc
      const ty = -arc * 0 - (ad > 1 ? (ad - 1) * 0.3 : 0); // dip DOWN along the curve
      const tz = -ad * 1.95;                     // firmly behind the active card
      const trz = -s * arc * 0.04;               // fan rotation — like splayed cards
      const tsc = Math.max(-.46, 1 - ad * 0.9); // focused is the biggest-sharpest
      // active card (nearest slot) stays FULLY opaque + sharp; only cards past it fade
      const top = ad < 0.5 ? 1 : Math.max(0.1, 1 - (ad - 0.5) * 0.5);
      const tblur = ad < 0.5 ? 0 : Math.min(4.0, (ad - 0.5) * 2.0);
      // depth blur strength: 0 for active, grows for inactive → fed to the lower-half gradient
      const tdepth = ad < 0.5 ? 0 : Math.min(3.0, (ad - 0.4) * 2.2);

      const e = ease.current[i];
      e.x += (tx - e.x) * kSnap;
      e.y += (ty - e.y) * kSnap;
      e.z += (tz - e.z) * kSnap;
      e.rz += (trz - e.rz) * kSnap;
      e.sc += (tsc - e.sc) * kSnap;
      e.op += (top - e.op) * kSnap;
      e.blur += (tblur - e.blur) * kSnap;
      e.depth += (tdepth - e.depth) * kSnap;
      // motion coupling — subtle (gentle skew + a touch of focus-pull while sliding)
      const motion = Math.min(1, Math.abs(st.index - activeF) * 1.2) * (1 - st.blend);
      e.lum += (0 - e.lum) * kSnap;

      m.position.set(e.x, e.y, e.z);
      m.rotation.z = e.rz + motion * 0.02 * s;
      m.scale.setScalar(e.sc);
      m.renderOrder = 100 - Math.round(ad * 10); // nearest focus draws last / on top
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      u.uOpacity.value = e.op;
      u.uBlur.value = e.blur + motion * 1.0;  // uniform focus-pull while sliding
      u.uDepth.value = e.depth;               // lower-half depth blur on inactive cards
      u.uLum.value = e.lum;
    }
  });

  return (
    <group ref={group} position={[0.15, 0, 0]}>
      {/* render far cards first so the active one sits on top */}
      {projects.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => void (meshes.current[i] = el)}
          geometry={geo}
          material={materials[i]}
          renderOrder={projects.length - i}
        />
      ))}
    </group>
  );
}

export default function WorkCover({
  projects,
  state,
  active,
}: {
  projects: Project[];
  state: React.MutableRefObject<CoverLive>;
  active: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 50, position: [0, 0, 8] }}
    >
      <Stack projects={projects} state={state} />
    </Canvas>
  );
}