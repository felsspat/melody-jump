// Extra campaign tunes of the chapter "dixieland" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import type { ChapterTune } from '../notation';
import { type MelodyNote, dh, dq, e, h, q, rest, w } from '../notation';

// "Bill Bailey, Won't You Please Come Home" (Hughie Cannon, 1902; Cannon died 1912), chorus.
// From Colin Hume's ABC (X:106, in F, chords given): https://colinhume.com/ABC.txt
// (also on abcnotation.com: tunePage?a=colinhume.com/ABC.txt/0105). Each 2/2 bar is one 4/4 bar.
// Chords as given there; the Bbm in bar 26 is played as IV, the unmarked bars 21–22 as F7 (I7),
// D7 = VI7 and G = II7 (the ragtime chain of secondary dominants). The G# and F# are passing tones.
const baileyHalf: MelodyNote[] = [
  q(-5), h(-3), q(0),
  dq(4), e(3), q(4), q(7),
  q(-5), h(-3), q(0),
];
const bailey: MelodyNote[] = [
  ...baileyHalf,
  w(4),
  q(-5), h(-3), q(0),
  h(4), h(7),
  q(7), [-1, 5],
  rest(2),
  q(-5), h(-1), q(2),
  q(5), q(4), q(5), q(7),
  q(-5), h(-1), q(2),
  h(5), rest(2),
  q(-5), h(-1), q(2),
  h(7), h(9),
  q(9), [4, 5],
  rest(2),
  ...baileyHalf,
  h(4), rest(1), q(-5),
  q(-5), q(-5), q(0), q(4),
  h(7), h(10),
  [9, 6], rest(1), q(0),
  q(0), h(0), q(0),
  h(2), h(0),
  q(7), h(7), q(9),
  h(4), rest(1), q(4),
  q(4), q(2), q(1), q(2),
  h(5), h(4),
  [0, 6], rest(2),
];

// "Swing Low, Sweet Chariot" (traditional African-American spiritual, a New Orleans brass band standard).
// From Thornton Rose's ABC after the John C. Campbell Folk School Song Book (X:2, in G, "C:Anonymous"):
// https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/mindspring.com/~thornton.rose/SwingLowSweetChariot/0001
// Chorus and first verse, notes and chords as in the source.
const comingHome: MelodyNote[] = [e(0), e(0), e(0), e(0), e(4), e(4)]; // com-in' for to car-ry
const chariot: MelodyNote[] = [dq(0), e(0), e(-3), dq(-5)]; // sweet char-i-ot
const swingLow: MelodyNote[] = [
  q(4), h(0), q(4), // Swing low,
  ...chariot,
  ...comingHome, q(7), // … me
  w(7), // home.
  e(9), e(7), h(4), q(7), // Swing low,
  ...chariot,
  ...comingHome, q(2),
  dh(0), q(4), // home. I
  q(7), e(0), e(-5), q(0), e(0), e(0), // looked ov-er Jor-dan, an' what
  e(0), e(0), q(0), e(-3), dq(-5), // did I see,
  ...comingHome, q(7),
  dh(7), q(7), // home. A
  e(9), e(7), q(4), q(4), q(0), // band of an-gels
  e(0), e(0), e(0), e(0), e(-3), dq(-5), // com-in' af-ter me,
  ...comingHome, q(2),
  w(0), // home.
];

// "Joshua Fit the Battle of Jericho" (traditional African-American spiritual, minor key;
// a favourite of New Orleans bands). From the Musica Viva ABC (Frank Nordberg, X:423, in D minor,
// "C:anon."), mirrored by John Chambers:
// https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/joshua-fought/joshua-fought-1.abc
// Refrain and verse once through (the D.C. repeat of the refrain is left out); chords as in the source.
// The C# in the first bar is a passing tone into D.
const joshuaLine: MelodyNote[] = [e(0), e(-1), e(0), e(2), e(3), e(3), q(5)]; // Josh-ua fought the bat-tle of
const joshua: MelodyNote[] = [
  ...joshuaLine,
  e(7), q(7), [7, 2.5], // Jer-i-cho,
  e(5), q(5), [5, 2.5], // Jer-i-cho,
  e(7), q(7), [7, 2.5], // Jer-i-cho,
  ...joshuaLine,
  e(7), q(7), [7, 1.5], e(3), e(5), // Jer-i-cho, and the
  q(7), q(5), q(3), q(2), // walls came tumb-ling
  dh(0), e(12), e(12), // down. You may
  e(12), e(7), e(7), e(7), dq(7), e(7), // talk a-bout your man of
  e(7), [7, 2.5], e(7), e(7), // Gid-eon, you may
  e(7), e(7), e(7), e(7), q(7), q(7), // talk a-bout your man of
  dh(7), q(11), // Saul, there's
  q(12), q(7), e(7), dq(7), // none like good old
  q(7), h(7), e(7), e(7), // Josh-ua at the
  e(7), e(7), q(5), q(2), q(0), // bat-tle of Jer-i-
  w(0), // cho.
];

export const TUNES: ChapterTune[] = [
  {
    chapter: 'dixieland',
    melody: {
      id: 'billBailey',
      beatsPerBar: 4,
      bars: 32,
      chords: [
        'I', 'I', 'I', 'I', 'I', 'I', 'V7', 'V7',
        'V7', 'V7', 'V7', 'V7', 'V7', 'V7', 'I', 'I',
        'I', 'I', 'I', 'I', 'I7', 'I7', 'IV', 'IV',
        'IV', 'IV', 'I', 'VI7', 'II7', 'V7', 'I', 'I',
      ],
      notes: bailey,
    },
    key: { tonic: 5, mode: 'major' }, // F major, as in the source
    bpm: 112,
    source:
      'Hughie Cannon († 1912), "Bill Bailey, Won\'t You Please Come Home" (1902) → public domain. ABC: Colin Hume, https://colinhume.com/ABC.txt (X:106; abcnotation.com tunePage?a=colinhume.com/ABC.txt/0105), chorus only; Bbm played as IV.',
  },
  {
    chapter: 'dixieland',
    melody: {
      id: 'swingLow',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', ['IV', 'I'], 'I', 'V7',
        'I', ['IV', 'I'], ['I', 'V7'], 'I',
        'I', ['IV', 'V7'], 'I', 'V7',
        'I', ['IV', 'I'], ['I', 'V7'], 'I',
      ],
      notes: swingLow,
    },
    key: { tonic: 10, mode: 'major' }, // Bb major (source: G)
    bpm: 92,
    source:
      'Traditional African-American spiritual ("Swing Low, Sweet Chariot", anonymous) → public domain. ABC: Thornton Rose after the John C. Campbell Folk School Song Book, https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/mindspring.com/~thornton.rose/SwingLowSweetChariot/0001; transposed from G to Bb.',
  },
  {
    chapter: 'dixieland',
    melody: {
      id: 'joshua',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'i', 'i', 'V7', 'i',
        'i', 'i', 'V7', 'i',
        'i', ['i', 'V7'], 'i', 'V7',
        ['i', 'V7'], ['i', 'V7'], ['i', 'V7'], 'i',
      ],
      notes: joshua,
    },
    key: { tonic: 7, mode: 'minor' }, // G minor (source: D minor)
    bpm: 100,
    source:
      'Traditional African-American spiritual ("Joshua Fit the Battle of Jericho", anonymous) → public domain. ABC: Musica Viva (Frank Nordberg), https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/joshua-fought/joshua-fought-1.abc; refrain + verse once, transposed from D minor to G minor.',
  },
];
