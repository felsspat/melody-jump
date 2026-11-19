// Well-known public-domain melodies. In sections that use one, the backing band
// plays the matching chords and the guide rings show the melody, so the player
// performs a tune they already know (which makes it obvious when it fits).
//
// Notes are [semitones relative to the tonic, duration in beats]; chords are
// one scale degree per bar. Melodies are written relative to the tonic so they
// can be transposed to any section key.

import { type Melody, type MelodyNote, e, h, q, rest, transpose } from './notation';
import type { Section } from './Song';
import { CHAPTER_TUNES } from './songs';
import { styleOf, swingBeat } from './styles';

export type { Melody, MelodyNote } from './notation';

// Original 12-bar blues tune written for this game (so no copyright issues).
// Call-and-response phrases over I7 / IV7 / V7; the b3 (Eb in C) is a blue note
// that resolves up to the major third, the most typical blues move.
const bluesTune: MelodyNote[] = [
  q(0), q(3), q(4), q(7), // I7
  h(10), h(7),
  q(0), q(3), q(4), q(7),
  h(10), rest(2),
  q(5), q(9), q(12), q(15), // IV7
  h(12), h(9),
  q(0), q(3), q(4), q(7), // I7
  h(10), rest(2),
  q(7), q(11), h(14), // V7
  q(12), q(9), h(5), // IV7
  q(3), q(4), h(0), // I7
  h(7), rest(2), // V7 turnaround
];

// "Twinkle, Twinkle, Little Star" (French folk tune "Ah ! vous dirai-je, maman", 18th century)
const twinkleA = [q(0), q(0), q(7), q(7), q(9), q(9), h(7), q(5), q(5), q(4), q(4), q(2), q(2), h(0)];
const twinkleB = [q(7), q(7), q(5), q(5), q(4), q(4), h(2)];

// "Ode to Joy" (Beethoven, Symphony No. 9, 1824)
const odeLine = [q(4), q(4), q(5), q(7), q(7), q(5), q(4), q(2), q(0), q(0), q(2), q(4)];

// "Frère Jacques" / "Bruder Jakob" (traditional, 18th century)
const jakob1 = [q(0), q(2), q(4), q(0)];
const jakob2 = [q(4), q(5), h(7)];
const jakob3 = [e(7), e(9), e(7), e(5), q(4), q(0)];
const jakob4 = [q(0), q(-5), h(0)];

// "The Entertainer" (Scott Joplin, 1902; Joplin died 1917 → public domain).
// Simplified core melody: the famous chromatic pickup (D-D#-E) leading to the high C.
const entertainer: MelodyNote[] = [
  e(2), e(3), e(4), q(12), e(4), q(12),
  e(4), h(12), rest(0.5), e(12), e(14),
  e(15), e(16), e(12), e(14), q(16), e(11), e(14),
  [12, 3], rest(1),
];

// "When the Saints Go Marching In" (traditional spiritual, public domain)
const saintsPickup: MelodyNote[] = [q(0), q(4), q(5)]; // "Oh when the"
const saints: MelodyNote[] = [
  [7, 4], // saints
  rest(1), q(0), q(4), q(5), // oh when the
  [7, 4], // saints
  rest(1), q(0), q(4), q(5),
  h(7), h(4), // go march-
  h(0), h(4), // -ing
  [2, 4], // in
  rest(1), q(4), q(4), q(2), // oh Lord I
  [0, 3], q(0), // want to
  q(4), q(7), q(7), q(5), // be in that
  [5, 4], // number
  rest(1), q(4), q(5), q(7), // when the saints
  h(4), h(0), // go march-
  h(2), h(-1), // -ing
  [0, 4], // in
  rest(4), // room for the pickup of the next pass
];

// Original swing riff for this game over ii – V7 – I – VI7 (the jazz turnaround).
// Short repeated "riff" phrases with swung eighths, as in the big-band era;
// the C# over A7 is the chord's third (a secondary dominant leading to Dm).
const swingRiff: MelodyNote[] = [
  rest(0.5), e(9), e(14), e(9), q(5), q(2), // Dm
  q(-1), e(2), e(5), q(7), q(11), // G7
  h(12), q(7), q(4), // C
  rest(0.5), e(4), e(7), e(9), q(13), q(9), // A7
  rest(0.5), e(9), e(14), e(9), q(5), q(2), // Dm
  e(5), e(7), e(11), e(14), h(11), // G7
  q(12), e(7), e(4), q(0), q(4), // C
  h(0), rest(2),
];

