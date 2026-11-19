// Extra campaign tunes of the chapter "baroque" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import { type ChapterTune, type MelodyNote, dh, dq, e, h, q, rest, w } from '../notation';

// "Minuet in G" (BWV Anh. 114, from the Notebook for Anna Magdalena Bach, 1725) by Christian
// Petzold (died 1733), long attributed to J. S. Bach. First strain (16 bars with its second
// ending), melody and chords from the ABC "Minuet in G Major" (SPUDS tune swap, edited by AW after
// ClassicMan at musescore.com). The grace note in bar 8 is left out; the inversions of the chords
// (D7/A, G/B …) are written as plain chords, and the D7 on beat 2 of bar 1 is left out.
const minuetCall: MelodyNote[] = [
  q(7), e(0), e(2), e(4), e(5), // D G A B C
  q(7), q(0), q(0), // D G G
  q(9), e(5), e(7), e(9), e(11), // E C D E F#
  q(12), q(0), q(0), // G G G
  q(5), e(7), e(5), e(4), e(2), // C D C B A
  q(4), e(5), e(4), e(2), e(0), // B C B A G
];
const minuetInG: MelodyNote[] = [
  ...minuetCall,
  q(-1), e(0), e(2), e(4), e(0), // F# G A B G
  dh(2), // A (half cadence)
  ...minuetCall,
  q(2), e(4), e(2), e(0), e(-1), // A B A G F#
  dh(0), // G
];

// "Rondeau" from the incidental music to "Abdelazer" (1695) by Henry Purcell (died 1695).
// First strain from the ABC on thesession.org (tune 10911, setting 1, D minor, 3/2). Each 3/2 bar
// becomes two 3/4 bars (durations unchanged). Bars 3–6 of the source are a falling sequence:
// the same broken-chord figure on D minor, C, Bb and A, each time one step lower. The source has no
// chords; they follow the broken chords of the melody (the long note at the end of each figure
// becomes the next chord of the circle of fifths: Gm, F, Gm, Dm).
const rondeau: MelodyNote[] = [
  h(0), h(3), h(7), // D F A (rising through two 3/4 bars)
  q(12), e(14), e(15), e(17), e(15), e(14), e(12), h(11), // d e f g f e d c#
  q(19), e(12), e(15), e(19), e(15), q(12), h(20), // a d f a f d Bb (sequence 1)
  q(17), e(10), e(14), e(17), e(14), q(10), h(19), // g c e g e c a (one step lower)
  q(15), e(8), e(12), e(15), e(12), q(8), h(17), // f Bb d f d Bb g
  q(14), e(7), e(11), e(14), e(11), q(7), h(15), // e A c# e c# A f
  e(14), e(15), e(14), e(12), q(11), q(15), e(14), e(15), e(14), e(12), // e f e d c# f e f e d
  q(7), q(12), e(11), e(12), e(14), e(12), h(12), // A d c# d e d d (cadence)
];

// "The Arrival of the Queen of Sheba" (Sinfonia from "Solomon", 1749) by George Frideric Handel
// (died 1759). Melody and chords from Colin Hume's ABC (Bb major, 2/2, the violin's running
// sixteenths written as eighths). Used: bars 1–12 and the last four bars (29–32), so the level ends
// on the tonic; the middle part (bars 13–28) is left out. The low Bb at the very end is played an
// octave higher. Bar 13 here is a rising sequence: the same two-note figure on Bb, Cm, Dm and Eb.
const shebaFanfare: MelodyNote[] = [e(12), e(7), e(4), e(7), e(12), e(7), e(4), e(7)]; // b f d f b f d f
const queenOfSheba: MelodyNote[] = [
  ...shebaFanfare,
  ...shebaFanfare,
  e(2), e(12), e(11), e(9), e(7), e(5), e(4), e(2), // c b a g f e d c
  e(4), e(0), e(2), e(4), e(5), e(7), e(9), e(11), // d B c d e f g a
  ...shebaFanfare,
  e(12), e(6), e(2), e(6), e(12), e(9), e(2), e(9), // b =e c e b g c g (over C7)
  e(11), e(9), e(7), e(9), q(2), q(6), // a g f g c =e
  q(7), e(2), e(4), e(2), e(4), e(2), e(4), // f c d c d c d
  e(2), e(-1), e(-5), e(-1), e(2), e(-1), e(-5), e(-1), // c A F A (falling sequence: F …)
  e(7), e(4), e(0), e(4), e(7), e(4), e(0), e(4), // f d B d (… Bb …)
  e(5), e(2), e(-1), e(2), e(5), e(2), e(-1), e(2), // e c A c (… F7)
  e(4), e(-5), e(-3), e(-1), e(0), e(2), e(4), e(5), // d F G A B c d e
  e(4), e(7), e(5), e(9), e(7), e(11), e(9), e(12), // d f e g f a g b (rising sequence)
  q(11), e(9), e(7), q(12), q(5), // a g f b e
  q(4), e(2), e(0), q(-5), q(-1), // d c B F A
  q(0), q(-5), h(0), // B F B
];

