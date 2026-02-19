import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { Group } from 'three';
import type { IndicatorProps } from './index.js';

export function SearchingIndicator({ position }: IndicatorProps) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.4;
    }
  });

  const blueMat = <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />;

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <group ref={groupRef}>
          <mesh>
            <torusGeometry args={[9, 2.5, 16, 32]} />{blueMat}
          </mesh>
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[6.5, 32]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.2} transparent opacity={0.3} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]} position={[8, -8, 0]}>
            <cylinderGeometry args={[2, 1.5, 14, 8]} />{blueMat}
          </mesh>
        </group>
      </Float>
    </group>
  );
}