// Original boogie riff for this game: the classic rock 'n' roll bass/guitar
// figure (root-3-5-6, then b7-6-5-3) moved through the 12-bar blues.
const BOOGIE_UP = [0, 4, 7, 9];
const BOOGIE_DOWN = [10, 9, 7, 4];
const boogieRoots = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, -5];
const boogieRiff: MelodyNote[] = boogieRoots.flatMap((root, bar) =>
  (bar % 2 === 0 ? BOOGIE_UP : BOOGIE_DOWN).map((iv) => q(root + iv)),
);

// "Oh! Susanna" (Stephen Foster, 1848 → public domain), arranged as ska
const susanna: MelodyNote[] = [
  e(0), e(2), q(4), q(7), q(7),
  e(9), e(7), q(4), e(0), e(2), q(4),
  e(4), e(2), q(0), h(2),
  e(0), e(2), q(4), q(7), q(7),
  e(9), e(7), q(4), e(0), e(2), q(4),
  e(4), e(2), e(2), e(0), h(0),
  h(5), h(9),
  h(7), h(0),
];

// Original reggae tune for this game (minor key, space between phrases,
// important notes on beat 3 = the "one drop")
const islandTune: MelodyNote[] = [
  rest(1), q(7), q(5), q(3),
  h(2), h(-2),
  rest(1), q(7), q(5), q(3),
  h(5), h(2),
  rest(1), q(8), q(7), q(3),
  h(2), h(5),
  q(0), q(3), q(7), q(3),
  [0, 4],
];

// Original funk riff for this game: short notes with gaps, blue notes resolving up
const funkRiff: MelodyNote[] = [
  e(0), rest(0.5), e(0), e(3), e(4), rest(0.5), e(7), e(10),
  e(12), rest(1), e(10), e(7), rest(0.5), e(5), e(4),
  e(5), rest(0.5), e(5), e(8), e(9), rest(0.5), e(12), e(15),
  e(12), rest(1), e(10), e(9), rest(0.5), e(5), e(3),
];

// Original hip-hop hook for this game (minor key, i – i – VI – VII). Laid back, with
// space for the beat; the b7 (offset 10) is a "blue" note, the D (5) a passing tone.
const hiphopHook: MelodyNote[] = [
  rest(0.5), e(7), e(7), e(3), q(0), rest(0.5), e(3), // i
  e(12), e(10), q(7), rest(1), e(3), e(5), // i
  e(3), e(0), q(-4), rest(1), e(0), e(3), // VI
  q(5), e(2), e(2), h(-2), // VII
  rest(0.5), e(7), e(7), e(3), q(0), rest(0.5), e(3), // i
  e(12), e(10), q(7), rest(1), e(3), e(5), // i
  e(3), e(0), q(-4), rest(1), e(0), e(3), // VI
  e(5), e(5), e(2), e(-2), rest(2), // VII
];

// Original house hook for this game (vi – IV – I – V): notes on the off-beats,
// between the four-on-the-floor kicks, then long notes for the "drop".
const clubHook: MelodyNote[] = [
  rest(0.5), e(9), rest(0.5), e(12), rest(0.5), e(16), rest(0.5), e(12), // vi
  rest(0.5), e(9), rest(0.5), e(12), rest(0.5), e(17), rest(0.5), e(12), // IV
  rest(0.5), e(7), rest(0.5), e(12), rest(0.5), e(16), rest(0.5), e(12), // I
  rest(0.5), e(7), rest(0.5), e(11), rest(0.5), e(14), q(11), // V
  h(16), q(12), q(9), // vi
  h(17), q(12), q(9), // IV
  rest(0.5), e(7), rest(0.5), e(12), rest(0.5), e(16), rest(0.5), e(19), // I
  q(14), q(11), h(7), // V
];

// "Oh, Didn't He Ramble" (Bob Cole & J. Rosamond Johnson, 1902; Johnson died 1954 → public domain
// in the EU since 2025). Chorus as New Orleans brass bands play it; melody checked against
// the 1902 sheet music (Lester S. Levy Collection, Johns Hopkins). Ties across bar lines are
// re-struck; the D# in bars 5 and 7 is a chromatic neighbor of E.
const ramblePickup: MelodyNote[] = [rest(0.5), [12, 1.5], q(11), q(9)]; // "Oh, didn't he"
const ramble: MelodyNote[] = [
  [7, 3], q(9), // ram-ble
  h(12), e(12), e(12), q(12), // ram-ble, he ram-
  h(16), [16, 1.5], e(12), // -bled all a-
  [12, 3], rest(0.5), e(12), // -round, in
  q(16), q(15), q(16), e(12), e(14), // and out the town
  [14, 4],
  q(16), q(15), q(16), e(12), e(14),
  h(14), e(16), e(7), q(9), // oh, didn't he
  [7, 3], q(9), // ram-ble
  h(12), e(12), e(12), q(12),
  h(16), [16, 1.5], e(12),
  [12, 3], rest(0.5), e(12),
  q(16), q(16), q(16), q(16), // rambled till the
  e(14), [14, 1.5], e(16), [14, 1], e(12), // butchers cut him
  [12, 4], // down
  rest(4), // room for the pickup
];