// "Prince of Denmark's March" ("Trumpet Voluntary", c. 1700) by Jeremiah Clarke (died 1707).
// Melody from the ABC by Chris Myers (2/4, D major); chords from Colin Hume's ABC "The Temple"
// (Playford 1701, the same tune), whose chords match this melody bar by bar. As in the ragtime
// chapter, each 2/4 bar becomes a 4/4 bar (sixteenths become eighths). Trills left out. Form:
// A – B – A. In bar 12 the low F# and D of the source are played an octave higher.
const marchA: MelodyNote[] = [
  h(12), q(14), e(12), e(14), // D E (trill written out as D E)
  dq(16), e(17), q(16), q(14), // F# G F# E
  q(12), q(14), q(16), e(14), e(12), // D E F# E D
  q(14), e(7), e(7), q(7), q(7), // E A A A A
  h(12), q(14), e(12), e(14),
  dq(16), e(17), q(16), q(14),
  e(12), e(14), e(12), e(14), dq(14), e(12), // D E D E E D
  w(12), // D
];
const marchB: MelodyNote[] = [
  h(16), q(18), e(16), e(18), // F# G# F# G#
  dq(19), e(21), q(19), q(17), // A B A G
  q(16), q(12), q(12), q(7), // F# D D A
  q(12), q(7), q(16), q(12), // D A F# D (F# and D an octave up)
  h(16), q(18), e(16), e(18),
  dq(19), e(21), q(19), q(17),
  q(16), e(14), e(12), e(12), e(14), e(16), e(17), // F# E D D E F# G
  q(14), rest(3), // E (half cadence)
];

export const TUNES: ChapterTune[] = [
  {
    chapter: 'baroque',
    melody: {
      id: 'minuetInG',
      beatsPerBar: 3,
      bars: 16,
      chords: [
        'I', 'I', 'IV', 'I',
        'ii', 'I', ['V', 'I', 'I'], 'V7',
        'I', 'I', 'IV', 'I',
        'ii', 'I', ['ii', 'I', 'V'], 'I',
      ],
      notes: minuetInG,
    },
    key: { tonic: 7, mode: 'major' }, // G major, as in the original
    bpm: 108,
    source:
      'Christian Petzold († 1733), Minuet in G, BWV Anh. 114 (1725) → public domain. ABC (with chords): https://abcnotation.com/tunePage?a=spuds.thursdaycontra.com/TuneSwaps/0_SPUDS_TuneSwap_All/0470 – first strain, grace note left out.',
  },
  {
    chapter: 'baroque',
    melody: {
      id: 'abdelazerRondeau',
      beatsPerBar: 3,
      bars: 16,
      chords: [
        'i', 'i', 'i', 'V7',
        'i', ['i', 'iv', 'iv'], 'VII', ['VII', 'III', 'III'],
        'VI', ['VI', 'iv', 'iv'], 'V7', ['V7', 'i', 'i'],
        'V7', 'i', ['i', 'i', 'V7'], ['V7', 'i', 'i'],
      ],
      notes: rondeau,
    },
    key: { tonic: 2, mode: 'minor' }, // D minor, as in the source
    bpm: 110,
    source:
      'Henry Purcell († 1695), Rondeau from "Abdelazer" (1695) → public domain. ABC: https://thesession.org/tunes/10911 (setting 1, D minor, 3/2; each 3/2 bar written as two 3/4 bars). First strain; chords added from the broken chords of the melody (the source has none).',
  },
  {
    chapter: 'baroque',
    melody: {
      id: 'queenOfSheba',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', 'I', ['IV', 'V'], 'I',
        ['I', 'vi'], 'II7', ['V', 'I', 'II7', 'II7'], 'V',
        ['V', 'V7'], ['I', 'vi'], ['ii', 'V7'], 'I',
        ['I', 'ii', 'iii', 'IV'], ['V', 'V', 'I', 'IV'], ['I', 'IV', 'V', 'V'], 'I',
      ],
      notes: queenOfSheba,
    },
    key: { tonic: 10, mode: 'major' }, // Bb major, as in the original
    bpm: 104,
    source:
      'George Frideric Handel († 1759), "The Arrival of the Queen of Sheba" from "Solomon" (1749) → public domain. ABC with chords by Colin Hume: https://abcnotation.com/tunePage?a=colinhume.com/ABC.txt/0047 – bars 1–12 and 29–32, final low Bb an octave up.',
  },
  {
    chapter: 'baroque',
    melody: {
      id: 'trumpetVoluntary',
      beatsPerBar: 4,
      bars: 24,
      chords: [
        ['I', 'V'], ['I', 'V'], 'I', ['V', 'V7'],
        ['I', 'V'], ['I', 'V'], ['I', 'IV', 'V7', 'V7'], 'I',
        ['I', 'II7'], 'V', 'I', 'I',
        ['I', 'II7'], 'V', ['I', 'IV'], 'V',
        ['I', 'V'], ['I', 'V'], 'I', ['V', 'V7'],
        ['I', 'V'], ['I', 'V'], ['I', 'IV', 'V7', 'V7'], 'I',
      ],
      notes: [...marchA, ...marchB, ...marchA],
    },
    key: { tonic: 2, mode: 'major' }, // D major, as in the source
    bpm: 96,
    source:
      'Jeremiah Clarke († 1707), "Prince of Denmark\'s March" ("Trumpet Voluntary", c. 1700) → public domain. Melody: ABC by Chris Myers, https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/ChrisMyers/KG_tunes_webready/0014 (2/4 bars written as 4/4, trills left out); chords from Colin Hume\'s "The Temple": https://abcnotation.com/tunePage?a=colinhume.com/ABC.txt/1372',
  },
];
