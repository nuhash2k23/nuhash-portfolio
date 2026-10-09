import * as THREE from 'three';
import { withScreenDissolve } from '@/lib/diamond';
import { snoise } from '@/lib/shaders';
import type { ScreenBurn } from '@/components/three/Crystal';

/** Uniforms exposed on `material.userData.lava` for per-frame animation. */
export type LavaUniforms = {
  uTime: { value: number };
  uGlow: { value: number };
  uVeinColor: { value: THREE.Color };
  uVeinScale: { value: number };
  uVeinSharp: { value: number };
  uDetailScale: { value: number };
};

export type LavaOptions = {
  /** share the scene burn front so the lava mesh dissolves with everything else */
  burn?: ScreenBurn;
  /** base rock colour (near-black basalt by default) */
  base?: THREE.ColorRepresentation;
  /** HDR vein colour (>1 so it tone-maps hot / is bloom-ready) */
  veinColor?: THREE.Color;
  /** larger = more, finer veins */
  veinScale?: number;
  /** larger = thinner, sharper cracks */
  veinSharp?: number;
};

/**
 * Lava-rock PBR material, done in-shader on top of MeshStandardMaterial so it keeps real
 * lighting / env reflections AND stays compatible with withScreenDissolve (which patches
 * the standard material's shader includes).
 *
 * Look: dark craggy basalt (procedural roughness break-up) with glowing fracture veins
 * running through it — ridged noise cracks with an inner-glow halo, like cooling lava.
 * Animate `material.userData.lava.uTime` and `.uGlow` each frame.
 */
export function makeLavaRock(opts: LavaOptions = {}): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(opts.base ?? '#0c0a09'),
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.6,
  });
  const u: LavaUniforms = {
    uTime: { value: 0 },
    uGlow: { value: 1 },
    uVeinColor: { value: (opts.veinColor ?? new THREE.Color(5.0, 0.35, 0.08)).clone() },
    uVeinScale: { value: opts.veinScale ?? 2.4 },
    uVeinSharp: { value: opts.veinSharp ?? 14.0 },
    uDetailScale: { value: 7.0 },
  };

  // install the dissolve hook first (when a burn front is supplied), then wrap it so BOTH
  // patches run in one compile — each onBeforeCompile assignment replaces the previous one.
  let dissolveHook: THREE.Material['onBeforeCompile'] | undefined;
  if (opts.burn) {
    withScreenDissolve(mat, opts.burn, snoise, `lava-${mat.uuid}`);
    dissolveHook = mat.onBeforeCompile;
  }

  mat.onBeforeCompile = (shader, renderer) => {
    dissolveHook?.(shader, renderer);
    Object.assign(shader.uniforms, u);

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n varying vec3 vLavaPos;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n vLavaPos = position;`);

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vLavaPos;
        uniform float uTime;
        uniform float uGlow;
        uniform vec3  uVeinColor;
        uniform float uVeinScale;
        uniform float uVeinSharp;
        uniform float uDetailScale;
        ${snoise}
        float lavaFbm(vec3 p){
          float f = 0.0, a = 0.5;
          for(int i=0;i<4;i++){ f += a*snoise(p); p*=2.03; a*=0.5; }
          return f;
        }
        float lavaVeins(vec3 p){
          float n = lavaFbm(p * uVeinScale);
          float ridge = pow(clamp(1.0 - abs(n), 0.0, 1.0), uVeinSharp);
          float n2 = lavaFbm(p * uVeinScale * 2.3 + 11.0);
          ridge += pow(clamp(1.0 - abs(n2), 0.0, 1.0), uVeinSharp * 1.6) * 0.6;
          return clamp(ridge, 0.0, 1.0);
        }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        float lavaDetail = lavaFbm(vLavaPos * uDetailScale);
        roughnessFactor = clamp(0.6 + lavaDetail * 0.4, 0.3, 1.0);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float veins = lavaVeins(vLavaPos);
        float halo = pow(veins, 0.5) * 0.35;
        float flick = 0.85 + 0.15 * sin(uTime * 2.0 + vLavaPos.x * 6.0);
        totalEmissiveRadiance += uVeinColor * (veins + halo) * uGlow * flick;
        diffuseColor.rgb *= (1.0 - veins * 0.5);`,
      );
  };

  mat.userData.lava = u;
  return mat;
}
