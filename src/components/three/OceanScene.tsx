"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type OceanSceneProps = {
  active: boolean;
  onReady: () => void;
};

/* One scene instance owns this mutable geometry; kept at module scope so the
   per-frame vertex updates are not treated as React hook state mutation. */
const OCEAN_GEOMETRY = new THREE.PlaneGeometry(140, 140, 48, 48);
const OCEAN_BASE = Float32Array.from(OCEAN_GEOMETRY.attributes.position.array);

/* Deterministic pseudo-random so the sky is stable between renders. */
function makeRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function Ocean() {
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const position = OCEAN_GEOMETRY.attributes.position as THREE.BufferAttribute;

    for (let index = 0; index < position.count; index += 1) {
      const x = OCEAN_BASE[index * 3];
      const y = OCEAN_BASE[index * 3 + 1];
      const height =
        Math.sin(x * 0.15 + time * 0.7) * 0.32 +
        Math.cos(y * 0.12 + time * 0.55) * 0.26 +
        Math.sin((x + y) * 0.06 + time * 0.35) * 0.16;
      position.setZ(index, height);
    }

    position.needsUpdate = true;
    OCEAN_GEOMETRY.computeVertexNormals();
  });

  return (
    <mesh geometry={OCEAN_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
      <meshStandardMaterial
        color="#0d3038"
        roughness={0.88}
        metalness={0.08}
        flatShading
      />
    </mesh>
  );
}

function Ship() {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.getElapsedTime();
    group.current.position.y = Math.sin(time * 0.85) * 0.16;
    group.current.rotation.z = Math.sin(time * 0.62) * 0.045;
    group.current.rotation.x = Math.sin(time * 0.48 + 1) * 0.028;
    group.current.rotation.y = Math.sin(time * 0.22) * 0.09;
  });

  return (
    <group ref={group} position={[0.4, -0.2, 0]} scale={0.82} rotation={[0, -0.22, 0]}>
      {/* Hull: tapered low-poly bow and simple block body, entirely procedural. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.1, 0.62, 1.12]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[1.85, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.58, 1.25, 4]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[3.0, 0.09, 0.96]} />
        <meshStandardMaterial color="#6b543a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-1.02, 0.66, 0]}>
        <boxGeometry args={[0.82, 0.52, 0.86]} />
        <meshStandardMaterial color="#4a3728" roughness={0.95} flatShading />
      </mesh>
      {/* Mast and sail */}
      <mesh position={[0.15, 2.0, 0]}>
        <cylinderGeometry args={[0.055, 0.085, 3.3, 6]} />
        <meshStandardMaterial color="#5b4831" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.2, 2.12, 0.06]}>
        <planeGeometry args={[1.55, 1.85, 4, 4]} />
        <meshStandardMaterial
          color="#c9c4ad"
          roughness={1}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      <mesh position={[0.62, 3.36, 0.04]}>
        <planeGeometry args={[0.62, 0.34]} />
        <meshStandardMaterial
          color="#8fa9a5"
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Stern lantern */}
      <mesh position={[-1.42, 0.78, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshBasicMaterial color="#f4c879" />
      </mesh>
    </group>
  );
}

function Stars() {
  const geometry = useMemo(() => {
    const random = makeRandom(20261120);
    const points: number[] = [];
    for (let index = 0; index < 220; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 28 + random() * 26;
      points.push(
        Math.cos(angle) * radius,
        5 + random() * 24,
        Math.sin(angle) * radius - 12,
      );
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return result;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#d6e4e6" size={0.16} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

function Moon() {
  return (
    <group position={[-9, 8, -22]}>
      <mesh>
        <sphereGeometry args={[1.15, 20, 16]} />
        <meshBasicMaterial color="#dfe9e0" />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.75, 16, 12]} />
        <meshBasicMaterial
          color="#9fc4c9"
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Islands() {
  return (
    <group>
      <mesh position={[-16, -0.6, -26]} scale={[1, 1, 1]}>
        <coneGeometry args={[4.5, 3.4, 5]} />
        <meshStandardMaterial color="#0c2029" roughness={1} flatShading />
      </mesh>
      <mesh position={[15, -1.1, -32]}>
        <coneGeometry args={[6, 4.2, 5]} />
        <meshStandardMaterial color="#0a1c24" roughness={1} flatShading />
      </mesh>
      <mesh position={[3, -1.3, -38]}>
        <coneGeometry args={[3.6, 2.4, 4]} />
        <meshStandardMaterial color="#0b1e26" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

function Lanterns() {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.getElapsedTime();
    group.current.children.forEach((child, index) => {
      child.position.y = 1.2 + Math.sin(time * 0.6 + index * 1.7) * 0.28;
    });
  });

  return (
    <group ref={group}>
      {[-4.5, 5.2, 8.1].map((x) => (
        <mesh key={x} position={[x, 1.2, -3]}>
          <sphereGeometry args={[0.13, 8, 6]} />
          <meshBasicMaterial color="#e8b866" />
        </mesh>
      ))}
    </group>
  );
}

export default function OceanScene({ active, onReady }: OceanSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 3.1, 12], fov: 48 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={onReady}
    >
      <color attach="background" args={["#06121a"]} />
      <fog attach="fog" args={["#06121a", 20, 72]} />
      <ambientLight intensity={0.65} color="#8fb8c2" />
      <directionalLight position={[-9, 8, -6]} intensity={0.85} color="#cfe3ff" />
      <Stars />
      <Moon />
      <Islands />
      <Ocean />
      <Ship />
      <Lanterns />
    </Canvas>
  );
}
