'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLOBE_DOTS } from '@/lib/globeDots';
import type { Place } from '@/lib/countries';
import {
  GLYPHS,
  arcFrag,
  arcVert,
  dotFrag,
  dotVert,
  markerFrag,
  markerVert,
  shellFrag,
  shellVert,
} from '@/lib/globeShaders';

/** Scroll-driven values, written by the section's GSAP timeline. */
export type GlobeAnim = { reveal: number; markers: number; arcs: number; spin: number; theme: number };

const D2R = Math.PI / 180;
/** lon/lat → point on the sphere. lon 0 faces the camera (+z). */
const ll = (lon: number, lat: number, r = 1, out = new THREE.Vector3()) =>
  out.set(Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R)).multiplyScalar(r);

const LIGHT = new THREE.Color('#f6f4f0');
const DARK = new THREE.Color('#0b0908');
const ORANGE = new THREE.Color('#ff5a1f');
const RED = new THREE.Color('#e0221c');

/** Draws the glyph ramp into a texture: one cell per character. */
function makeAtlas() {
  const cell = 64;
  const c = document.createElement('canvas');
  c.width = cell * GLYPHS.length;
  c.height = cell;
  const tex = new THREE.CanvasTexture(c);
  const draw = () => {
    const g = c.getContext('2d');
    if (!g) return;
    const mono = getComputedStyle(document.documentElement).getPropertyValue('--f-mono').trim() || 'monospace';
    g.fillStyle = '#000';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 ${cell * 0.86}px ${mono}`;
    [...GLYPHS].forEach((ch, i) => g.fillText(ch, i * cell + cell / 2, cell * 0.54));
    tex.needsUpdate = true;
  };
  draw();
  document.fonts?.ready.then(draw); // redraw once the site's mono font is loaded
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

type Props = {
  places: Place[];
  anim: React.MutableRefObject<GlobeAnim>;
  /** name of the country whose review is showing — the globe turns to face it */
  focus: React.MutableRefObject<string | null>;
  /** DOM layer holding elements with data-anchor="<country>" — they are pinned to the markers */
  overlay: React.RefObject<HTMLDivElement | null>;
  ascii: boolean;
};

function World({ places, anim, focus, overlay, ascii }: Props) {
  const { size, camera, gl } = useThree();
  const globe = useRef<THREE.Group>(null);
  const home = places.find((p) => p.home) ?? places[0];
  const others = useMemo(() => places.filter((p) => p !== home), [places, home]);

  /* ---------- land glyphs ---------- */
  const dots = useMemo(() => {
    const n = GLOBE_DOTS.length / 2;
    const pos = new Float32Array(n * 3);
    const rnd = new Float32Array(n);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      ll(GLOBE_DOTS[i * 2], GLOBE_DOTS[i * 2 + 1], 1, v).toArray(pos, i * 3);
      rnd[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
    const atlas = makeAtlas();
    const m = new THREE.ShaderMaterial({
      vertexShader: dotVert,
      fragmentShader: dotFrag,
      uniforms: {
        uSize: { value: 8 },
        uReveal: { value: 0 },
        uSweep: { value: 0 },
        uHome: { value: ll(home.lon, home.lat) },
        uFocus: { value: new THREE.Vector3(0, 0, 1) },
        uFocusAmt: { value: 0 },
        uTime: { value: 0 },
        uAtlas: { value: atlas },
        uGlyphs: { value: GLYPHS.length },
        uAscii: { value: ascii ? 1 : 0 },
        uColor: { value: DARK.clone() },
        uAccent: { value: ORANGE },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false, // the far side shows through, faintly
    });
    return { g, m, atlas };
  }, [home, ascii]);

  /* ---------- body, rim and an invisible occluder (hides arcs/markers behind the globe) ---------- */
  const shell = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 64, 48);
    const m = new THREE.ShaderMaterial({
      vertexShader: shellVert,
      fragmentShader: shellFrag,
      uniforms: { uColor: { value: DARK.clone() }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
    });
    const occ = new THREE.MeshBasicMaterial({ colorWrite: false });
    return { g, m, occ };
  }, []);

  /* ---------- arcs from home to every country ---------- */
  const arcs = useMemo(() => {
    const a = ll(home.lon, home.lat);
    const parts: THREE.BufferGeometry[] = [];
    others.forEach((p, i) => {
      const b = ll(p.lon, p.lat);
      const ang = a.angleTo(b);
      const h = 0.05 + 0.2 * (ang / Math.PI);
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 48; k++) {
        const t = k / 48;
        // slerp along the great circle, lifted off the surface in the middle
        const v = new THREE.Vector3().copy(a).multiplyScalar(Math.sin((1 - t) * ang)).addScaledVector(b, Math.sin(t * ang));
        v.divideScalar(Math.sin(ang) || 1).normalize().multiplyScalar(1.005 + h * Math.sin(Math.PI * t));
        pts.push(v);
      }
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.0032, 4, false);
      const order = new Float32Array(tube.attributes.position.count).fill(others.length > 1 ? i / (others.length - 1) : 0);
      tube.setAttribute('aOrder', new THREE.BufferAttribute(order, 1));
      parts.push(tube);
    });
    const g = parts.length ? mergeGeometries(parts) : new THREE.BufferGeometry();
    parts.forEach((p) => p.dispose());
    const m = new THREE.ShaderMaterial({
      vertexShader: arcVert,
      fragmentShader: arcFrag,
      uniforms: { uDraw: { value: 0 }, uTime: { value: 0 }, uColor: { value: ORANGE }, uHot: { value: new THREE.Color('#ffd2b0') } },
      transparent: true,
      depthWrite: false,
    });
    return { g, m };
  }, [home, others]);

  /* ---------- markers (dot + ping) ---------- */
  const markers = useMemo(() => {
    const all = [home, ...others];
    const mk = (geo: THREE.BufferGeometry, mode: number) => {
      const m = new THREE.ShaderMaterial({
        vertexShader: markerVert,
        fragmentShader: markerFrag,
        uniforms: { uShow: { value: 0 }, uTime: { value: 0 }, uMode: { value: mode }, uColor: { value: ORANGE }, uHomeColor: { value: RED } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const order = new Float32Array(all.length);
      const isHome = new Float32Array(all.length);
      all.forEach((p, i) => {
        order[i] = p === home ? 0 : 0.15 + 0.85 * ((i - 1) / Math.max(1, all.length - 2));
        isHome[i] = p === home ? 1 : 0;
      });
      geo.setAttribute('aOrder', new THREE.InstancedBufferAttribute(order, 1));
      geo.setAttribute('aHome', new THREE.InstancedBufferAttribute(isHome, 1));
      const mesh = new THREE.InstancedMesh(geo, m, all.length);
      const o = new THREE.Object3D();
      all.forEach((p, i) => {
        ll(p.lon, p.lat, 1.004, o.position);
        o.lookAt(o.position.clone().multiplyScalar(2));
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
      });
      mesh.frustumCulled = false;
      return mesh;
    };
    return {
      all,
      dot: mk(new THREE.CircleGeometry(0.014, 20), 0),
      ring: mk(new THREE.RingGeometry(0.02, 0.026, 40), 1),
      local: all.map((p) => ll(p.lon, p.lat, 1.004)),
    };
  }, [home, others]);

  useEffect(
    () => () => {
      dots.g.dispose();
      dots.m.dispose();
      dots.atlas.dispose();
      shell.g.dispose();
      shell.m.dispose();
      shell.occ.dispose();
      arcs.g.dispose();
      arcs.m.dispose();
      [markers.dot, markers.ring].forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
        m.dispose();
      });
    },
    [dots, shell, arcs, markers],
  );

  /* ---------- rotation: drag, drift with scroll, turn to the country being quoted ---------- */
  const rot = useRef({ lon: home.lon, lat: 12, drift: 0, dragging: false, lastX: 0, lastY: 0, dragLon: 0, dragLat: 0, hold: 0 });
  const pointer = useRef({ x: -1e4, y: -1e4 });
  useEffect(() => {
    const el = gl.domElement;
    const r = rot.current;
    const down = (e: PointerEvent) => {
      r.dragging = true;
      r.lastX = e.clientX;
      r.lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      pointer.current = { x: e.clientX - b.left, y: e.clientY - b.top };
      if (!r.dragging) return;
      r.dragLon -= (e.clientX - r.lastX) * 0.25;
      r.dragLat = THREE.MathUtils.clamp(r.dragLat + (e.clientY - r.lastY) * 0.2, -40, 40);
      r.lastX = e.clientX;
      r.lastY = e.clientY;
      r.hold = 3; // seconds before the globe goes back to following the reviews
    };
    const up = () => (r.dragging = false);
    const leave = () => (pointer.current = { x: -1e4, y: -1e4 });
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('pointerleave', leave);
    };
  }, [gl]);

  const col = useMemo(() => new THREE.Color(), []);
  const w = useMemo(() => new THREE.Vector3(), []);
  const n = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const focusAmt = useRef(0);
  const hovered = useRef<string | null>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const a = anim.current;
    const r = rot.current;

    // where should the globe face?
    const f = focus.current ? markers.all.find((p) => p.name === focus.current) : null;
    r.hold = Math.max(0, r.hold - dt);
    r.drift += dt * 2.5; // degrees per second, a slow idle turn
    let tLon: number, tLat: number;
    if (f && r.hold <= 0) {
      tLon = f.lon;
      tLat = THREE.MathUtils.clamp(f.lat * 0.7, -30, 40);
      r.drift = 0;
      r.dragLon *= 0.9;
      r.dragLat *= 0.9;
    } else {
      tLon = home.lon - 30 + a.spin * 70 + r.drift;
      tLat = 14;
    }
    tLon += r.dragLon;
    tLat += r.dragLat;
    // shortest way round
    const dl = ((tLon - r.lon + 540) % 360) - 180;
    const k = 1 - Math.exp(-dt * (r.dragging ? 12 : 2.2));
    r.lon += dl * k;
    r.lat += (tLat - r.lat) * k;
    if (globe.current) globe.current.rotation.set(r.lat * D2R, -r.lon * D2R, 0);

    // theme: dark glyphs on white → light glyphs on black
    col.copy(DARK).lerp(LIGHT, a.theme);
    const du = dots.m.uniforms;
    du.uColor.value.copy(col);
    shell.m.uniforms.uColor.value.copy(col);
    shell.m.uniforms.uOpacity.value = Math.min(1, a.reveal / 1.2);

    // glyph size follows the canvas size (≈ one glyph per land cell)
    du.uSize.value = size.height * 0.0145 * state.viewport.dpr;
    du.uTime.value = t;
    du.uReveal.value = a.reveal;
    du.uSweep.value = a.reveal > 0.01 && a.reveal < 3.3 ? 1 : 0;
    focusAmt.current += ((f ? 1 : 0) - focusAmt.current) * (1 - Math.pow(0.02, dt));
    du.uFocusAmt.value = focusAmt.current;
    if (f) ll(f.lon, f.lat, 1, du.uFocus.value);

    arcs.m.uniforms.uDraw.value = a.arcs;
    arcs.m.uniforms.uTime.value = t;
    [markers.dot, markers.ring].forEach((m) => {
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      u.uShow.value = a.markers;
      u.uTime.value = t;
    });

    /* pin the DOM anchors (bubbles, labels) to their markers */
    const layer = overlay.current;
    if (!layer || !globe.current) return;
    globe.current.updateMatrixWorld();
    camera.getWorldDirection(camDir);
    const screen = new Map<string, { x: number; y: number; vis: number }>();
    let best: string | null = null;
    let bestD = 18; // px
    markers.all.forEach((p, i) => {
      w.copy(markers.local[i]).applyMatrix4(globe.current!.matrixWorld);
      n.copy(w).normalize();
      const facing = -n.dot(camDir);
      w.project(camera);
      const x = (w.x * 0.5 + 0.5) * size.width;
      const y = (-w.y * 0.5 + 0.5) * size.height;
      const vis = THREE.MathUtils.smoothstep(facing, 0.05, 0.3) * (a.markers > 0.05 ? 1 : 0);
      screen.set(p.name, { x, y, vis });
      const d = Math.hypot(pointer.current.x - x, pointer.current.y - y);
      if (vis > 0.5 && d < bestD) {
        bestD = d;
        best = p.name;
      }
    });
    hovered.current = best;

    layer.querySelectorAll<HTMLElement>('[data-anchor]').forEach((el) => {
      const name = el.dataset.anchor === '@hover' ? hovered.current : el.dataset.anchor!;
      const s = name ? screen.get(name) : undefined;
      if (!s) {
        el.style.opacity = '0';
        return;
      }
      if (el.dataset.anchor === '@hover' && el.textContent !== name!.toUpperCase()) el.textContent = name!.toUpperCase();
      el.style.setProperty('--x', `${s.x.toFixed(1)}px`);
      el.style.setProperty('--y', `${s.y.toFixed(1)}px`);
      el.style.opacity = String(s.vis);
      el.classList.toggle('is-left', s.x > size.width * 0.6);
    });
  });

  return (
    <group ref={globe}>
      <mesh geometry={shell.g} material={shell.occ} scale={0.992} renderOrder={-1} />
      <mesh geometry={shell.g} material={shell.m} renderOrder={0} />
      <points geometry={dots.g} material={dots.m} renderOrder={1} />
      <mesh geometry={arcs.g} material={arcs.m} renderOrder={2} />
      <primitive object={markers.ring} renderOrder={3} />
      <primitive object={markers.dot} renderOrder={4} />
    </group>
  );
}

export default function Globe(props: Props & { active: boolean }) {
  const { active, ...rest } = props;
  return (
    <Canvas
      className="globe__canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 28, position: [0, 0, 5] }}
      aria-hidden
    >
      <World {...rest} />
    </Canvas>
  );
}
