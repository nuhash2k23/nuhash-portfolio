'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { asciiFrag, screenQuadVert } from '@/lib/shaders';
import { createRockGeometry, createShardGeometry, fibonacciSphere, mulberry32 } from '@/lib/geometry';
import { createBrandEnvironment } from '@/lib/environment';

const GLYPHS = ' .:-=+*#%@';

function glyphAtlas() {
  const cell = 48;
  const c = document.createElement('canvas');
  c.width = cell * GLYPHS.length;
  c.height = cell;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff';
  g.font = `700 ${cell * 0.82}px ui-monospace, Menlo, monospace`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = 0; i < GLYPHS.length; i++) g.fillText(GLYPHS[i], i * cell + cell / 2, cell / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  return t;
}

type Piece = { home: THREE.Vector3; pos: THREE.Vector3; vel: THREE.Vector3; dir: THREE.Vector3; rot: THREE.Euler; spin: THREE.Vector3; scale: THREE.Vector3 };

/**
 * Rock close-up made of pieces. Hover pushes pieces off (zero gravity drift),
 * leaving the rock pulls them home. Around the cursor the render turns to ASCII.
 */
function RockPost({ hover }: { hover: React.MutableRefObject<{ inside: boolean; x: number; y: number }> }) {
  const { gl, size, viewport } = useThree();
  const N = 110;

  const world = useMemo(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, 7.5);
    const env = createBrandEnvironment(gl);
    scene.environment = env;

    const core = new THREE.Mesh(
      createRockGeometry(3, 19),
      new THREE.MeshStandardMaterial({ color: '#140504', emissive: '#ff4d1c', emissiveIntensity: 0.25, roughness: 0.4, metalness: 0.3, flatShading: true }),
    );
    core.scale.setScalar(1.0);
    const group = new THREE.Group();
    scene.add(group);
    group.add(core);

    const shard = createShardGeometry(23);
    const mat = new THREE.MeshPhysicalMaterial({
      color: '#1a0706',
      metalness: 0.2,
      roughness: 0.05,
      clearcoat: 1,
      iridescence: 0.7,
      envMapIntensity: 2.4,
      flatShading: true,
    });
    const mesh = new THREE.InstancedMesh(shard, mat, N);
    mesh.frustumCulled = false;
    group.add(mesh);

    const key = new THREE.PointLight('#ff9a4d', 18, 12, 2);
    key.position.set(2, 2, 4);
    scene.add(key);

    const rnd = mulberry32(9);
    const pieces: Piece[] = [];
    for (let i = 0; i < N; i++) {
      const dir = fibonacciSphere(i, N).clone();
      const home = dir.clone().multiplyScalar(1.28);
      home.y *= 1.1;
      const s = 0.32 + rnd() * 0.16;
      pieces.push({
        home,
        pos: home.clone(),
        vel: new THREE.Vector3(),
        dir,
        rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
        spin: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5),
        scale: new THREE.Vector3(s * (0.8 + rnd() * 0.4), s * (0.8 + rnd() * 0.4), s * (0.45 + rnd() * 0.3)),
      });
    }

    const target = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true });
    const postScene = new THREE.Scene();
    const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const post = new THREE.ShaderMaterial({
      vertexShader: screenQuadVert,
      fragmentShader: asciiFrag,
      uniforms: {
        uScene: { value: target.texture },
        uGlyphs: { value: glyphAtlas() },
        uRes: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(-999, -999) },
        uCell: { value: 10 },
        uRadius: { value: 160 },
        uGlyphCount: { value: GLYPHS.length },
        uHover: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post);
    quad.frustumCulled = false;
    postScene.add(quad);

    return { scene, camera, env, group, core, mesh, mat, shard, pieces, target, postScene, postCam, post };
  }, [gl]);

  useEffect(() => {
    const w = Math.floor(size.width * viewport.dpr);
    const h = Math.floor(size.height * viewport.dpr);
    world.target.setSize(w, h);
    world.post.uniforms.uRes.value.set(w, h);
    world.post.uniforms.uCell.value = Math.round(9 * viewport.dpr);
    world.post.uniforms.uRadius.value = 170 * viewport.dpr;
    world.camera.aspect = size.width / Math.max(1, size.height);
    world.camera.updateProjectionMatrix();
  }, [size, viewport.dpr, world]);

  useEffect(
    () => () => {
      world.env.dispose();
      world.target.dispose();
      world.post.dispose();
      world.mat.dispose();
      world.shard.dispose();
      world.core.geometry.dispose();
      (world.core.material as THREE.Material).dispose();
      (world.post.uniforms.uGlyphs.value as THREE.Texture).dispose();
    },
    [world],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const proj = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const hoverAmt = useRef(0);

  // priority 1: we render ourselves (scene → target → ASCII pass → screen)
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const h = hover.current;
    const { pieces, mesh, camera, group } = world;
    group.rotation.y = t * 0.12;
    group.rotation.x = Math.sin(t * 0.3) * 0.12;
    group.position.y = Math.sin(t * 0.7) * 0.08;
    group.updateMatrixWorld();

    // is the pointer on the rock?
    const pxR = 160;
    let onRock = false;
    if (h.inside) {
      proj.set(0, group.position.y, 0).project(camera);
      const cx = (proj.x * 0.5 + 0.5) * size.width;
      const cy = (-proj.y * 0.5 + 0.5) * size.height;
      onRock = Math.hypot(h.x - cx, h.y - cy) < size.height * 0.33;
    }
    hoverAmt.current += ((onRock ? 1 : 0) - hoverAmt.current) * (1 - Math.pow(0.002, dt));

    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      if (onRock) {
        // pieces near the cursor get a push and keep drifting — no gravity
        proj.copy(p.pos).applyMatrix4(group.matrixWorld).project(camera);
        const sx = (proj.x * 0.5 + 0.5) * size.width;
        const sy = (-proj.y * 0.5 + 0.5) * size.height;
        const d = Math.hypot(sx - h.x, sy - h.y);
        if (d < pxR && p.pos.distanceTo(p.home) < 2.5) {
          const k = (1 - d / pxR) * 6 * dt;
          p.vel.addScaledVector(p.dir, k);
          p.vel.x += (Math.random() - 0.5) * k * 0.6;
          p.vel.y += (Math.random() - 0.5) * k * 0.6;
        }
        p.vel.multiplyScalar(Math.pow(0.6, dt)); // space: very little drag
      } else {
        // spring home
        p.vel.addScaledVector(proj.copy(p.home).sub(p.pos), 9 * dt);
        p.vel.multiplyScalar(Math.pow(0.02, dt));
      }
      p.pos.addScaledVector(p.vel, dt * 3);
      const away = p.pos.distanceTo(p.home);
      dummy.position.copy(p.pos);
      dummy.scale.copy(p.scale);
      dummy.lookAt(look.copy(p.pos).add(p.dir)); // plates face outward like a shell
      dummy.rotateZ(p.rot.z + p.spin.z * away * 2);
      dummy.rotateX(p.spin.x * away * 2.5); // tumble once it drifts
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    const u = world.post.uniforms;
    u.uHover.value = hoverAmt.current;
    u.uMouse.value.set(h.x * viewport.dpr, (size.height - h.y) * viewport.dpr);

    gl.setRenderTarget(world.target);
    gl.setClearColor('#050303', 1);
    gl.clear();
    gl.render(world.scene, camera);
    gl.setRenderTarget(null);
    gl.render(world.postScene, world.postCam);
  }, 1);

  return null;
}

export default function FooterRock({ active }: { active: boolean }) {
  const hover = useRef({ inside: false, x: 0, y: 0 });
  return (
    <div
      className="footer__rock"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        hover.current = { inside: true, x: e.clientX - r.left, y: e.clientY - r.top };
      }}
      onPointerLeave={() => (hover.current.inside = false)}
    >
      <Canvas frameloop={active ? 'always' : 'never'} dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }} aria-hidden>
        <RockPost hover={hover} />
      </Canvas>
    </div>
  );
}