// "Linstead Market" (traditional Jamaican mento song, public domain). Melody from
// flutetunes.com (tune 1201); the source has no chords, these are the usual mento I – IV – V7.
const linstead: MelodyNote[] = [
  e(7), e(7), e(7), q(4), e(7), q(12), // Carry me ackee go a Linstead
  q(9), q(9), q(7), q(7), // Market, not a quattie
  e(5), q(4), q(2), e(4), q(5), // worth sell
  h(7), rest(0.5), e(7), e(9), e(7),
  e(7), e(7), e(7), q(4), e(7), q(12),
  q(9), q(9), q(7), q(4),
  e(5), q(4), q(2), e(4), q(2),
  h(0), h(7), // … sell. Lawd,
  [4, 3], e(5), e(4), // what a night, not a
  q(2), e(4), e(2), h(0), // bite, what a
  e(-1), q(0), q(2), e(4), q(5), // Saturday night
  h(7), rest(1), q(7),
  [4, 3], e(9), e(7),
  q(5), e(7), e(5), h(4),
  e(-1), q(0), q(2), e(0), q(-1),
  h(0), rest(2),
];


// "Maple Leaf Rag" (Scott Joplin, 1899 → public domain), first strain, top line only.
// From the Mutopia edition of the 1899 original (2/4 bars become 4/4 bars, sixteenths
// become eighths). Bars 1–4 and 9–16 follow the original; bars 5–8 are simplified
// (the original Fb-major chord is replaced by IV7, the four-octave arpeggio compressed).
// Some notes are tied over the bar line – that is Joplin's syncopation.
const mapleLeafBar1: MelodyNote[] = [rest(0.5), e(0), e(7), e(0), e(4), q(7), e(-1)];
const mapleLeafEnd: MelodyNote[] = [
  q(12), q(12), q(12), e(12), [12, 1], // repeated high C, the last one tied over the bar line
  e(7), e(9), e(4), e(7), q(9), [0, 1], // (starts half a beat late) … C tied into the next bar
  e(2), e(3), e(0), e(2), q(4), e(0),
  e(4), e(0), q(2), q(0), rest(1), // cadence
];
const mapleLeaf: MelodyNote[] = [
  ...mapleLeafBar1,
  e(7), e(-1), e(2), [7, 2.5],
  ...mapleLeafBar1,
  e(7), e(-1), e(2), [7, 1.5], rest(0.5), e(7),
  rest(0.5), e(0), e(3), e(9), rest(0.5), e(7), rest(0.5), e(7),
  rest(0.5), e(0), e(3), e(9), rest(0.5), e(7), rest(1),
  rest(0.5), e(0), e(3), e(12), rest(0.5), e(0), e(3), e(12),
  rest(0.5), e(12), e(15), e(12), rest(0.5), e(12), e(15), e(12),
  ...mapleLeafEnd,
  ...mapleLeafEnd,
];

// "Down by the Riverside" (traditional spiritual, public domain). Verse and chorus
// ("Ain't gonna study war no more") from the Musica Viva ABC edition (2/4 → 4/4),
// one octave up so it fits the guide range. Long notes run over the bar line.
const riversidePickup: MelodyNote[] = [e(4), e(4), e(3)]; // "I'm gon-na"
const riversideLayDown: MelodyNote[] = [
  q(4), h(-5), q(-3), // lay down my
  e(0), [2, 1.5], h(4), // sword and shield
  rest(1), q(4), [4, 1.5], e(3), // down by the
];
const riversideChorus: MelodyNote[] = [
  e(5), [5, 1.5], q(5), q(5), // stu-dy war no
  q(5), q(5), q(0), e(2), e(2), // more, I ain't gon-na
  e(4), [4, 1.5], q(4), q(4),
  q(4), q(4), q(4), e(4), e(4),
  e(4), [2, 2.5], q(5),
  h(4), h(2), // no more
];
const riverside: MelodyNote[] = [
  ...riversideLayDown,
  e(4), [2, 1.5], h(0), // riv-er-side
  rest(1), q(2), [2, 1.5], e(0),
  e(2), [0, 1.5], h(-1),
  rest(1), q(4), [4, 1.5], e(3),
  e(4), [2, 1.5], e(0), e(4), e(4), e(3),
  ...riversideLayDown,
  e(4), [2, 1.5], q(0), e(4), e(4),
  e(4), [2, 2.5], q(5),
  h(4), h(2),
  [0, 5], q(0), q(2), e(4), e(4),
  ...riversideChorus,
  [4, 5], q(0), q(2), e(4), e(4),
  ...riversideChorus,
  [0, 6], rest(2), // room for the pickup
];

