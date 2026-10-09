'use client';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Aurora } from '@/components/three/Aurora';

/** The main red/orange light, revealed inside the contact circle. */
export default function ContactAurora({ active }: { active: boolean }) {
  return (
    <Canvas
      className="contact__aurora"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      aria-hidden
    >
      <Aurora scroll={() => 0.2} />
    </Canvas>
  );
}
