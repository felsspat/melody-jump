// Extra campaign tunes of the chapter "country" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import type { ChapterTune } from '../notation';
import { type MelodyNote, dh, dq, e, h, q, rest, w } from '../notation';

/** Eight eighth notes (one 4/4 bar of a reel). */
const eighths = (...offsets: number[]): MelodyNote[] => offsets.map(e);

// "Soldier's Joy" (traditional fiddle tune, 18th century; a bluegrass and old-time standard).
// From the ABC on thesession.org (tune 1356, setting 39289, D major, chords given there).
// Each 4/4 bar of eighths is one bar here; the pickup "FG" of the A part opens the tune, the
// pickup "de" of the B part sits at the end of bar 8. Nothing simplified.
const joyAFirst = eighths(7, 4, 0, 4, 7, 4, 0, 4); // AFDF AFDF
const soldiersJoy: MelodyNote[] = [
  ...joyAFirst,
  q(7), q(12), q(12), e(11), e(9), // A2d2 d2cB
  ...joyAFirst,
  q(5), q(2), q(2), e(4), e(5), // G2E2 E2FG
  ...joyAFirst,
  q(7), q(12), q(12), e(14), e(17), // A2d2 d2eg
  ...eighths(16, 19, 16, 12, 14, 17, 14, 11), // fafd egec
  q(14), q(12), q(12), e(12), e(14), // e2d2 d2 | de (pickup of the B part)
  q(16), e(16), e(12), ...eighths(16, 19, 17, 16), // f2fd fagf
  q(14), e(14), e(11), ...eighths(14, 17, 16, 14), // e2ec egfe
  q(16), e(16), e(12), ...eighths(16, 19, 17, 16), // f2fd fagf
  ...eighths(14, 12, 11, 9), q(7), e(12), e(14), // edcB A2de
  ...eighths(16, 12, 7, 12, 16, 19, 17, 16), // fdAd fagf
  ...eighths(14, 11, 7, 11, 14, 17, 16, 14), // ecAc egfe
  ...eighths(16, 19, 16, 12, 14, 17, 14, 11), // fafd egec
  q(14), q(12), q(12), rest(1), // e2d2 d2 (room for the pickup)
];

// "Cripple Creek" (traditional Appalachian fiddle and banjo tune). From the ABC on thesession.org
// (tune 23886, setting 49222, A major, chords given there). Nothing simplified; only the last
// note is shortened to make room for the pickup "e".
const creekHigh: MelodyNote[] = [
  ...eighths(5, 7, 9, 5), q(7), e(7), e(7), // defd e2ee
];
const creekLow: MelodyNote[] = eighths(-5, -3, 0, 2); // EFAB
const creekB: MelodyNote[] = [
  ...eighths(2, 4, 2, 0), q(-3), q(0), // BcBA F2A2
];
const crippleCreek: MelodyNote[] = [
  ...eighths(11, 12, 12, 12, 9, 7, 4, 0), // gaaa fecA
  ...creekHigh,
  e(2), e(4), q(7), e(4), e(2), e(0), e(-3), // Bce2 cBAF
  ...creekLow, q(0), e(7), e(7), // EFAB A2ee
  e(11), q(12), e(14), e(12), e(9), e(7), e(4), // ga2b afec
  ...creekHigh,
  ...eighths(2, 4, 7, 9, 7, 4, 2, 0), // Bcef ecBA
  ...creekLow, dq(0), e(0), // EFAB A3A
  ...eighths(2, 4, 4, 4, 2, 0, -3, 0), // Bccc BAFA
  ...creekB,
  ...eighths(2, 4, 7, 4, 2, 0, -3, -7), // Bcec BAFD
  ...creekLow, q(0), e(0), e(0), // EFAB A2AA
  ...eighths(2, 4, 4, 4, 2, 4, 4, 4), // Bccc Bccc
  ...creekB,
  ...eighths(2, 4, 7, 9, 7, 4, 2, 0), // Bcef ecBA
  ...creekLow, dq(0), rest(0.5), // EFAB A4 (room for the pickup)
];

// "Shady Grove" (traditional Appalachian song, modal: E minor / Dorian without the sixth).
// From the ABC on thesession.org (tune 14220, setting 25846, notated with one sharp, tonic E).
// The source has no chords; these are the usual i – VII (Em – D) with III (G) in bar 5.
const shadyGrove: MelodyNote[] = [
  q(0), q(0), q(0), e(0), e(0), // E2 E2 E2 EE
  q(2), q(0), h(-2), // F2 E2 D4
  q(0), e(0), e(0), q(2), q(5), // E2 EE F2 A2
  dh(7), q(7), // B6 B2
  dq(10), e(10), q(7), q(7), // d3 d B2 B2
  q(5), e(2), e(0), h(-2), // A2 FE D4
  q(0), e(2), e(2), q(5), q(2), // E2 FF A2 F2
  w(0), // E8
];