// "Careless Love" (traditional American folk / blues song, public domain). From the Digital
// Tradition ABC, cross-checked with J. Campin's edition; long notes are tied over the bar line.
// The G – G# – A lead-in in bar 12 uses the blue third.
const careless: MelodyNote[] = [
  [4, 3], q(0), // Love, oh
  q(-1), q(-5), q(-1), q(2), // love, oh care-less
  [0, 6], rest(2), // love
  [4, 3], q(5), // Love, oh
  q(7), q(7), q(9), q(7), // love, oh care-less
  [2, 6], q(4), q(5), // love … love, oh
  [4, 3], q(5),
  h(7), h(7),
  h(9), h(5),
  h(0), q(2), q(3),
  [4, 3], q(0), // what care-
  q(-1), q(-5), q(-1), q(2), // -less love has
  [0, 6], rest(2), // done
];

const BASE_MELODIES: Record<string, Melody> = {
  careless: {
    id: 'careless',
    beatsPerBar: 4,
    bars: 16,
    chords: ['I', 'V7', 'I', 'I', 'I', 'I', 'II7', 'V7', 'I', 'I7', 'IV', ['I', 'V7'], 'I', 'V7', 'I', 'I'],
    notes: transpose(careless, 12),
  },
  mapleLeaf: {
    id: 'mapleLeaf',
    beatsPerBar: 4,
    bars: 16,
    chords: [
      ['I', 'I', 'I', 'V7'], 'V7', ['I', 'I', 'I', 'V7'], 'V7',
      ['IV7', 'I'], ['IV7', 'I'], 'IV7', 'IV7',
      'II7', 'vi', ['IV7', 'I'], ['I', 'V7', 'I', 'I'],
      'II7', 'vi', ['IV7', 'I'], ['I', 'V7', 'I', 'I'],
    ],
    notes: mapleLeaf,
  },
  riverside: {
    id: 'riverside',
    beatsPerBar: 4,
    bars: 32,
    chords: [
      ['I', 'IV'], 'I', 'I', 'I',
      'V7', 'V7', 'I', 'I',
      ['I', 'IV'], 'I', 'I', 'I',
      'V7', 'V7', 'I', 'I7',
      'IV', ['IV', 'V7'], 'I', 'I',
      'V7', 'V7', 'I', 'I7',
      'IV', ['IV', 'V7'], 'I', 'I',
      'V7', 'V7', 'I', 'I',
    ],
    pickup: transpose(riversidePickup, 12),
    notes: transpose(riverside, 12),
  },
  ramble: {
    id: 'ramble',
    beatsPerBar: 4,
    bars: 16,
    chords: [
      ['I', 'I', 'I', 'IV'], 'I', 'I', 'I',
      ['I', 'I', 'I', 'V7'], 'V7', ['I', 'I', 'I', 'V7'], ['V7', 'I'],
      ['I', 'I', 'I', 'IV'], 'I', 'I', 'I',
      'I', ['V7', 'V7', 'V7', 'I'], 'I', 'V7',
    ],
    pickup: ramblePickup,
    notes: ramble,
  },
  linstead: {
    id: 'linstead',
    beatsPerBar: 4,
    bars: 16,
    chords: ['I', ['IV', 'I'], 'V7', 'I', 'I', ['IV', 'I'], 'V7', 'I', 'I', ['V7', 'I'], 'V7', 'I', 'I', ['V7', 'I'], 'V7', 'I'],
    notes: linstead,
  },
  hiphopHook: {
    id: 'hiphopHook',
    beatsPerBar: 4,
    bars: 8,
    chords: ['i', 'i', 'VI', 'VII', 'i', 'i', 'VI', 'VII'],
    notes: hiphopHook,
  },
  clubHook: {
    id: 'clubHook',
    beatsPerBar: 4,
    bars: 8,
    chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'],
    notes: clubHook,
  },
  entertainer: {
    id: 'entertainer',
    beatsPerBar: 4,
    bars: 8,
    chords: ['I', 'IV', 'I', 'I', 'I', 'IV', 'I', 'V7'],
    notes: [...entertainer, ...entertainer],
  },
  saints: {
    id: 'saints',
    beatsPerBar: 4,
    bars: 16,
    chords: ['I', 'I', 'I', 'I', 'I', 'I', 'V7', 'I', 'I', 'I7', 'IV', 'I', 'I', 'V7', 'I', 'I'],
    pickup: saintsPickup,
    notes: saints,
  },
  swingRiff: {
    id: 'swingRiff',
    beatsPerBar: 4,
    bars: 8,
    chords: ['ii', 'V7', 'I', 'VI7', 'ii', 'V7', 'I', 'I'],
    notes: swingRiff,
  },
  boogieRiff: {
    id: 'boogieRiff',
    beatsPerBar: 4,
    bars: 12,
    chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
    notes: boogieRiff,
  },
  susanna: {
    id: 'susanna',
    beatsPerBar: 4,
    bars: 8,
    chords: ['I', 'I', 'V7', 'I', 'I', 'V7', 'IV', 'I'],
    notes: susanna,
  },
  islandTune: {
    id: 'islandTune',
    beatsPerBar: 4,
    bars: 8,
    chords: ['i', 'VII', 'i', 'VII', 'VI', 'VII', 'i', 'i'],
    notes: islandTune,
  },
  funkRiff: {
    id: 'funkRiff',
    beatsPerBar: 4,
    bars: 4,
    chords: ['I7', 'I7', 'IV7', 'IV7'],
    notes: funkRiff,
  },
  bluesTune: {
    id: 'bluesTune',
    beatsPerBar: 4,
    bars: 12,
    // Classic 12-bar blues: I I I I / IV IV I I / V IV I V
    chords: [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5],
    notes: bluesTune,
  },
  twinkle: {
    id: 'twinkle',
    beatsPerBar: 4,
    bars: 12,
    chords: [1, 4, 4, 1, 1, 5, 1, 5, 1, 4, 4, 1],
    notes: [...twinkleA, ...twinkleB, ...twinkleB, ...twinkleA],
  },
  ode: {
    id: 'ode',
    beatsPerBar: 4,
    bars: 8,
    chords: [1, 5, 1, 5, 1, 5, 1, 1],
    notes: [...odeLine, [4, 1.5], e(2), h(2), ...odeLine, [2, 1.5], e(0), h(0)],
  },
  jakob: {
    id: 'jakob',
    beatsPerBar: 4,
    bars: 8,
    chords: [1, 1, 1, 1, 1, 1, 5, 1],
    notes: [...jakob1, ...jakob1, ...jakob2, ...jakob2, ...jakob3, ...jakob3, ...jakob4, ...jakob4],
  },
};

