'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { live } from '@/lib/state';
import { createBrandEnvironment } from '@/lib/environment';

/** Extruded "N" until /public/logo.glb exists — then the glb is used instead. */
function letterN() {
  const s = new THREE.Shape();
  const pts: [number, number][] = [
    [0, 0], [0.27, 0], [0.27, 0.6], [0.73, 0], [1, 0], [1, 1], [0.73, 1], [0.73, 0.4], [0.27, 1], [0, 1],
  ];
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x - 0.5, y - 0.5) : s.lineTo(x - 0.5, y - 0.5)));
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.26,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 4,
  });
  geo.center();
  return geo;
}

function Mark() {
  const { gl, scene } = useThree();
  const group = useRef<THREE.Group>(null);
  const [glb, setGlb] = useState<THREE.Object3D | null>(null);
  const geo = useMemo(() => letterN(), []);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ff5a1f',
        metalness: 0.85,
        roughness: 0.18,
        clearcoat: 1,
        envMapIntensity: 1.6,
      }),
    [],
  );

  useEffect(() => {
    const env = createBrandEnvironment(gl);
    scene.environment = env;
    // use the real logo when it exists
    let cancelled = false;
    fetch('/logo.glb', { method: 'HEAD' })
      .then(async (r) => {
        if (!r.ok || cancelled) return;
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        new GLTFLoader().load('/logo.glb', (g) => {
          if (cancelled) return;
          const box = new THREE.Box3().setFromObject(g.scene);
          const size = box.getSize(new THREE.Vector3()).length() || 1;
          g.scene.scale.setScalar(1.4 / size);
          box.setFromObject(g.scene);
          g.scene.position.sub(box.getCenter(new THREE.Vector3()));
          setGlb(g.scene);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      env.dispose();
      geo.dispose();
      mat.dispose();
    };
  }, [gl, scene, geo, mat]);

  const spin = useRef(0);
  useFrame((s, dt) => {
    // rotates with page scroll, plus a slow idle turn
    const target = live.scroll * Math.PI * 6;
    spin.current += (target - spin.current) * (1 - Math.pow(0.002, dt));
    if (group.current) {
      group.current.rotation.y = spin.current + s.clock.elapsedTime * 0.25;
      group.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.6) * 0.15;
    }
  });

  return (
    <group ref={group}>
      {glb ? <primitive object={glb} /> : <mesh geometry={geo} material={mat} />}
    </group>
  );
}

export default function NavLogo() {
  return (
    <div className="nav-logo" aria-hidden>
      <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ fov: 30, position: [0, 0, 3.4] }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 3, 4]} intensity={1.5} />
        <Mark />
      </Canvas>
    </div>
  );
}
