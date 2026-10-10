import * as THREE from 'three';
import { withScreenDissolve } from '@/lib/diamond';
import { snoise } from '@/lib/shaders';
import type { ScreenBurn } from '@/components/three/Crystal';

export type FrostedOptions = {
  /** share the scene burn front so the glass dissolves with everything else */
  burn?: ScreenBurn;
  /** base glass tint */
  tint?: THREE.ColorRepresentation;
  /** 0 = clear, 1 = fully milky. Drives roughness, which is what makes glass frosted. */
  frost?: number;
  /** faint warm glow hinting at the burning core behind the glass */
  glow?: number;
};

/**
 * Frosted glass: real transmission (the scene shows through), with roughness high enough
 * to blur what is behind it. Built on MeshPhysicalMaterial so refraction and the env
 * reflections are physically based, not faked.
 */
export function makeFrostedGlass(opts: FrostedOptions = {}): THREE.MeshPhysicalMaterial {
  const frost = THREE.MathUtils.clamp(opts.frost ?? 0.55, 0, 1);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(opts.tint ?? '#e6eef6'),
    metalness: 0,
    roughness: 0.2 + frost * 0.4, // 0.2 clear → 0.6 very frosted
    transmission: 1,
    thickness: 0.8,
    ior: 1.5,
    specularIntensity: 0.6,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
    attenuationColor: new THREE.Color('#bcd4e6'),
    attenuationDistance: 1.2,
    envMapIntensity: 1.4,
    emissive: new THREE.Color('#ff6a3d'),
    emissiveIntensity: opts.glow ?? 0.06,
  });

  if (opts.burn) {
    withScreenDissolve(mat, opts.burn, snoise, `frost-${mat.uuid}`);
  }
  return mat;
}
