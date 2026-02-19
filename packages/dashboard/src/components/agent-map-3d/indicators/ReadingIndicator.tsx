import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { Group } from 'three';
import type { IndicatorProps } from './index.js';

export function ReadingIndicator({ position }: IndicatorProps) {
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (leftRef.current) leftRef.current.rotation.y = 0.3 + Math.sin(t * 1.5) * 0.05;
    if (rightRef.current) rightRef.current.rotation.y = -0.3 - Math.sin(t * 1.5) * 0.05;
  });

  const pageMat = <meshStandardMaterial color="#c4b5fd" emissive="#8b5cf6" emissiveIntensity={0.5} />;

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <group ref={leftRef} position={[-7, 0, 0]}>
          <mesh><boxGeometry args={[12, 16, 1]} />{pageMat}</mesh>
        </group>
        <group ref={rightRef} position={[7, 0, 0]}>
          <mesh><boxGeometry args={[12, 16, 1]} />{pageMat}</mesh>
        </group>
        <mesh>
          <boxGeometry args={[2, 16, 2]} />
          <meshStandardMaterial color="#1e1b2e" />
        </mesh>
      </Float>
    </group>
  );
}
