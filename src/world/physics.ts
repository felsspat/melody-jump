// Jump physics in beat time: a jump is a parabola with height H (pixels)
// and duration D (beats). This keeps everything tempo-independent and in sync with the beat.

export const PX_PER_BEAT = 170;
export const PLAYER_W = 34;
export const PLAYER_H = 40;

export interface JumpShape {
  height: number;
  duration: number;
}

/** Jump shape depending on resonance (0–100). */
export function jumpShape(resonance: number): JumpShape {
  const r = Math.max(0, Math.min(100, resonance)) / 100;
  return {
    height: 36 + 230 * r,
    duration: 0.75 + 2.35 * r,
  };
}

/** Height above the ground t beats after takeoff. */
export function jumpHeightAt(t: number, shape: JumpShape): number {
  const u = t / shape.duration;
  if (u <= 0 || u >= 1) return 0;
  return 4 * shape.height * u * (1 - u);
}

export type ObstacleKind = 'gap' | 'wall';

export interface Obstacle {
  kind: ObstacleKind;
  /** Start position in beats */
  beat: number;
  /** Width in beats */
  width: number;
  /** Height in pixels (walls only) */
  height: number;
  /** minimum resonance at which the obstacle is cleared automatically */
  minResonance: number;
  hit?: boolean;
  broken?: boolean;
  /** already counted in the stats (cleared/not cleared) */
  counted?: boolean;
  /**
   * A pixel monster instead of a plain wall. Physically it is a wall (same jump
   * rules), drawn as a creature of 12×12 sprite pixels, each `scale` screen pixels.
   */
  monster?: { shape: number; color: number; scale: number };
  /** When the shield smashed this wall (seconds), for the flying bricks */
  brokenAt?: number;
}

/** Edge length of one ground / brick / note block on screen (px): five per beat. */
export const TILE = PX_PER_BEAT / 5;

/** Monsters are 12×12 sprite pixels. */
export const MONSTER_GRID = 12;

const PW_BEATS = PLAYER_W / PX_PER_BEAT;

/** Takeoff time (beat) the auto-jump picks for an obstacle. */
export function takeoffBeat(o: Obstacle, shape: JumpShape): number {
  const center = o.beat + o.width / 2;
  const centered = center - shape.duration / 2;
  if (o.kind === 'gap') return Math.min(centered, o.beat - 0.1);
  return centered;
}

/** Does an auto-jump at this resonance clear the obstacle? */
export function canClear(o: Obstacle, resonance: number): boolean {
  const shape = jumpShape(resonance);
  const start = takeoffBeat(o, shape);
  if (o.kind === 'gap') {
    // Landing (player's trailing edge) must be past the gap
    return start + shape.duration - PW_BEATS / 2 >= o.beat + o.width + 0.05;
  }
  // Wall: player's bottom edge must stay above it across the entire overlap
  const from = o.beat - PW_BEATS / 2;
  const to = o.beat + o.width + PW_BEATS / 2;
  for (let b = from; b <= to; b += 0.02) {
    if (jumpHeightAt(b - start, shape) < o.height) return false;
  }
  return true;
}

/** Lowest resonance at which the obstacle is cleared (101 = impossible). */
export function minResonanceFor(o: Obstacle): number {
  if (!canClear(o, 100)) return 101;
  let lo = 0;
  let hi = 100;
  if (canClear(o, 0)) return 0;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    if (canClear(o, mid)) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi);
}
