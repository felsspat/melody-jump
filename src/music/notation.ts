// Building blocks for writing melodies: the note format, short helpers (q = quarter …)
// and the format of an extra campaign tune. Used by melodies.ts and songs/*.ts.

import type { BarChords } from './Song';
import type { Key } from './theory';

/** [semitones from the tonic (null = rest), duration in beats] */
export type MelodyNote = [offset: number | null, beats: number];

export interface Melody {
  /** Key into sections.* in texts.json (the song title) */
  id: string;
  beatsPerBar: number;
  /** Bars per pass; the section loops the melody */
  bars: number;
  /** One entry per bar; an entry can list several chords that split the bar evenly */
  chords: BarChords[];
  notes: MelodyNote[];
  /**
   * Pickup ("Auftakt"): notes sounding *before* the first bar, e.g. "Oh when the" before
   * "saints". On the first pass they fall into the count-in (or the end of the previous
   * section); on later passes into the rest at the end of the melody, which must be at
   * least as long as the pickup.
   */
  pickup?: MelodyNote[];
}

/** Quarter, half, whole, eighth, sixteenth, dotted quarter, dotted half (durations in beats of a 4/4 bar). */
export const q = (o: number): MelodyNote => [o, 1];
export const h = (o: number): MelodyNote => [o, 2];
export const w = (o: number): MelodyNote => [o, 4];
export const e = (o: number): MelodyNote => [o, 0.5];
export const s = (o: number): MelodyNote => [o, 0.25];
export const dq = (o: number): MelodyNote => [o, 1.5];
export const dh = (o: number): MelodyNote => [o, 3];
export const rest = (beats: number): MelodyNote => [null, beats];

/** Moves a melody up by `semitones` (for tunes written low, so they sit in the guide range). */
export const transpose = (notes: MelodyNote[], semitones: number): MelodyNote[] =>
  notes.map(([o, d]) => [o === null ? null : o + semitones, d]);

/**
 * A tune a campaign chapter plays as an extra level (before its jam session).
 * Lives in songs/<chapter>.ts; chapters.ts turns every entry into a level automatically.
 */
export interface ChapterTune {
  /** Chapter id in chapters.ts (e.g. 'blues', 'rocknroll') */
  chapter: string;
  melody: Melody;
  /** Key of the level. Offsets in `melody.notes` are relative to its tonic. */
  key: Key;
  /** Tempo of the level at the "original" game speed */
  bpm: number;
  /** Where the notes come from and why the tune may be used (public domain, or written for this game) */
  source: string;
}
