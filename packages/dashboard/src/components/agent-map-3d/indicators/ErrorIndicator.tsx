import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { Group } from 'three';
import type { IndicatorProps } from './index.js';

export function ErrorIndicator({ position }: IndicatorProps) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const scale = 1.0 + Math.sin(t * 3) * 0.1;
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  const redMat = <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />;

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <group ref={groupRef}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[4, 24, 3]} />{redMat}
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[4, 24, 3]} />{redMat}
          </mesh>
        </group>
      </Float>
    </group>
  );
}
