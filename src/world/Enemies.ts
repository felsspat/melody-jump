// "Sour notes": small enemies that appear after dissonance streaks and run
// toward the runner. Jumping on them defeats them; touching them costs a life.

import { Player, PlayerEvent } from './Player';
import { PLAYER_W, PX_PER_BEAT } from './physics';

export interface Enemy {
  beat: number;
  alive: boolean;
  diedAt: number;
  wobble: number;
}

export const ENEMY_SIZE = 26;
const HIT_BEATS = (PLAYER_W / 2 + ENEMY_SIZE / 2) / PX_PER_BEAT;

export class Enemies {
  readonly list: Enemy[] = [];

  spawn(atBeat: number): void {
    this.list.push({ beat: atBeat, alive: true, diedAt: 0, wobble: Math.random() * 10 });
  }

  clear(): void {
    this.list.length = 0;
  }

  /** Enemies move left at half the game speed. */
  update(dBeat: number, beat: number, now: number, player: Player): PlayerEvent[] {
    const events: PlayerEvent[] = [];
    for (const e of this.list) {
      if (!e.alive) continue;
      e.beat -= dBeat * 0.5;
      if (Math.abs(e.beat - beat) < HIT_BEATS && player.y < ENEMY_SIZE && player.state !== 'fall') {
        if (player.descending && player.y > 4) {
          e.alive = false;
          e.diedAt = now;
          player.bounce(beat);
          events.push('stomp');
        } else if (!player.invulnerable(now)) {
          player.hurt(now, events);
          if (events.includes('shieldBreak')) {
            e.alive = false;
            e.diedAt = now;
          }
        }
      }
    }
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      if (e.beat < beat - 12 || (!e.alive && now - e.diedAt > 1)) this.list.splice(i, 1);
    }
    return events;
  }
}
