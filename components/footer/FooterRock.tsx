'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { rasterPostFrag, screenQuadVert } from '@/lib/shaders';
import { createBrandEnvironment } from '@/lib/environment';
import { Aurora } from '@/components/three/Aurora';
import Crystal, { type CrystalDrive } from '@/components/three/Crystal';

/** Where the stone sits, in canvas pixels (measured from the footer's stage box). */
type Slot = { cx: number; cy: number; size: number };
type Hover = { inside: boolean; x: number; y: number };

/** Total height of the crystal in its own units (tip to tip, gaps included). */
const CRYSTAL_HEIGHT = 3.1;

/**
 * Footer: the red/orange light as the background, the whole sci-fi crystal floating inside the footer.
 * Hovering the stone opens its seams and turns the area around the cursor into Raster Lines.
 */
function Stone({ hover, slot }: { hover: React.MutableRefObject<Hover>; slot: React.MutableRefObject<Slot> }) {
  const { gl, scene, camera, size, viewport } = useThree();
  const holder = useRef<THREE.Group>(null);

  const post = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(4, 4, { samples: 4 });
    const material = new THREE.ShaderMaterial({
      vertexShader: screenQuadVert,
      fragmentShader: rasterPostFrag,
      uniforms: {
        uScene: { value: target.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(-999, -999) },
        uRadius: { value: 200 },
        uHover: { value: 0 },
        uTime: { value: 0 },
        uSpacing: { value: 7 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const s = new THREE.Scene();
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    q.frustumCulled = false;
    s.add(q);
    return { target, material, scene: s, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, []);

  useEffect(() => {
    const env = createBrandEnvironment(gl);
    scene.environment = env;
    return () => {
      env.dispose();
      scene.environment = null;
      post.target.dispose();
      post.material.dispose();
    };
  }, [gl, scene, post]);

  useEffect(() => {
    const w = Math.floor(size.width * viewport.dpr);
    const h = Math.floor(size.height * viewport.dpr);
    post.target.setSize(w, h);
    post.material.uniforms.uRes.value.set(w, h);
    post.material.uniforms.uSpacing.value = 7 * viewport.dpr;
  }, [size, viewport.dpr, post]);

  const amt = useRef(0);
  const d = useMemo<CrystalDrive>(() => ({ charge: 0, hover: 0, burst: 0, whole: true, fadeIn: 1 }), []);
  const drive = () => {
    d.hover = amt.current;
    d.charge = amt.current * 0.35; // touching it wakes it up a little
    d.fadeIn = 1; // footer crystal is always fully visible
    return d;
  };

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    const h = hover.current;
    const sl = slot.current;
    const m = holder.current;
    if (m) {
      // pixels → world units at the stone's depth (camera looks at z = 0)
      const unitsPerPx = s.viewport.height / size.height;
      m.scale.setScalar((sl.size * unitsPerPx) / CRYSTAL_HEIGHT);
      m.position.x = (sl.cx - size.width / 2) * unitsPerPx;
      m.position.y = (size.height / 2 - sl.cy) * unitsPerPx + Math.sin(t * 0.7) * 0.05;
      m.rotation.y = t * 0.12;
      m.rotation.z = -0.1 + Math.sin(t * 0.3) * 0.05;
      m.rotation.x = Math.sin(t * 0.25) * 0.08;
    }
    // is the pointer over the stone?
    const on = h.inside && Math.hypot(h.x - sl.cx, (h.y - sl.cy) * 0.8) < sl.size * 0.42;
    amt.current += ((on ? 1 : 0) - amt.current) * (1 - Math.pow(0.003, Math.min(delta, 1 / 30)));
    const u = post.material.uniforms;
    u.uHover.value = amt.current;
    u.uTime.value = t;
    u.uRadius.value = sl.size * 0.5 * viewport.dpr;
    u.uMouse.value.set(h.x * viewport.dpr, (size.height - h.y) * viewport.dpr);

    gl.setRenderTarget(post.target);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.render(post.scene, post.cam);
  }, 1);

  return (
    <group ref={holder}>
      <Crystal drive={drive} />
    </group>
  );
}

export default function FooterRock({ active, stage }: { active: boolean; stage: React.RefObject<HTMLElement | null> }) {
  const hover = useRef<Hover>({ inside: false, x: 0, y: 0 });
  const slot = useRef<Slot>({ cx: 0, cy: 0, size: 300 });
  const box = useRef<HTMLDivElement>(null);

  // measure the empty stage between the links and the big name → the stone lives there
  useEffect(() => {
    const el = box.current;
    const st = stage.current;
    if (!el || !st) return;
    const measure = () => {
      const a = el.getBoundingClientRect();
      const b = st.getBoundingClientRect();
      slot.current = {
        cx: b.left - a.left + b.width / 2,
        cy: b.top - a.top + b.height / 2,
        size: Math.min(b.height * 1.08, b.width * 0.8),
      };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(st);
    return () => ro.disconnect();
  }, [stage]);

  // the stage sits on top of the canvas, so listen on the window
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      hover.current = { inside: x >= 0 && y >= 0 && x <= r.width && y <= r.height, x, y };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div ref={box} className="footer__rock">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
        camera={{ fov: 30, position: [0, 0, 9] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
        aria-hidden
      >
        <Aurora
          pointer={() => {
            const el = box.current;
            const h = hover.current;
            if (!el || !h.inside) return { x: 0.5, y: 0.5 };
            return { x: h.x / el.clientWidth, y: 1 - h.y / el.clientHeight };
          }}
          scroll={() => 0.35}
        />
        <Stone hover={hover} slot={slot} />
        <pointLight position={[2, 2, 4]} intensity={20} color="#ffb27a" />
      </Canvas>
    </div>
  );
}