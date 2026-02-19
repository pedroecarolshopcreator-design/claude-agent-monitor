/**
 * Scene configuration for the 3D Agent Map.
 *
 * Contains Spline model URLs, CSS layout sizing, and visual constants.
 * No Three.js or R3F dependencies — pure config values.
 */

/**
 * Spline .splinecode URLs for each robot model type.
 *
 * These are loaded by @splinetool/react-spline which bundles its own
 * rendering runtime. No Three.js version conflicts.
 */
export const SPLINE_URLS: Record<'main' | 'sub', string> = {
  /** NEXBOT — root/main agent model */
  main: 'https://prod.spline.design/U-9MSmxdw0qkRbKK/scene.splinecode',
  /** GENKUB — sub-agent model */
  sub: 'https://prod.spline.design/Xogqp8elivEQuxhC/scene.splinecode',
};

/** Visual size of each agent card in pixels */
export const AGENT_CARD_SIZE = 220;

/**
 * Internal render scale for Spline canvases.
 *
 * The Agent Map zoom uses CSS `transform: scale()` which stretches existing
 * canvas pixels. To keep models crisp when zoomed in, we render the Spline
 * canvas at a higher resolution and CSS counter-scale it down to AGENT_CARD_SIZE.
 *
 * - At zoom 1.0: 2× supersampled (beautiful)
 * - At zoom 2.0: 1:1 pixel mapping (crisp)
 * - At zoom 3.0: 1.5× upscaled (acceptable, much better than 3× upscale)
 */
export const SPLINE_RENDER_SCALE = 2;

/**
 * Spacing between agents in layout calculation (world units).
 * Used by use-agent-layout.ts for hierarchy layout.
 * NOTE: AgentMap3D uses CARD_GAP (pixels) for the actual grid. This
 * constant is only used for the layout hook's internal structure.
 */
export const AGENT_SPACING = 3;

/** Zoom limits for the Agent Map */
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 3.0;

/** Gap between agent cards in the grid layout (px) */
export const CARD_GAP = 40;

/** Approximate height of an agent card including overlay (px) */
export const CARD_TOTAL_HEIGHT = 320;
