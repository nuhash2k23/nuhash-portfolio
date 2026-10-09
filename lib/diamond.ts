import * as THREE from 'three';

/**
 * Clear, cut-diamond material: full transmission, diamond IOR and rainbow dispersion.
 * It refracts whatever is rendered behind it (the red/orange lights), so it never looks plastic.
 */
export function createDiamondMaterial(opts: { dispersion?: number; thickness?: number } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness: 0,
    transmission: 1,
    thickness: opts.thickness ?? 1.5,
    ior: 2.42,
    dispersion: opts.dispersion ?? 6,
    specularIntensity: 1,
    specularColor: new THREE.Color('#ffffff'),
    attenuationColor: new THREE.Color('#ffe6dc'),
    attenuationDistance: 4,
    iridescence: 0.2,
    iridescenceIOR: 1.3,
    envMapIntensity: 2.2,
    flatShading: true,
  });
}

export type ScreenDissolveUniforms = {
  uDissolve: { value: number };
  uTime: { value: number };
  uRes: { value: THREE.Vector2 };
  uAspect: { value: number };
};

/** Same screen-space burn edge as the aurora: same noise, threshold and orange rim. */
// ↓↓↓ THIS LINE CHANGED: generic <M>, takes `mat: M`, returns `M`
export function withScreenDissolve<M extends THREE.Material>(
  mat: M,
  u: ScreenDissolveUniforms,
  snoiseGLSL: string,
  key = 'screen-dissolve',
): M {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uDissolve;
        uniform float uTime;
        uniform vec2 uRes;
        uniform float uAspect;
        ${snoiseGLSL}
        float sdEdge(){
          vec2 suv = gl_FragCoord.xy / uRes;
          float n = snoise(vec3(suv * vec2(uAspect, 1.0) * 3.2, uTime * 0.25)) * 0.5 + 0.5;
          float edge = suv.y + (n - 0.5) * 0.28;
          float th = uDissolve * 1.4 - 0.2;
          return edge - th;
        }`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float dEdge = sdEdge();
        if (uDissolve > 0.001 && dEdge < 0.0) discard;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float live = step(0.001, uDissolve) * step(uDissolve, 0.999);
        float rim = (smoothstep(0.035, 0.0, abs(dEdge)) + smoothstep(0.12, 0.0, dEdge) * 0.35) * live;
        totalEmissiveRadiance += vec3(1.0, 0.36, 0.1) * rim * 4.0;`,
      );
  };
  mat.customProgramCacheKey = () => key;
  return mat;
}