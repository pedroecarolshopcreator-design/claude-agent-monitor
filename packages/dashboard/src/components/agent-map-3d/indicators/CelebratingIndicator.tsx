import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import type { Mesh, MeshStandardMaterial } from 'three';
import type { IndicatorProps } from './index.js';

export function CelebratingIndicator({ position }: IndicatorProps) {
  const starRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (starRef.current) {
      starRef.current.rotation.y = t * 0.6;
      starRef.current.rotation.x = Math.sin(t * 0.8) * 0.3;
      const mat = starRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.4;
    }
  });

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <mesh ref={starRef}>
          <octahedronGeometry args={[12, 0]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} metalness={0.4} roughness={0.2} />
        </mesh>
        <Sparkles count={30} size={3} speed={0.5} color="#fbbf24" scale={30} />
      </Float>
    </group>
  );
}
