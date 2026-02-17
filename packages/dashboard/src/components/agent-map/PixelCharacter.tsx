import { useMemo } from 'react';
import type { AgentAnimationState, AgentPose } from '@cam/shared';
import { SPRITE_POSES, SPRITE_FRAMES, generateBoxShadow, type SpriteFrame } from './sprite-data';

interface PixelCharacterProps {
  color: string;
  animationState: AgentAnimationState;
  pose?: AgentPose;
  pixelSize?: number;
}

/** Legacy: map animation state to old 3-frame system */
function getFrameForState(state: AgentAnimationState): SpriteFrame {
  switch (state) {
    case 'working':
    case 'moving':
    case 'talking':
      return 'working';
    case 'shutdown':
      return 'shutdown';
    case 'idle':
    case 'error':
    case 'completed':
    default:
      return 'idle';
  }
}

export function PixelCharacter({ color, animationState, pose, pixelSize = 2 }: PixelCharacterProps) {
  const boxShadow = useMemo(() => {
    if (pose) {
      // Mission Floor v2: use pose-specific sprite
      const data = SPRITE_POSES[pose];
      return generateBoxShadow(data, color, pixelSize);
    }
    // Legacy fallback: use old 3-frame system
    const frame = getFrameForState(animationState);
    return generateBoxShadow(SPRITE_FRAMES[frame], color, pixelSize);
  }, [pose, animationState, color, pixelSize]);

  const spriteWidth = 16 * pixelSize;
  const spriteHeight = 16 * pixelSize;

  return (
    <div
      className="pixel-character"
      style={{
        width: `${spriteWidth}px`,
        height: `${spriteHeight}px`,
      }}
    >
      <div
        style={{
          width: `${pixelSize}px`,
          height: `${pixelSize}px`,
          boxShadow,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}
