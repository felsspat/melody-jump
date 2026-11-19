// Extra campaign tunes of the chapter "blues" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import type { ChapterTune } from '../notation';
import { type MelodyNote, dq, e, h, q, rest, w } from '../notation';

// "Goin' Down the Road Feelin' Bad" (traditional American blues / folk song).
// From the Musica Viva ABC (Frank Nordberg, X:2789, in D, "C:anon."), mirrored by John Chambers:
// https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/goin-down-that-road.abc
// Notes and rhythm as in the source; the chords follow it too (D/C# is played as plain I,
// Bm = vi, Em7 = ii). The source has 15 bars plus the pickup; a rest bar closes the form.
const roadPickup: MelodyNote[] = [q(7)]; // "I'm"
const road: MelodyNote[] = [
  q(4), h(7), q(7), // goin' down that
  h(9), q(7), q(7), // road feel-in'
  h(4), rest(2), // bad,
  rest(3), q(4), // I'm
  q(2), h(0), q(0), // goin' down that
  h(2), q(0), q(-3), // road feel-in'
  h(0), rest(2), // bad,
  rest(2), q(0), q(0), // yes, I'm
  q(-3), h(0), q(0), // goin' down that
  h(2), q(0), q(2), // road feel-in'
  h(4), h(7), // bad, Lord,
  e(9), dq(7), q(4), q(5), // Lord, and I
  q(7), dq(7), e(7), q(9), // ain't gon-na be
  q(7), q(4), q(2), q(2), // treat-ed this a-
  h(0), rest(2), // way.
  rest(4), // room for the pickup
];

// "Sometimes I Feel Like a Motherless Child" (traditional African-American spiritual, minor key).
// From the Musica Viva ABC (Frank Nordberg, X:562, in D minor, "C:anon."), mirrored by John Chambers:
// https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/sometimes-i-feel.abc
// Chords as given there (Gm7/Gm6 → iv, G#dim → V7, the slash chords as their triads).
// Simplified: the quarter-note triplets "moth-er-less" become quarter + two eighths, the
// eighth triplet in "True be-lie-ver" four eighths; a rest bar ends the 15-bar source.
const motherlessLine: MelodyNote[] = [e(3), q(7), e(3), q(7), e(3), e(5)]; // Some-times I feel like a
const motherlessChild: MelodyNote[] = [q(7), e(5), e(3)]; // moth-er-less
const motherlessHome: MelodyNote[] = [
  h(3), e(0), q(-5), e(0), // long ways from
  dq(2), e(0), dq(3), e(0), // home, a
  h(3), e(0), q(-5), e(-1), // long ways from
  w(0), // home.
];
const motherless: MelodyNote[] = [
  ...motherlessLine,
  ...motherlessChild, h(0), // child,
  ...motherlessLine,
  ...motherlessChild, h(0),
  ...motherlessLine,
  ...motherlessChild, dq(0), e(0), // child, a
  ...motherlessHome,
  dq(12), e(10), e(7), e(3), e(0), e(0), // True be-lie-ver, a
  ...motherlessHome,
  rest(4),
];

// "Take This Hammer" (traditional African-American work song, recorded by Lead Belly, † 1949).
// From the Musica Viva ABC (Frank Nordberg, X:2995, in G, "C:anon."), mirrored by John Chambers:
// https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/take-this-hammer.abc
// Notes, rhythm and chords as in the source (the G7 bars written as I7).
const hammerPickup: MelodyNote[] = [q(-5), q(-3)]; // "Take this"
const hammer: MelodyNote[] = [
  h(0), h(0), // ham-mer,
  rest(2), e(2), e(0), e(2), e(0), // car-ry't to the
  h(-1), h(-5), // cap-tain,
  rest(2), q(-5), q(-1), // take this
  h(2), h(2), // ham-mer,
  rest(2), e(7), e(5), e(7), e(5), // car-ry't to the
  h(4), h(0), // cap-tain,
  rest(2), q(0), q(4), // take this
  h(7), h(7), // ham-mer,
  rest(2), e(7), e(7), e(7), e(7), // car-ry't to the
  h(7), h(5), // cap-tain,
  rest(2), e(7), e(7), q(5), // tell him I'm
  e(4), [0, 3.5], // gone,
  rest(2), e(4), e(4), q(2), // tell him I'm
  w(0), // gone.
  rest(4), // room for the pickup
];

export const TUNES: ChapterTune[] = [
  {
    chapter: 'blues',
    melody: {
      id: 'goinDownTheRoad',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', 'I', 'I', 'I',
        'IV', 'IV', 'I', 'I',
        'IV', 'IV', 'I', 'vi',
        'ii', 'V7', 'I', 'I',
      ],
      pickup: roadPickup,
      notes: road,
    },
    key: { tonic: 4, mode: 'major' }, // E major (source: D)
    bpm: 96,
    source:
      'Traditional ("Goin\' Down the Road Feelin\' Bad", anonymous American song) → public domain. ABC: Musica Viva (Frank Nordberg), https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/goin-down-that-road.abc; transposed from D to E, a rest bar added to complete 16 bars.',
  },
  {
    chapter: 'blues',
    melody: {
      id: 'motherlessChild',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'i', ['VI', 'i'], ['iv', 'VI'], ['V7', 'i'],
        ['iv', 'VI'], ['V7', 'IV7'], ['VI', 'i'], ['iv', 'V7'],
        ['i', 'V7'], 'i', ['i', 'VI'], ['iv', 'i'],
        ['iv', 'V7'], ['i', 'V7'], 'i', 'i',
      ],
      notes: motherless,
    },
    key: { tonic: 2, mode: 'minor' }, // D minor, as in the source
    bpm: 66,
    source:
      'Traditional African-American spiritual ("Sometimes I Feel Like a Motherless Child", anonymous) → public domain. ABC: Musica Viva (Frank Nordberg), https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/sometimes-i-feel.abc; triplets simplified to straight eighths/quarters, a rest bar added.',
  },
  {
    chapter: 'blues',
    melody: {
      id: 'takeThisHammer',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', 'I', 'V7', 'V7',
        'V7', 'V7', 'I', 'I',
        'I7', 'I7', 'IV', 'IV',
        'I', 'V7', 'I', 'I',
      ],
      pickup: hammerPickup,
      notes: hammer,
    },
    key: { tonic: 9, mode: 'major' }, // A major (source: G)
    bpm: 76,
    source:
      'Traditional African-American work song ("Take This Hammer", anonymous; best known from Lead Belly, † 1949) → public domain. ABC: Musica Viva (Frank Nordberg), https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/take-this-hammer.abc; transposed from G to A, otherwise as in the source.',
  },
];