/** All melodies: the ones above plus the extra campaign tunes in songs/*.ts. */
export const MELODIES: Record<string, Melody> = {
  ...BASE_MELODIES,
  ...Object.fromEntries(CHAPTER_TUNES.map((tune) => [tune.melody.id, tune.melody])),
};

export interface TimedNote {
  /** Absolute beat of the note onset */
  beat: number;
  /** Semitones relative to the tonic */
  offset: number;
  beats: number;
}

/** All melody notes of a section with absolute beats (the melody loops to fill the section). */
export function melodyTimeline(section: Section): TimedNote[] {
  const mel = section.melody ? MELODIES[section.melody] : undefined;
  if (!mel) return [];
  const out: TimedNote[] = [];
  const passBeats = mel.bars * mel.beatsPerBar;
  const passes = Math.max(1, Math.round(section.bars / mel.bars));
  const style = styleOf(section.style);
  const pickupBeats = (mel.pickup ?? []).reduce((sum, [, d]) => sum + d, 0);
  for (let p = 0; p < passes; p++) {
    let beat = section.startBeat + p * passBeats - pickupBeats;
    for (const [offset, beats] of [...(mel.pickup ?? []), ...mel.notes]) {
      // Rests advance time but create no note; off-beat eighths follow the style's swing
      if (offset !== null) out.push({ beat: swingBeat(beat, style), offset, beats });
      beat += beats;
    }
  }
  return out;
}

/** Length of a section melody's pickup in beats (0 without melody or pickup). */
export function pickupBeats(section: { melody?: string }): number {
  const mel = section.melody ? MELODIES[section.melody] : undefined;
  return (mel?.pickup ?? []).reduce((sum, [, d]) => sum + d, 0);
}
