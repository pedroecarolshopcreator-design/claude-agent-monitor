import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import type { IndicatorProps } from './index.js';

export function CodingIndicator({ position }: IndicatorProps) {
  const screenRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 1.2) * 0.12;
    }
    if (screenRef.current) {
      const mat = screenRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3;
    }
  });

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <group ref={groupRef}>
          <mesh>
            <boxGeometry args={[30, 20, 2]} />
            <meshStandardMaterial color="#111122" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh ref={screenRef} position={[0, 0, 1.2]}>
            <boxGeometry args={[26, 16, 0.5]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} transparent opacity={0.85} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}
