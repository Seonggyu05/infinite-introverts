/**
 * Canvas Constants
 * Defines boundaries, spawn zones, and canvas-related configuration
 */

export const CANVAS_BOUNDS = {
  MIN_X: -50000,
  MAX_X: 50000,
  MIN_Y: -50000,
  MAX_Y: 50000,
} as const

export const SPAWN_ZONE = {
  MIN_X: -500,
  MAX_X: 500,
  MIN_Y: -500,
  MAX_Y: 500,
} as const

export const VIEWPORT = {
  DEFAULT_ZOOM: 1,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 3,
  BUFFER_PERCENTAGE: 0.2, // 20% buffer outside viewport for rendering
} as const

export const PERFORMANCE = {
  POSITION_UPDATE_THROTTLE_MS: 100, // 10 updates per second
  POSITION_DB_UPDATE_DEBOUNCE_MS: 1000, // 1 second after movement stops
  MAX_VISIBLE_CHAT_LINES: 50,
  MAX_CHAT_LINE_DISTANCE: 2000, // pixels
} as const

export const UI = {
  AVATAR_RADIUS: 20, // pixels
  THOUGHT_BUBBLE_MAX_WIDTH: 300,
  MINIMAP_SIZE: 200, // pixels (square)
} as const

// Unified CANVAS export for convenience
export const CANVAS = {
  BOUNDS: CANVAS_BOUNDS,
  SPAWN_ZONE,
  MIN_ZOOM: VIEWPORT.MIN_ZOOM,
  MAX_ZOOM: VIEWPORT.MAX_ZOOM,
  DEFAULT_ZOOM: VIEWPORT.DEFAULT_ZOOM,
  GRID_SIZE: 100, // Grid line spacing in pixels
} as const

/**
 * Generate random spawn position within spawn zone
 */
export function getRandomSpawnPosition(): { x: number; y: number } {
  return {
    x: Math.random() * (SPAWN_ZONE.MAX_X - SPAWN_ZONE.MIN_X) + SPAWN_ZONE.MIN_X,
    y: Math.random() * (SPAWN_ZONE.MAX_Y - SPAWN_ZONE.MIN_Y) + SPAWN_ZONE.MIN_Y,
  }
}

/**
 * Check if position is within canvas bounds
 */
export function isWithinBounds(x: number, y: number): boolean {
  return (
    x >= CANVAS_BOUNDS.MIN_X &&
    x <= CANVAS_BOUNDS.MAX_X &&
    y >= CANVAS_BOUNDS.MIN_Y &&
    y <= CANVAS_BOUNDS.MAX_Y
  )
}

/**
 * Clamp position to canvas bounds
 */
export function clampToBounds(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(CANVAS_BOUNDS.MIN_X, Math.min(CANVAS_BOUNDS.MAX_X, x)),
    y: Math.max(CANVAS_BOUNDS.MIN_Y, Math.min(CANVAS_BOUNDS.MAX_Y, y)),
  }
}
