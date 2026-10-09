import * as THREE from 'three';

/**
 * Builds a small studio environment in brand colours and bakes it with PMREM.
 * No HDR download needed; reflections pick up red, orange and white light strips.
 */
export function createBrandEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050303');

  const strip = (color: string, intensity: number, w: number, h: number, pos: [number, number, number], rotY = 0) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    m.rotateZ(rotY);
    scene.add(m);
  };

  strip('#ffffff', 6, 6, 1.2, [0, 6, 2]); // key from above
  strip('#ff4d1c', 4, 2.5, 8, [-6, 0, 2]); // red rim left
  strip('#ff8a1f', 3.5, 2.5, 8, [6, 1, -1]); // orange rim right
  strip('#ffffff', 2.2, 8, 0.6, [0, -2, 6], 0.3); // thin white floor kick
  strip('#c1121f', 2, 10, 10, [0, 0, -8]); // deep red back wall

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.03);
  pmrem.dispose();
  scene.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      (o as THREE.Mesh).geometry.dispose();
      ((o as THREE.Mesh).material as THREE.Material).dispose();
    }
  });
  return rt.texture;
}
