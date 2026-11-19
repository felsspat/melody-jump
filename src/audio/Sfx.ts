// Short game sounds (jump, note coin, stomp, block, hurt …) in the spirit of classic jump & runs.
// They are tuned to the chord that is playing right now, so they never clash with the music.
// They are not judged – only notes the player plays count for the resonance.

import { Chord } from '../music/theory';
import { AudioEngine } from './AudioEngine';

/** MIDI note of the chord tone `index` (0 = root, 1 = third …) in the octave starting at `base`. */
export function chordTone(chord: Chord, index: number, base: number): number {
  const pcs = chord.pcs;
  const octave = Math.floor(index / pcs.length);
  const pc = pcs[((index % pcs.length) + pcs.length) % pcs.length];
  let m = base + ((pc - base) % 12 + 12) % 12;
  m += 12 * octave;
  return m;
}

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export class Sfx {
  constructor(private engine: AudioEngine) {}

  /** One short tone; `to` slides the pitch (MIDI) over the note's length. */
  private blip(midi: number, at: number, dur: number, gain: number, type: OscillatorType = 'square', to?: number): void {
    const { ctx } = this.engine;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq(midi), at);
    if (to !== undefined) o.frequency.exponentialRampToValueAtTime(freq(to), at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    // Square waves are bright; a low-pass keeps them friendly
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 3200;
    o.connect(f).connect(g).connect(this.engine.sfxBus);
    o.start(at);
    o.stop(at + dur + 0.02);
  }

  /** A burst of filtered noise (thump, crumble). */
  private noise(at: number, dur: number, gain: number, cutoff: number): void {
    const { ctx } = this.engine;
    const src = ctx.createBufferSource();
    src.buffer = this.engine.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(this.engine.sfxBus);
    src.start(at, Math.random() * 0.5, dur + 0.05);
  }

  private get now(): number {
    return this.engine.ctx.currentTime;
  }

  /** Takeoff: a quick slide up from the root to the fifth. */
  jump(chord: Chord): void {
    this.blip(chordTone(chord, 0, 60), this.now, 0.14, 0.09, 'square', chordTone(chord, 2, 67));
  }

  /** Double jump: the same, an octave higher. */
  doubleJump(chord: Chord): void {
    this.blip(chordTone(chord, 0, 72), this.now, 0.12, 0.08, 'square', chordTone(chord, 2, 79));
  }

  /** Landing: a soft thump. */
  land(): void {
    this.noise(this.now, 0.08, 0.12, 380);
  }

  /** Note coin: two bright chord tones, the second one held a little. */
  coin(chord: Chord): void {
    const t = this.now;
    this.blip(chordTone(chord, 2, 79), t, 0.07, 0.07);
    this.blip(chordTone(chord, 0, 84), t + 0.07, 0.35, 0.07);
  }

  /** Bumping a note block from below: a wooden "tock", then the coin. */
  bump(chord: Chord): void {
    this.blip(chordTone(chord, 0, 48), this.now, 0.06, 0.14, 'triangle');
    this.noise(this.now, 0.04, 0.08, 1200);
    const t = this.now + 0.05;
    this.blip(chordTone(chord, 1, 76), t, 0.06, 0.06);
    this.blip(chordTone(chord, 2, 79), t + 0.06, 0.06, 0.06);
    this.blip(chordTone(chord, 0, 84), t + 0.12, 0.3, 0.06);
  }

  /** Jumping on a sour note: a short drop. */
  stomp(chord: Chord): void {
    this.blip(chordTone(chord, 2, 67), this.now, 0.12, 0.1, 'square', chordTone(chord, 0, 55));
  }

  /** A wall smashed by the shield: crumbling bricks. */
  smash(): void {
    this.noise(this.now, 0.35, 0.22, 900);
    this.noise(this.now + 0.06, 0.25, 0.12, 2200);
  }

  /** Losing a life: a falling, sour slide (the only sound that is meant to sound wrong). */
  hurt(): void {
    this.blip(64, this.now, 0.35, 0.1, 'sawtooth', 52);
  }

  /** Falling into a pit: a long slide down. */
  fall(): void {
    this.blip(72, this.now, 0.6, 0.08, 'triangle', 48);
  }

  /** Reaching the goal: the chord as a rising arpeggio. */
  fanfare(chord: Chord): void {
    const t = this.now;
    for (let i = 0; i < 5; i++) this.blip(chordTone(chord, i, 60), t + i * 0.09, i === 4 ? 0.6 : 0.12, 0.08);
  }
}
