// Musical style rules: how a genre changes what "fits" and how timing feels.
// The judge, the backing band and the guide melody all read these rules.

import { Key } from './theory';

export type StyleId = 'classic' | 'ragtime' | 'blues' | 'dixieland' | 'swing' | 'rock' | 'ska' | 'reggae' | 'funk' | 'hiphop' | 'electronic';

/** Where a note landed relative to the beat grid. */
export type GridKind = 'beat' | 'offbeat' | 'sixteenth' | 'off';

export interface StyleRules {
  id: StyleId;
  /**
   * Position of the off-beat eighth within a beat: 0.5 = straight,
   * 2/3 = triplet swing/shuffle (the "long-short" feel of blues and jazz).
   */
  swing: number;
  /** Pitch classes that count as intentional "blue notes" in this key. */
  bluePcs(key: Key): number[];
  /** Harmony score for a blue note (instead of being punished as out of key). */
  blueScore: number;
  /** Timing multiplier per grid position (what the groove rewards). */
  timing: Record<GridKind, number>;
  /** Extra multiplier for notes on specific beats of the bar (index = beat), e.g. the backbeat. */
  beatAccents: number[];
}

const STRAIGHT = { beat: 1.25, offbeat: 1.0, sixteenth: 0.8, off: 0.55 };
const flatThirdSeventh = (key: Key) => [3, 10].map((i) => (key.tonic + i) % 12);

export const STYLES: Record<StyleId, StyleRules> = {
  classic: { id: 'classic', swing: 0.5, bluePcs: () => [], blueScore: 0, timing: STRAIGHT, beatAccents: [] },
  // Syncopation: notes between the beats are part of the style
  ragtime: {
    id: 'ragtime',
    swing: 0.5,
    bluePcs: () => [],
    blueScore: 0,
    timing: { beat: 1.2, offbeat: 1.15, sixteenth: 0.85, off: 0.55 },
    beatAccents: [],
  },
  blues: {
    id: 'blues',
    swing: 2 / 3,
    // The flattened 3rd, 5th and 7th of the key: the typical bent, "blue" sound
    bluePcs: (key) => [3, 6, 10].map((i) => (key.tonic + i) % 12),
    blueScore: 2,
    timing: STRAIGHT,
    beatAccents: [],
  },
  dixieland: {
    id: 'dixieland',
    // Lightly swung eighths: between straight (0.5) and full triplet swing (2/3)
    swing: 0.6,
    bluePcs: flatThirdSeventh,
    blueScore: 1,
    timing: { beat: 1.25, offbeat: 1.1, sixteenth: 0.8, off: 0.55 },
    // Two-beat: the tuba plays on 1 and 3, so that is where the weight is
    beatAccents: [1.15, 1, 1.15, 1],
  },
  swing: {
    id: 'swing',
    swing: 2 / 3,
    bluePcs: flatThirdSeventh,
    blueScore: 1,
    timing: { beat: 1.2, offbeat: 1.1, sixteenth: 0.8, off: 0.55 },
    // Jazz feels beats 2 and 4 (where the drummer's hi-hat closes)
    beatAccents: [1, 1.1, 1, 1.1],
  },
  rock: {
    id: 'rock',
    swing: 0.5,
    bluePcs: flatThirdSeventh,
    blueScore: 1,
    timing: STRAIGHT,
    // Backbeat: 2 and 4
    beatAccents: [1, 1.2, 1, 1.2],
  },
  ska: {
    id: 'ska',
    swing: 0.5,
    bluePcs: () => [],
    blueScore: 0,
    // Off-beats ("and") are the heart of ska
    timing: { beat: 1.0, offbeat: 1.3, sixteenth: 0.8, off: 0.55 },
    beatAccents: [],
  },
  reggae: {
    id: 'reggae',
    swing: 0.5,
    bluePcs: () => [],
    blueScore: 0,
    timing: { beat: 1.1, offbeat: 1.2, sixteenth: 0.8, off: 0.55 },
    // One drop: the weight is on beat 3
    beatAccents: [0.9, 1, 1.35, 1],
  },
  funk: {
    id: 'funk',
    swing: 0.5,
    bluePcs: flatThirdSeventh,
    blueScore: 1.5,
    // 16th notes are part of the groove
    timing: { beat: 1.15, offbeat: 1.05, sixteenth: 1.0, off: 0.55 },
    // "The One": everything lands on beat 1
    beatAccents: [1.4, 1, 1, 1],
  },
  hiphop: {
    id: 'hiphop',
    // "Laid back": off-beats a little late, lazier than straight but less than swing
    swing: 0.58,
    bluePcs: flatThirdSeventh,
    blueScore: 1.5,
    timing: { beat: 1.15, offbeat: 1.1, sixteenth: 1.0, off: 0.55 },
    // The snare on 2 and 4 is the loudest part of the beat
    beatAccents: [1, 1.25, 1, 1.25],
  },
  electronic: {
    id: 'electronic',
    swing: 0.5,
    bluePcs: () => [],
    blueScore: 0,
    // Four-on-the-floor: the kick is on every beat, the open hi-hat on every "and"
    timing: { beat: 1.15, offbeat: 1.25, sixteenth: 0.95, off: 0.55 },
    beatAccents: [],
  },
};

export function styleOf(id?: StyleId): StyleRules {
  return STYLES[id ?? 'classic'];
}

/** Moves straight off-beat eighths (x.5) to the swung position of a style. */
export function swingBeat(beat: number, style: StyleRules): number {
  if (style.swing === 0.5) return beat;
  const whole = Math.floor(beat);
  return Math.abs(beat - whole - 0.5) < 1e-6 ? whole + style.swing : beat;
}
