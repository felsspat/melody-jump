// Judges played notes in their musical context (key, chord, bar position)
// and derives the "resonance" (0–100) that drives the gameplay.

import { GridKind, STYLES, StyleId, StyleRules, styleOf } from './styles';
import { Chord, Key, intervalScore, isChordTone, isInScale, pitchClass } from './theory';

export type NoteQuality = 'chord' | 'blue' | 'scale' | 'passing' | 'dissonant';

export interface NoteInput {
  midi: number;
  velocity: number;
  /** Absolute position in beats (already latency-corrected) */
  beat: number;
}

export interface JudgeContext {
  key: Key;
  chord: Chord;
  /** Position within the bar in beats */
  beatInBar: number;
  beatsPerBar: number;
  secPerBeat: number;
  /** Timing tolerance in seconds (more forgiving for beginners) */
  toleranceSec?: number;
  /** Genre rules (blue notes, swing); defaults to classic */
  style?: StyleRules;
}

export interface ScoreParts {
  harmony: number;
  interval: number;
  bonus: number;
  timing: number;
  spam: number;
  /** Where the note landed on the beat grid */
  grid: GridKind;
}

export interface JudgedNote {
  midi: number;
  velocity: number;
  beat: number;
  quality: NoteQuality;
  score: number;
  parts: ScoreParts;
  timingErrorMs: number;
  /** Signed distance to the nearest eighth-note position in ms (negative = early); shows a constant delay */
  offsetMs: number;
  chordName: string;
  chord: Chord;
  key: Key;
  /** previous note, if it belongs to the same phrase (≤ 2 beats) */
  prevMidi?: number;
  /** Style the note was judged in (for style-specific explanations) */
  styleId: StyleId;
}

export type JudgeEvent = 'chord' | 'octave' | 'dissonance' | 'resolution';

export interface JudgeResult {
  note: JudgedNote;
  events: JudgeEvent[];
}

export const TIMING_TOLERANCE_SEC = 0.07;

/** Extra score for hitting a guide ring (following the suggested / well-known melody). */
export const GUIDE_HIT_BONUS = 1.5;

/** Offset (in beats) of `beat` from the nearest grid line of spacing `grid`. */
function gridError(beat: number, grid: number): number {
  return beat - Math.round(beat / grid) * grid;
}

/** Signed distance (ms) of `beat` to the nearest beat or (swung) off-beat eighth; negative = early. */
export function gridOffsetMs(beat: number, secPerBeat: number, swing = 0.5): number {
  const frac = beat - Math.floor(beat);
  let best = frac;
  for (const d of [frac - swing, frac - 1]) if (Math.abs(d) < Math.abs(best)) best = d;
  return Math.round(best * secPerBeat * 1000);
}

export function timingMultiplier(
  beat: number,
  secPerBeat: number,
  toleranceSec = TIMING_TOLERANCE_SEC,
  swing = 0.5,
  weights: Record<GridKind, number> = STYLES.classic.timing,
): { mult: number; errorMs: number; grid: GridKind } {
  const tol = toleranceSec / secPerBeat; // tolerance in beats
  const eq = gridError(beat, 1);
  const errorMs = Math.round(eq * secPerBeat * 1000);
  if (Math.abs(eq) <= tol) return { mult: weights.beat, errorMs, grid: 'beat' };
  // Off-beat eighth: halfway through the beat, or later when the style swings
  const offbeatErr = beat - (Math.floor(beat) + swing);
  if (Math.abs(offbeatErr) <= tol) return { mult: weights.offbeat, errorMs, grid: 'offbeat' };
  if (Math.abs(gridError(beat, 0.25)) <= tol * 0.8) return { mult: weights.sixteenth, errorMs, grid: 'sixteenth' };
  return { mult: weights.off, errorMs, grid: 'off' };
}

export class HarmonyJudge {
  readonly history: JudgedNote[] = [];
  private lastChordEventBeat = -Infinity;
  private lastOctaveEventBeat = -Infinity;

  /** Adds a bonus to an already judged note (e.g. it hit a guide ring). */
  addBonus(note: JudgedNote, amount: number): void {
    note.score += amount;
    note.parts.bonus += amount;
  }

  reset(): void {
    this.history.length = 0;
    this.lastChordEventBeat = -Infinity;
    this.lastOctaveEventBeat = -Infinity;
  }

