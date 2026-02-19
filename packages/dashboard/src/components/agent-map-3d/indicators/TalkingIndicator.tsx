import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { Mesh } from 'three';
import type { IndicatorProps } from './index.js';

export function TalkingIndicator({ position }: IndicatorProps) {
  const dot0 = useRef<Mesh>(null);
  const dot1 = useRef<Mesh>(null);
  const dot2 = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dots = [dot0, dot1, dot2];
    dots.forEach((ref, i) => {
      if (ref.current) {
        const phase = t * 3 - i * 0.4;
        const bounce = Math.max(0, Math.sin(phase));
        const elastic = Math.pow(2, -5 * bounce) * Math.sin(bounce * Math.PI * 2) + bounce;
        ref.current.position.y = elastic * 5;
      }
    });
  });

  const dotMat = <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.6} />;

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <mesh position={[0, -2, -1]}>
          <boxGeometry args={[36, 14, 1]} />
          <meshStandardMaterial color="#1a0a2e" transparent opacity={0.5} />
        </mesh>
        <mesh ref={dot0} position={[-10, 0, 0]}>
          <sphereGeometry args={[3, 16, 16]} />{dotMat}
        </mesh>
        <mesh ref={dot1} position={[0, 0, 0]}>
          <sphereGeometry args={[3, 16, 16]} />{dotMat}
        </mesh>
        <mesh ref={dot2} position={[10, 0, 0]}>
          <sphereGeometry args={[3, 16, 16]} />{dotMat}
        </mesh>
      </Float>
    </group>
  );
}
