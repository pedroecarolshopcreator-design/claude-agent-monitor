import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { Mesh } from 'three';
import type { IndicatorProps } from './index.js';

export function TerminalIndicator({ position }: IndicatorProps) {
  const cursorRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (cursorRef.current) {
      cursorRef.current.visible = Math.sin(t * 4) > 0;
      cursorRef.current.position.x = -8 + ((t * 6) % 16);
    }
  });

  const lineMat = <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.6} />;

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <mesh>
          <boxGeometry args={[28, 18, 2]} />
          <meshStandardMaterial color="#0a0a14" />
        </mesh>
        <mesh position={[-11, 4, 1.2]}>
          <boxGeometry args={[2, 2, 0.5]} />{lineMat}
        </mesh>
        <mesh position={[-2, 4, 1.2]}>
          <boxGeometry args={[14, 1.2, 0.3]} />{lineMat}
        </mesh>
        <mesh position={[-4, 0, 1.2]}>
          <boxGeometry args={[10, 1.2, 0.3]} />{lineMat}
        </mesh>
        <mesh ref={cursorRef} position={[-8, -4, 1.2]}>
          <boxGeometry args={[2, 3, 0.5]} />{lineMat}
        </mesh>
      </Float>
    </group>
  );
}
