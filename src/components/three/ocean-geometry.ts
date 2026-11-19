import * as THREE from "three";

export type OceanGeometryHandle = {
  geometry: THREE.PlaneGeometry;
  update: (time: number) => void;
  dispose: () => void;
};

/** Procedural wave mesh kept outside React so per-frame mutation stays isolated. */
export function createOceanGeometry(): OceanGeometryHandle {
  const geometry = new THREE.PlaneGeometry(140, 140, 48, 48);
  const base = Float32Array.from(geometry.attributes.position.array);

  return {
    geometry,
    update(time: number) {
      const position = geometry.attributes.position as THREE.BufferAttribute;
      for (let index = 0; index < position.count; index += 1) {
        const x = base[index * 3];
        const y = base[index * 3 + 1];
        position.setZ(
          index,
          Math.sin(x * 0.15 + time * 0.7) * 0.32 +
            Math.cos(y * 0.12 + time * 0.55) * 0.26 +
            Math.sin((x + y) * 0.06 + time * 0.35) * 0.16,
        );
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
    },
    dispose() {
      geometry.dispose();
    },
  };
}