// "Home on the Range" (words Brewster Higley, died 1911; music Daniel Kelley, died 1905), a waltz.
// From Frank Nordberg's Musica Viva ABC (X:522, G major, 3/4, chords given), mirrored by John Chambers:
// https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/home-on-the-range/0000
// Verse and chorus as in the source, nothing simplified. Pickup "Oh,".
const rangePickup: MelodyNote[] = [q(-5)];
const rangeOpen: MelodyNote[] = [
  q(-5), q(0), q(2), // give me a
  h(4), e(0), e(-1), // home where the
  q(-3), q(5), q(5), // buf-fa-lo
];
const rangeEnd: MelodyNote[] = [
  dq(4), e(2), q(0), // skies are not
  q(-1), q(0), q(2), // cloud-y all
  [0, 4], rest(2), // day.
];
const rangeSeldom: MelodyNote[] = [
  ...rangeOpen, // sel-dom is heard a dis-
  h(5), e(5), e(5), // -cour-ag-ing word, and the
  ...rangeEnd,
];
const homeOnTheRange: MelodyNote[] = [
  ...rangeOpen,
  h(5), e(4), e(5), // roam, where the
  dq(7), e(0), q(0), // deer and the
  q(0), q(-1), q(0), // ant-e-lope
  [2, 4], rest(1), e(-5), e(-5), // play. Where
  ...rangeSeldom,
  dh(7), // Home,
  q(5), dq(4), e(2), // home on the
  [4, 4], rest(1), e(-5), e(-5), // range, where the
  dq(0), e(0), q(0), // deer and the
  q(0), q(-1), q(0), // ant-e-lope
  [2, 4], rest(1), e(-5), e(-5), // play. Where
  ...rangeSeldom,
];

export const TUNES: ChapterTune[] = [
  {
    chapter: 'country',
    melody: {
      id: 'soldiersJoy',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', ['I', 'IV'], 'I', ['II7', 'V7'], 'I', ['I', 'IV'], ['I', 'V7'], 'I',
        'I', 'V7', 'I', ['II7', 'V7'], 'I', ['ii', 'V7'], ['I', 'V7'], 'I',
      ],
      pickup: [e(4), e(5)],
      notes: soldiersJoy,
    },
    key: { tonic: 2, mode: 'major' }, // D major, as in the source
    bpm: 110,
    source:
      'Traditional fiddle tune (18th century) → public domain. ABC and chords: https://thesession.org/tunes/1356 (setting 39289, D major).',
  },
  {
    chapter: 'country',
    melody: {
      id: 'crippleCreek',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', ['IV', 'I'], 'I', ['V', 'I'], 'I', ['IV', 'I'], 'I', ['V', 'I'],
        'I', 'I', 'I', ['V', 'I'], 'I', 'I', 'I', ['V', 'I'],
      ],
      pickup: [e(7)],
      notes: crippleCreek,
    },
    key: { tonic: 9, mode: 'major' }, // A major, as in the source
    bpm: 112,
    source:
      'Traditional Appalachian fiddle/banjo tune (19th century) → public domain. ABC and chords: https://thesession.org/tunes/23886 (setting 49222, A major).',
  },
  {
    chapter: 'country',
    melody: {
      id: 'shadyGrove',
      beatsPerBar: 4,
      bars: 8,
      chords: ['i', 'VII', 'i', 'i', 'III', 'VII', ['i', 'VII'], 'i'],
      notes: shadyGrove,
    },
    key: { tonic: 4, mode: 'minor' }, // E minor (modal tune), as in the source
    bpm: 100,
    source:
      'Traditional Appalachian song → public domain. ABC: https://thesession.org/tunes/14220 (setting 25846, tonic E); chords i – VII – III added (the source has none).',
  },
  {
    chapter: 'country',
    melody: {
      id: 'homeOnTheRange',
      beatsPerBar: 3,
      bars: 32,
      chords: [
        'I', 'I', 'IV', 'IV', 'I', 'I', 'V7', 'V7',
        'I', 'I', 'IV', 'IV', 'I', 'V7', 'I', 'I',
        'I', 'V7', 'I', 'I', 'I', 'I', 'V7', 'V7',
        'I', 'I', 'IV', 'IV', 'I', 'V7', 'I', 'I',
      ],
      pickup: rangePickup,
      notes: homeOnTheRange,
    },
    key: { tonic: 7, mode: 'major' }, // G major, as in the source
    bpm: 120,
    source:
      'Brewster Higley († 1911, words) and Daniel Kelley († 1905, music), 1872 → public domain. ABC and chords: Musica Viva (Frank Nordberg, X:522) via https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/home-on-the-range/0000',
  },
];
