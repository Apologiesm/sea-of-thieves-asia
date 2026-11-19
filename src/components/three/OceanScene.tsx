"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { voyageStore } from "@/lib/scroll/voyage-store";
import { createOceanGeometry } from "./ocean-geometry";

type OceanSceneProps = {
  active: boolean;
  onReady: () => void;
};

function makeRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

type Keyframe = {
  p: number;
  camera: [number, number, number];
  look: [number, number, number];
  ship: [number, number, number];
  shipY: number;
  fog: [number, number];
  moon: [number, number, number];
  light: number;
  ocean: string;
};

const KEYFRAMES: readonly Keyframe[] = [
  {
    p: 0,
    camera: [0, 3.1, 12],
    look: [0, 0, 0],
    ship: [0.4, -0.2, 0],
    shipY: -0.22,
    fog: [20, 72],
    moon: [-9, 8, -22],
    light: 0.85,
    ocean: "#0d3038",
  },
  {
    p: 0.33,
    camera: [4.5, 2.6, 9.5],
    look: [-0.5, 0.4, -1],
    ship: [-1.2, -0.25, -2],
    shipY: 0.35,
    fog: [16, 60],
    moon: [-6, 9, -20],
    light: 1,
    ocean: "#0e3540",
  },
  {
    p: 0.66,
    camera: [-5, 4.2, 8.5],
    look: [0.5, 0.2, -3],
    ship: [1.6, -0.2, -5],
    shipY: -0.5,
    fog: [14, 55],
    moon: [2, 10, -18],
    light: 1.1,
    ocean: "#103a43",
  },
  {
    p: 1,
    camera: [0, 2.4, 6.5],
    look: [0, 0.8, -8],
    ship: [0, -0.15, -8],
    shipY: 0,
    fog: [10, 45],
    moon: [6, 11, -16],
    light: 1.2,
    ocean: "#123d45",
  },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpTuple(a: readonly number[], b: readonly number[], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function sample(progress: number) {
  let index = 0;
  while (index < KEYFRAMES.length - 2 && progress > KEYFRAMES[index + 1].p) {
    index += 1;
  }
  const from = KEYFRAMES[index];
  const to = KEYFRAMES[index + 1];
  const t = Math.min(1, Math.max(0, (progress - from.p) / (to.p - from.p)));

  return {
    camera: lerpTuple(from.camera, to.camera, t),
    look: lerpTuple(from.look, to.look, t),
    ship: lerpTuple(from.ship, to.ship, t),
    shipY: lerp(from.shipY, to.shipY, t),
    fog: [lerp(from.fog[0], to.fog[0], t), lerp(from.fog[1], to.fog[1], t)],
    moon: lerpTuple(from.moon, to.moon, t),
    light: lerp(from.light, to.light, t),
    oceanColor: new THREE.Color(from.ocean).lerp(new THREE.Color(to.ocean), t),
    skyColor: new THREE.Color("#06121a").lerp(new THREE.Color("#08222a"), t),
  };
}

function Atmosphere() {
  const backgroundRef = useRef<THREE.Color>(null);
  const fogRef = useRef<THREE.Fog>(null);

  useFrame(() => {
    const sampled = sample(voyageStore.progress);
    backgroundRef.current?.copy(sampled.skyColor);
    if (fogRef.current) {
      fogRef.current.near = sampled.fog[0];
      fogRef.current.far = sampled.fog[1];
      fogRef.current.color.copy(sampled.skyColor);
    }
  });

  return (
    <>
      <color ref={backgroundRef} attach="background" args={["#06121a"]} />
      <fog ref={fogRef} attach="fog" args={["#06121a", 20, 72]} />
    </>
  );
}

function Ocean() {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ocean = useMemo(() => createOceanGeometry(), []);

  useEffect(() => () => ocean.dispose(), [ocean]);

  useFrame(({ clock }) => {
    if (!voyageStore.reducedMotion) {
      ocean.update(clock.getElapsedTime());
    }
    const sampled = sample(voyageStore.progress);
    if (materialRef.current) materialRef.current.color.copy(sampled.oceanColor);
  });

  return (
    <mesh geometry={ocean.geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
      <meshStandardMaterial
        ref={materialRef}
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
    const sampled = sample(voyageStore.progress);
    const time = clock.getElapsedTime();
    const motion = voyageStore.reducedMotion ? 0 : 1 - voyageStore.progress * 0.5;

    group.current.position.set(
      sampled.ship[0],
      sampled.ship[1] + Math.sin(time * 0.85) * 0.16 * motion,
      sampled.ship[2],
    );
    group.current.rotation.set(
      Math.sin(time * 0.48 + 1) * 0.028 * motion,
      sampled.shipY + voyageStore.mouseX * 0.02,
      Math.sin(time * 0.62) * 0.045 * motion,
    );
  });

  return (
    <group ref={group} position={[0.4, -0.2, 0]} scale={0.82} rotation={[0, -0.22, 0]}>
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
      <mesh position={[0.15, 2.0, 0]}>
        <cylinderGeometry args={[0.055, 0.085, 3.3, 6]} />
        <meshStandardMaterial color="#5b4831" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.2, 2.12, 0.06]}>
        <planeGeometry args={[1.55, 1.85, 4, 4]} />
        <meshStandardMaterial color="#c9c4ad" roughness={1} side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[0.62, 3.36, 0.04]}>
        <planeGeometry args={[0.62, 0.34]} />
        <meshStandardMaterial color="#8fa9a5" roughness={1} side={THREE.DoubleSide} />
      </mesh>
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
      points.push(Math.cos(angle) * radius, 5 + random() * 24, Math.sin(angle) * radius - 12);
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return result;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#d6e4e6" size={0.16} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

function Moon() {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const sampled = sample(voyageStore.progress);
    group.current.position.set(sampled.moon[0], sampled.moon[1], sampled.moon[2]);
  });

  return (
    <group ref={group} position={[-9, 8, -22]}>
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
      <mesh position={[-16, -0.6, -26]}>
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
      child.position.y = 1.2 + (voyageStore.reducedMotion ? 0 : Math.sin(time * 0.6 + index * 1.7) * 0.28);
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

function VoyageCamera() {
  const { camera } = useThree();
  const smoothed = useRef(0);
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));
  const desired = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const damping = 1 - Math.exp(-Math.min(delta, 0.1) * 4.5);
    smoothed.current += (voyageStore.progress - smoothed.current) * damping;

    const sampled = sample(smoothed.current);
    const parallaxX = voyageStore.reducedMotion ? 0 : voyageStore.mouseX * 0.35;
    const parallaxY = voyageStore.reducedMotion ? 0 : voyageStore.mouseY * 0.22;

    desired.current.set(
      sampled.camera[0] + parallaxX,
      sampled.camera[1] + parallaxY,
      sampled.camera[2],
    );
    camera.position.lerp(desired.current, damping);
    lookTarget.current.lerp(
      new THREE.Vector3(sampled.look[0], sampled.look[1], sampled.look[2]),
      damping,
    );
    camera.lookAt(lookTarget.current);
  });

  return null;
}

function MoonLight() {
  const light = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (!light.current) return;
    const sampled = sample(voyageStore.progress);
    light.current.intensity = sampled.light;
    light.current.position.set(sampled.moon[0], sampled.moon[1], sampled.moon[2] + 14);
  });

  return <directionalLight ref={light} position={[-9, 8, -6]} intensity={0.85} color="#cfe3ff" />;
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
      <Atmosphere />
      <ambientLight intensity={0.65} color="#8fb8c2" />
      <MoonLight />
      <Stars />
      <Moon />
      <Islands />
      <Ocean />
      <Ship />
      <Lanterns />
      <VoyageCamera />
    </Canvas>
  );
}
