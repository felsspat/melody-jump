// The runner: moves right in sync with the beat and jumps automatically before
// obstacles. How high/far is determined by the resonance of the played melody.

import { LevelGen } from './Level';
import { JumpShape, Obstacle, PLAYER_W, PX_PER_BEAT, jumpShape, takeoffBeat } from './physics';

export type PlayerState = 'ground' | 'jump' | 'fall';
export type PlayerEvent = 'jump' | 'doubleJump' | 'land' | 'hurt' | 'shieldBreak' | 'fall' | 'respawn' | 'stomp';

const PW_BEATS = PLAYER_W / PX_PER_BEAT;
const INVULN_SEC = 1.6;

export class Player {
  state: PlayerState = 'ground';
  /** Height of the bottom edge above the ground (px), negative = in a gap */
  y = 0;
  vyVisual = 0;
  lives = 5;
  readonly maxLives = 5;
  shield = false;
  doubleJump = false;
  invulnUntil = 0;
  /** Time (seconds) of the last hit, for animations */
  hurtAt = -10;
  landedAt = -10;

  private jumpStart = 0;
  private baseY = 0;
  private shape: JumpShape = jumpShape(0);
  private predicted = false;
  private fallGap: Obstacle | undefined;
  /** Time of the previous update (seconds), for movement that is not tied to the beat */
  private lastNow = 0;

  reset(): void {
    this.state = 'ground';
    this.y = 0;
    this.lives = this.maxLives;
    this.shield = false;
    this.doubleJump = false;
    this.invulnUntil = 0;
  }

  get airborne(): boolean {
    return this.state !== 'ground';
  }

  get descending(): boolean {
    return this.state === 'jump' && this.beatProgress > 0.5;
  }

  private beatProgress = 0;

  invulnerable(now: number): boolean {
    return now < this.invulnUntil;
  }

  private heightOnArc(beat: number): number {
    const u = (beat - this.jumpStart) / this.shape.duration;
    return this.baseY + 4 * this.shape.height * u * (1 - u);
  }

  private startJump(beat: number, shape: JumpShape, baseY = 0): void {
    this.state = 'jump';
    this.jumpStart = beat;
    this.baseY = baseY;
    this.shape = shape;
    this.predicted = false;
  }

  /** Does the current trajectory hit a wall or land in a gap? */
  private trajectoryFails(beat: number, level: LevelGen): boolean {
    for (let b = beat; b < beat + 6; b += 0.02) {
      const y = this.heightOnArc(b);
      for (const o of level.obstacles) {
        if (o.kind !== 'wall' || o.broken) continue;
        if (b + PW_BEATS / 2 > o.beat && b - PW_BEATS / 2 < o.beat + o.width && y < o.height) return true;
      }
      if (y <= 0) return !!level.isGapAt(b);
    }
    return false;
  }

  hurt(now: number, events: PlayerEvent[]): void {
    if (this.invulnerable(now)) return;
    if (this.shield) {
      this.shield = false;
      this.invulnUntil = now + 0.6;
      events.push('shieldBreak');
      return;
    }
    this.lives--;
    this.invulnUntil = now + INVULN_SEC;
    this.hurtAt = now;
    events.push('hurt');
  }

  bounce(beat: number): void {
    this.startJump(beat, { height: 70, duration: 0.9 }, Math.max(0, this.y));
  }

  update(beat: number, now: number, resonance: number, level: LevelGen): PlayerEvent[] {
    const events: PlayerEvent[] = [];
    const prevY = this.y;

    if (this.state === 'ground') {
      const gap = level.isGapAt(beat);
      const next = level.nextObstacle(beat - PW_BEATS);
      if (gap) {
        // ran into a gap without jumping
        if (this.doubleJump) {
          this.doubleJump = false;
          this.startJump(beat, jumpShape(Math.max(resonance, 60)));
          events.push('doubleJump');
        } else {
          this.startFall(gap, now, events);
        }
      } else if (next && !next.hit && !next.broken) {
        const shape = jumpShape(resonance);
        const tb = takeoffBeat(next, shape);
        if (beat >= tb && beat < next.beat + next.width) {
          this.startJump(beat, shape);
          events.push('jump');
        }
      }
    }

    if (this.state === 'jump') {
      this.beatProgress = (beat - this.jumpStart) / this.shape.duration;
      this.y = this.heightOnArc(beat);
      // At the apex, predict once and use the double jump if needed
      if (this.beatProgress > 0.5 && !this.predicted) {
        this.predicted = true;
        if (this.doubleJump && this.trajectoryFails(beat, level)) {
          this.doubleJump = false;
          this.startJump(beat, jumpShape(Math.max(resonance, 60)), this.y);
          events.push('doubleJump');
        }
      }
      if (this.state === 'jump' && this.beatProgress > 0.5 && this.y <= 0) {
        const gap = level.isGapAt(beat);
        if (gap) {
          this.startFall(gap, now, events);
        } else {
          this.state = 'ground';
          this.y = 0;
          this.landedAt = now;
          events.push('land');
        }
      }
    }

    if (this.state === 'fall') {
      // Same speed on every display, whatever its refresh rate
      const dt = Math.max(0, Math.min(0.05, now - this.lastNow));
      this.y = Math.max(-400, this.y - 900 * dt);
      const g = this.fallGap!;
      if (beat > g.beat + g.width + PW_BEATS / 2) {
        this.state = 'ground';
        this.y = 0;
        this.fallGap = undefined;
        events.push('respawn');
      }
    }

    // Walls
    if (this.state !== 'fall') {
      for (const o of level.obstacles) {
        if (o.kind !== 'wall' || o.broken || o.hit) continue;
        if (o.beat > beat + 1) break;
        const overlap = beat + PW_BEATS / 2 > o.beat && beat - PW_BEATS / 2 < o.beat + o.width;
        if (overlap && this.y < o.height) {
          if (this.shield) {
            o.broken = true;
            this.shield = false;
            events.push('shieldBreak');
          } else {
            o.hit = true;
            this.hurt(now, events);
          }
        }
      }
    }

    this.vyVisual = this.y - prevY;
    this.lastNow = now;
    return events;
  }

  private startFall(gap: Obstacle, now: number, events: PlayerEvent[]): void {
    this.state = 'fall';
    this.fallGap = gap;
    gap.hit = true;
    events.push('fall');
    this.hurt(now, events);
  }
}
