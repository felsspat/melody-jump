// Extra campaign tunes of the chapter "folk" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import type { ChapterTune } from '../notation';
import { type MelodyNote, dq, e, h, q, rest } from '../notation';

// "Wiegenlied" ("Guten Abend, gut' Nacht", Op. 49 No. 4, 1868) by Johannes Brahms (died 1897).
// From the ABC on abcnotation.com (John Chambers' collection, Germany/Wiegenlied, 3/4 in Eb),
// chords as given there. The two grace notes are left out. Pickup "Gu-ten".
const lullabyPickup: MelodyNote[] = [e(4), e(4)];
const lullabyEnd: MelodyNote[] = [
  h(12), e(9), e(5), // Mor-gen früh, wenn
  h(7), e(4), e(0), // Gott will, wirst
];
const lullaby: MelodyNote[] = [
  dq(7), e(4), q(4), // A-bend, gut'
  q(7), rest(1), e(4), e(7), // Nacht, mit Ro-
  q(12), dq(11), e(9), // -sen be-
  q(9), q(7), e(2), e(4), // -dacht, mit Näg-
  q(5), q(2), e(2), e(4), // -lein be-steckt
  q(5), rest(1), e(2), e(5), // schlupf' un-
  e(11), e(9), q(7), q(11), // -ter die Deck'.
  q(12), rest(1), e(0), e(0), // Mor-gen
  ...lullabyEnd,
  q(5), q(7), q(9), // du wie-der ge-
  h(7), e(0), e(0), // weckt, mor-gen
  ...lullabyEnd,
  q(5), q(4), q(2), // wie-der ge-
  h(0), rest(1), // weckt. (room for the pickup)
];

// "What Shall We Do with the Drunken Sailor" (traditional sea shanty). From the ABC on
// thesession.org (tune 15961, setting 56633, D minor). Verse and chorus ("Way hay and up she
// rises"). The source has no chords; these are the usual i – VII of the shanty. The B natural
// (Dorian sixth) in bars 6 and 14 is a passing tone up to the C of the VII chord.
const sailorHalf = (firstBar: MelodyNote[], thirdBar: MelodyNote[]): MelodyNote[] => [
  ...firstBar,
  q(7), q(0), q(3), q(7), // A D F A
  ...thirdBar,
  q(5), q(-2), q(2), q(5), // G C E G
  ...firstBar,
  q(7), q(9), q(10), q(12), // A B C D
  q(10), q(7), q(5), q(2), // C A G E
  h(0), h(0),
];
const drunkenSailor: MelodyNote[] = [
  // What shall we do with a drunk-en sail-or
  ...sailorHalf([q(7), e(7), e(7), q(7), e(7), e(7)], [q(5), e(5), e(5), q(5), e(5), e(5)]),
  // Way hay and up she ris-es
  ...sailorHalf([h(7), dq(7), e(7)], [h(5), dq(5), e(5)]),
];

// "Auld Lang Syne" (traditional Scottish tune, words by Robert Burns, died 1796). Notes and chords
// from the ABC on thesession.org (tune 12441, setting 28012, G major); the long notes in bars 4, 8
// and 12 follow setting 20766 of the same tune page, because 28012 has misprinted bar lengths there.
// The B7 (III7) at the end of bars 2 and 14 leads to Em.
const auldPickup: MelodyNote[] = [q(-5)]; // Should
const auldPhrase: MelodyNote[] = [dq(2), e(0), q(2), [4, 0.75], [2, 0.25]];
const auldLangSyne: MelodyNote[] = [
  dq(0), e(0), q(0), q(4), // auld ac-quaint-ance
  ...auldPhrase, // be for-got and
  dq(0), e(0), q(4), q(7), // nev-er brought to
  [9, 3], q(9), // mind? Should
  dq(7), e(4), q(4), q(0),
  ...auldPhrase,
  dq(0), e(-3), q(-3), q(-5),
  [0, 3], q(9), // … syne? For
  dq(7), e(4), q(4), q(0), // auld lang syne, my
  dq(2), e(0), q(2), q(9), // dear, for auld
  dq(7), e(4), q(4), q(7),
  [9, 3], q(12),
  dq(7), e(4), q(4), q(0),
  ...auldPhrase,
  dq(0), e(-3), q(-3), q(-5),
  [0, 3], rest(1), // syne. (room for the pickup)
];

export const TUNES: ChapterTune[] = [
  {
    chapter: 'folk',
    melody: {
      id: 'brahmsLullaby',
      beatsPerBar: 3,
      bars: 16,
      chords: [
        'I', 'I', 'I', 'V7',
        'V7', 'V7', 'V7', ['I', 'I', 'I7'],
        'IV', 'I', 'IV', 'I',
        'IV', 'I', 'V7', 'I',
      ],
      pickup: lullabyPickup,
      notes: lullaby,
    },
    key: { tonic: 3, mode: 'major' }, // Eb major, as in the source
    bpm: 72,
    source:
      'Johannes Brahms († 1897), "Wiegenlied" Op. 49 No. 4 (1868) → public domain. ABC: https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/Germany/Wiegenlied/0000 (John Chambers), grace notes left out.',
  },
  {
    chapter: 'folk',
    melody: {
      id: 'drunkenSailor',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'i', 'i', 'VII', 'VII', 'i', ['i', 'VII'], 'VII', 'i',
        'i', 'i', 'VII', 'VII', 'i', ['i', 'VII'], 'VII', 'i',
      ],
      notes: drunkenSailor,
    },
    key: { tonic: 2, mode: 'minor' }, // D minor (Dorian melody), as in the source
    bpm: 100,
    source:
      'Traditional sea shanty (19th century) → public domain. ABC: https://thesession.org/tunes/15961 (setting 56633, D minor); chords i – VII added (the source has none).',
  },
  {
    chapter: 'folk',
    melody: {
      id: 'auldLangSyne',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        ['I', 'vi'], ['ii', 'ii', 'V', 'III7'], ['vi', 'I'], 'IV',
        ['I', 'vi'], ['ii', 'ii', 'V', 'III7'], ['vi', 'vi', 'IV', 'V'], ['I', 'I', 'I', 'IV'],
        ['I', 'vi'], ['ii', 'V7'], ['I', 'vi'], 'IV',
        ['I', 'vi'], ['ii', 'ii', 'V', 'III7'], ['vi', 'vi', 'IV', 'V'], 'I',
      ],
      pickup: auldPickup,
      notes: auldLangSyne,
    },
    key: { tonic: 7, mode: 'major' }, // G major, as in the source
    bpm: 76,
    source:
      'Traditional Scottish tune, words by Robert Burns († 1796) → public domain. ABC and chords: https://thesession.org/tunes/12441 (setting 28012; bars 4, 8, 12 from setting 20766).',
  },
];

