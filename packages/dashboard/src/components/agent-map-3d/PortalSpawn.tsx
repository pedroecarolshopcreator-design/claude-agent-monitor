import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Ring, Sparkles } from '@react-three/drei';
import type { Group, Mesh, PointLight, MeshStandardMaterial } from 'three';

/* ------------------------------------------------------------------
 * PortalSpawn
 *
 * Animated portal ring effect rendered when a sub-agent spawns.
 * The portal scales up, rotates with a glowing ring + sparkles,
 * then collapses after ~2 seconds. Uses R3F + drei for clean
 * declarative animation.
 *
 * Lifecycle:
 *  1. Scale: 0 -> 1 (0-0.6s ease-out)
 *  2. Hold:  1 (0.6-1.4s rotating + sparkling)
 *  3. Scale: 1 -> 0 (1.4-2.0s ease-in)
 *  4. onComplete fires, component stops rendering
 * ------------------------------------------------------------------ */

interface PortalSpawnProps {
  position: [number, number, number];
  color?: string;
  onComplete?: () => void;
}

/** Smooth ease-out cubic: fast start, gentle stop */
function easeOutCubic(t: number): number {
  const t1 = 1 - t;
  return 1 - t1 * t1 * t1;
}

/** Smooth ease-in cubic: gentle start, fast end */
function easeInCubic(t: number): number {
  return t * t * t;
}

const DURATION = 2.0; // Total animation duration in seconds
const PHASE_IN_END = 0.3; // Scale-in phase ends (fraction of duration)
const PHASE_OUT_START = 0.7; // Scale-out phase starts (fraction of duration)

function PortalSpawn({ position, color, onComplete }: PortalSpawnProps) {
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);
  const startTimeRef = useRef<number | null>(null);
  const [finished, setFinished] = useState(false);

  const portalColor = color ?? '#8b5cf6';

  useFrame(({ clock }) => {
    if (finished) return;

    const now = clock.getElapsedTime();

    // Record start time on first frame
    if (startTimeRef.current === null) {
      startTimeRef.current = now;
    }

    const elapsed = now - startTimeRef.current;
    const progress = Math.min(elapsed / DURATION, 1);

    // Animation complete
    if (progress >= 1) {
      setFinished(true);
      onComplete?.();
      return;
    }

    const group = groupRef.current;
    if (!group) return;

    // --- Scale animation ---
    let scale: number;
    if (progress < PHASE_IN_END) {
      // Phase 1: Scale in (0 -> 1)
      const phaseProgress = progress / PHASE_IN_END;
      scale = easeOutCubic(phaseProgress);
    } else if (progress < PHASE_OUT_START) {
      // Phase 2: Hold at full scale
      scale = 1;
    } else {
      // Phase 3: Scale out (1 -> 0)
      const phaseProgress = (progress - PHASE_OUT_START) / (1 - PHASE_OUT_START);
      scale = 1 - easeInCubic(phaseProgress);
    }
    group.scale.setScalar(Math.max(scale, 0.001)); // Prevent zero scale

    // --- Ring rotation ---
    const ring = ringRef.current;
    if (ring) {
      ring.rotation.y += 0.05; // Continuous Y rotation (~3 rad/s at 60fps)
      ring.rotation.x = Math.sin(elapsed * 2) * 0.3; // Subtle wobble
    }

    // --- Opacity (fade in and out) ---
    let opacity: number;
    if (progress < PHASE_IN_END) {
      opacity = easeOutCubic(progress / PHASE_IN_END) * 0.8;
    } else if (progress < PHASE_OUT_START) {
      opacity = 0.8;
    } else {
      const phaseProgress = (progress - PHASE_OUT_START) / (1 - PHASE_OUT_START);
      opacity = 0.8 * (1 - easeInCubic(phaseProgress));
    }

    // Update ring material opacity
    if (ring) {
      const mat = ring.material as MeshStandardMaterial;
      mat.opacity = opacity;
    }

    // --- Point light intensity ramp ---
    const light = lightRef.current;
    if (light) {
      light.intensity = scale * 2;
    }
  });

  // Do not render anything after animation completes
  if (finished) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Portal ring */}
      <Ring
        ref={ringRef}
        args={[15, 25, 32]}
      >
        <meshStandardMaterial
          color={portalColor}
          emissive={portalColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.8}
          side={2} // DoubleSide
          depthWrite={false}
        />
      </Ring>

      {/* Sparkle particles */}
      <Sparkles
        count={40}
        size={3}
        speed={0.5}
        color={portalColor}
        scale={[50, 50, 10]}
      />

      {/* Glow light source at portal center */}
      <pointLight
        ref={lightRef}
        color={portalColor}
        intensity={2}
        distance={100}
        decay={2}
      />
    </group>
  );
}

export { PortalSpawn };