  judge(input: NoteInput, ctx: JudgeContext): JudgeResult {
    const events: JudgeEvent[] = [];
    const prev = this.history[this.history.length - 1];
    const prevRecent = prev && input.beat - prev.beat <= 2 ? prev : undefined;
    const style = ctx.style ?? styleOf('classic');

    // 1) Harmony relative to chord / key
    let quality: NoteQuality;
    let harmony: number;
    if (isChordTone(input.midi, ctx.chord)) {
      quality = 'chord';
      harmony = 3;
    } else if (style.bluePcs(ctx.key).includes(pitchClass(input.midi))) {
      quality = 'blue';
      harmony = style.blueScore;
    } else if (isInScale(input.midi, ctx.key)) {
      quality = 'scale';
      harmony = 1;
    } else {
      quality = 'dissonant';
      harmony = -2;
    }

    // Passing tone: previous dissonant note resolves by half/whole step into a chord tone
    let bonus = 0;
    if (
      quality === 'chord' &&
      prev &&
      prev.quality === 'dissonant' &&
      input.beat - prev.beat <= 1.01 &&
      Math.abs(input.midi - prev.midi) <= 2
    ) {
      prev.quality = 'passing';
      prev.score += 2.5; // soften retroactively
      bonus += 0.5;
      events.push('resolution');
    }

    // 2) Melodic interval
    const interval = prevRecent ? intervalScore(input.midi - prevRecent.midi) : 0;

    // 3) Timing
    const tm = timingMultiplier(input.beat, ctx.secPerBeat, ctx.toleranceSec, style.swing, style.timing);
    const { errorMs, grid } = tm;
    // Style accents on specific beats (backbeat, one drop, "the One")
    const beatIdx = Math.round(ctx.beatInBar) % ctx.beatsPerBar;
    const timing = tm.mult * (grid === 'beat' ? (style.beatAccents[beatIdx] ?? 1) : 1);

    // 4) Accents & resolution
    const tolBeats = (ctx.toleranceSec ?? TIMING_TOLERANCE_SEC) / ctx.secPerBeat;
    const nearDownbeat = ctx.beatInBar <= tolBeats || ctx.beatsPerBar - ctx.beatInBar <= tolBeats;
    if (nearDownbeat && quality === 'chord' && input.velocity >= 0.75) bonus += 0.5;
    if (nearDownbeat && pitchClass(input.midi) === ctx.key.tonic && ctx.chord.degree === 1) bonus += 1;

    // 5) Anti-spam: many notes per beat and endless repeated notes don't pay off
    const recent = this.history.filter((n) => input.beat - n.beat < 1);
    let spam = 1 / (1 + Math.max(0, recent.length - 2) * 0.5);
    let sameRun = 0;
    for (let i = this.history.length - 1; i >= 0 && sameRun < 4; i--) {
      if (this.history[i].midi !== input.midi) break;
      sameRun++;
    }
    if (sameRun >= 2) spam *= 0.5;

    const raw = harmony + interval + bonus;
    const score = raw > 0 ? raw * timing * spam : raw;

    const note: JudgedNote = {
      midi: input.midi,
      velocity: input.velocity,
      beat: input.beat,
      quality,
      score,
      parts: { harmony, interval, bonus, timing, spam, grid },
      timingErrorMs: errorMs,
      offsetMs: gridOffsetMs(input.beat, ctx.secPerBeat, style.swing),
      chordName: ctx.chord.name,
      chord: ctx.chord,
      key: ctx.key,
      prevMidi: prevRecent?.midi,
      styleId: style.id,
    };
    this.history.push(note);
    if (this.history.length > 64) this.history.shift();

    // Patterns
    const inBeat = this.history.filter((n) => input.beat - n.beat < 1 && n.quality === 'chord');
    const chordPcs = new Set(inBeat.map((n) => pitchClass(n.midi)));
    if (chordPcs.size >= 3 && input.beat - this.lastChordEventBeat >= ctx.beatsPerBar) {
      events.push('chord');
      this.lastChordEventBeat = input.beat;
    }
    if (
      prev &&
      input.beat - prev.beat <= 1.01 &&
      input.midi !== prev.midi &&
      Math.abs(input.midi - prev.midi) % 12 === 0 &&
      input.beat - this.lastOctaveEventBeat >= 2
    ) {
      events.push('octave');
      this.lastOctaveEventBeat = input.beat;
    }
    const last3 = this.history.slice(-3);
    if (last3.length === 3 && last3.every((n) => n.quality === 'dissonant')) {
      events.push('dissonance');
    }

    return { note, events };
  }

  /**
   * Resonance 0–100 from the notes of the last two bars; older notes count less.
   * Good playing (≈ one chord tone per beat, on time, consonant intervals)
   * reaches about 100.
   */
  resonance(nowBeat: number, beatsPerBar: number): number {
    const window = beatsPerBar * 2;
    let sum = 0;
    for (const n of this.history) {
      const age = nowBeat - n.beat;
      if (age < 0 || age > window) continue;
      sum += n.score * (1 - age / window);
    }
    // Target sum scales with window length (≈ 2.75 points per beat)
    const target = window * 2.75;
    return Math.max(0, Math.min(100, (sum / target) * 100));
  }
}
