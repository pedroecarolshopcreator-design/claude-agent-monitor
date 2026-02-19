import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { Mesh } from 'three';
import type { IndicatorProps } from './index.js';

export function ManagingIndicator({ position }: IndicatorProps) {
  const gearRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (gearRef.current) {
      gearRef.current.rotation.z = clock.getElapsedTime() * 0.8;
    }
  });

  const orangeMat = <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} />;

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <mesh ref={gearRef}>
          <torusGeometry args={[10, 3, 6, 8]} />{orangeMat}
        </mesh>
        <mesh>
          <circleGeometry args={[5, 32]} />{orangeMat}
        </mesh>
      </Float>
    </group>
  );
}
