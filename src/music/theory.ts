// Basic music theory: MIDI notes, keys, scales, chords, intervals.

import { onLocaleChange, t, tl } from '../i18n/i18n';

// Note names come from the localization file (e.g. German uses "H" for B).
let noteNames = tl('noteNames');
onLocaleChange(() => {
  noteNames = tl('noteNames');
});

/** Localized name of a pitch class (0 = C … 11 = B). */
export function pcName(pc: number): string {
  return noteNames[((pc % 12) + 12) % 12];
}

export type Mode = 'major' | 'minor';

export interface Key {
  /** Pitch class of the tonic, 0 = C … 11 = B */
  tonic: number;
  mode: Mode;
}

export type ChordQuality = 'maj' | 'min' | 'dim' | 'dom7';

export interface Chord {
  root: number;
  quality: ChordQuality;
  /** Pitch classes [root, third, fifth] (+ seventh for seventh chords) */
  pcs: number[];
  /** Localized chord symbol, e.g. "Am" (computed on access so it follows language changes) */
  readonly name: string;
  /** Scale degree within the key, 1-based */
  degree: number;
  roman: string;
}

export const SCALES: Record<Mode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function noteName(midi: number): string {
  return pcName(pitchClass(midi)) + String(Math.floor(midi / 12) - 1);
}

export function keyName(key: Key): string {
  return t(key.mode === 'major' ? 'music.major' : 'music.minor', { tonic: pcName(key.tonic) });
}

export function scalePitchClasses(key: Key): number[] {
  return SCALES[key.mode].map((i) => (key.tonic + i) % 12);
}

export function isInScale(midi: number, key: Key): boolean {
  return scalePitchClasses(key).includes(pitchClass(midi));
}

export function isChordTone(midi: number, chord: Chord): boolean {
  return chord.pcs.includes(pitchClass(midi));
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Diatonic triad on the given scale degree (1–7). */
export function diatonicChord(key: Key, degree: number): Chord {
  const sc = scalePitchClasses(key);
  const i = (((degree - 1) % 7) + 7) % 7;
  const pcs = [sc[i], sc[(i + 2) % 7], sc[(i + 4) % 7]];
  const third = (pcs[1] - pcs[0] + 12) % 12;
  const fifth = (pcs[2] - pcs[0] + 12) % 12;
  const quality: ChordQuality = third === 4 ? 'maj' : fifth === 6 ? 'dim' : 'min';
  const suffix = quality === 'maj' ? '' : quality === 'min' ? 'm' : '°';
  const romanBase = ROMAN[i];
  const roman = quality === 'maj' ? romanBase : romanBase.toLowerCase() + (quality === 'dim' ? '°' : '');
  return {
    root: pcs[0],
    quality,
    pcs,
    get name() {
      return pcName(pcs[0]) + suffix;
    },
    degree: i + 1,
    roman,
  };
}

/**
 * Score of a melodic interval (absolute distance in half steps).
 * Consonances are positive, harsh dissonances negative.
 */
export function intervalScore(semitones: number): number {
  const s = Math.abs(semitones);
  if (s === 0) return 0; // repeated note: neutral
  if (s % 12 === 0) return 1; // octave(s)
  if (s > 12) {
    // big leaps: score the consonance, but with a small penalty
    return intervalScore(s % 12) * 0.5 - 0.5;
  }
  switch (s) {
    case 1:
    case 2:
      return 0.5; // stepwise motion
    case 3:
    case 4:
    case 8:
    case 9:
      return 1; // thirds, sixths
    case 5:
    case 7:
      return 1; // fourth, fifth
    case 6:
      return -1; // tritone
    default:
      return 0; // sevenths
  }
}

/** Voices a chord at or above a lower bound (MIDI), sorted ascending. */
export function voiceChord(chord: Chord, low: number): number[] {
  return chord.pcs
    .map((pc) => {
      let m = low - pitchClass(low) + pc;
      if (m < low) m += 12;
      return m;
    })
    .sort((a, b) => a - b);
}

/**
 * Hue (0–360) of a pitch class along the circle of fifths,
 * so related notes get similar colors.
 */
export function pitchHue(midi: number): number {
  return ((pitchClass(midi) * 7) % 12) * 30;
}

/**
 * Dominant seventh chord (root, major third, fifth, minor seventh) on a scale
 * degree, e.g. C7 = C-E-G-Bb. The backbone of the blues: in a 12-bar blues
 * all three chords (I7, IV7, V7) are dominant sevenths.
 */
export function dominantSeventh(key: Key, degree: number): Chord {
  const sc = scalePitchClasses(key);
  const i = (((degree - 1) % 7) + 7) % 7;
  const r = sc[i];
  const pcs = [r, (r + 4) % 12, (r + 7) % 12, (r + 10) % 12];
  return {
    root: r,
    quality: 'dom7',
    pcs,
    get name() {
      return pcName(r) + '7';
    },
    degree: i + 1,
    roman: ROMAN[i] + '7',
  };
}

/** A chord in a progression: a scale degree (diatonic triad) or a roman symbol like "V7", "VI7", "ii". */
export type ChordSpec = number | string;

const ROMAN_DEGREES: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7 };

/**
 * Builds a chord from a spec. Numbers and plain roman numerals give the
 * diatonic triad of that degree; a trailing "7" gives a dominant seventh
 * chord on that degree (e.g. "VI7" in C = A7, a secondary dominant used a lot
 * in ragtime and early jazz).
 */
export function chordFromSpec(key: Key, spec: ChordSpec, sevenths = false): Chord {
  if (typeof spec === 'number') return sevenths ? dominantSeventh(key, spec) : diatonicChord(key, spec);
  const m = /^([ivIV]+)(7?)$/.exec(spec.trim());
  const degree = m ? ROMAN_DEGREES[m[1].toLowerCase()] : undefined;
  if (!m || !degree) throw new Error(`Unknown chord symbol: ${spec}`);
  return m[2] || sevenths ? dominantSeventh(key, degree) : diatonicChord(key, degree);
}
