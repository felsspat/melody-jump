// Extra campaign tunes of the chapter "latin" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import { type ChapterTune, type MelodyNote, dq, e, h, q, rest, w } from '../notation';

// Tangos and habaneras come in 2/4; as in the rags, each 2/4 bar becomes one 4/4 bar
// (sixteenths become eighths, eighths become quarters).

// "El Choclo" (Ángel Villoldo, 1903; Villoldo died 1919). First strain from John Chambers' ABC
// (https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/Argentina/tango/Choclo_Am/0000),
// A minor as there, chords as given there. Grace notes ({gf}, {dc} …) left out. The D# in bar 6 is a
// neighbour tone that falls back into E; the G# over E7 is the raised seventh of A minor.
const elChoclo: MelodyNote[] = [
  e(-4), e(-5), e(-5), e(0), e(0), e(3), e(3), e(8), // F E E A A C C F
  q(8), q(7), rest(0.5), e(7), e(7), e(12),
  e(12), e(7), e(7), e(3), e(3), e(5), e(5), e(3),
  q(3), q(2), rest(0.5), e(-5), e(-5), e(-4),
  e(-4), e(-5), e(-5), e(-1), e(-1), e(2), e(2), e(8), // over E7
  q(8), q(7), rest(0.5), e(7), e(6), e(7),
  e(14), e(11), e(11), e(7), e(7), e(5), e(5), e(3),
  q(2), q(0), rest(0.5), e(-5), e(-5), e(-4),
  e(-4), e(-5), e(-5), e(0), e(0), e(3), e(3), e(8),
  q(8), q(7), rest(0.5), e(7), e(7), e(12),
  e(12), e(7), e(7), e(4), e(4), e(7), e(7), e(10), // over A7 (C#, G)
  q(10), q(8), rest(0.5), e(-4), e(-4), e(8), // over Dm
  e(8), e(7), e(7), e(5), e(5), e(3), e(3), e(2),
  q(2), e(0), e(0), e(0), e(3), e(2), e(0),
  q(0), e(-1), e(2), e(2), e(5), e(3), e(2),
  q(0), rest(3), // room for the pickup
];

// "La Paloma" (Sebastián Iradier, about 1860; Iradier died 1865). From the Essen folk song collection
// (ESAC, no. D0229, a German sailors' version of Iradier's habanera with piano accompaniment), as ABC:
// https://abcnotation.com/tunePage?a=ifdo.ca/~seymour/runabc/esac/dva0/0143 . Only the second half
// is used: the refrain with the habanera rhythm ("Si a tu ventana llega una paloma", C C–C C–B)
// and the closing "Ay, chinita, que sí" with both endings. C major as in the source. The F# (bars 16, 24)
// is the third of D7 (II7), the secondary dominant leading to G.
const palomaRefrainA: MelodyNote[] = [
  e(12), q(12), e(12), q(12), q(11), // Si a tu ven-ta-na
  e(14), q(14), e(12), q(11), q(9), // lle-ga u-na pa-
  q(9), [7, 7], // lo-ma
];
const palomaRefrainB: MelodyNote[] = [
  e(11), q(11), e(11), q(11), q(9),
  e(9), q(7), e(7), q(7), q(9),
  e(7), e(5), // …
];
const palomaChinita: MelodyNote[] = [
  e(7), e(7), e(7), q(9), e(6), // Ay, chi-ni-ta que
  w(7), // sí
  rest(1), e(7), e(7), e(7), q(7), e(9),
  h(11), // the d is tied into the next bar
];
const laPaloma: MelodyNote[] = [
  ...palomaRefrainA,
  ...palomaRefrainB, [4, 7],
  ...palomaRefrainA,
  ...palomaRefrainB, [4, 4],
  ...palomaChinita,
  [14, 2.5], q(16), e(12), e(14), q(11), e(12),
  e(9), q(11), e(12), [16, 1.5], e(14),
  e(2), q(4), e(5), [9, 1.5], e(7),
  [4, 4],
  rest(1), e(7), e(7), e(7), q(9), e(6),
  w(7),
  rest(1), e(7), e(7), e(7), q(7), e(9),
  h(11),
  [14, 2.5], q(17), e(16), e(14), q(16), e(12),
  e(14), q(11), e(12), [16, 1.5], e(14),
  e(2), q(4), e(5), [9, 1.5], e(7),
  [12, 3], rest(1),
];

// "La Cucaracha" (traditional Mexican/Spanish song, anonymous). From the Musica Viva ABC
// (https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/anon/la-cucaracha/la-cucaracha-1/0000),
// D major as there. The source has verse then chorus; here the chorus ("La cu-ca-ra-cha", with its
// pickup) comes first, then the verse. Only the melody is used (the English words of that edition are not).
const cucarachaChorus: MelodyNote[] = [
  dq(0), e(4), rest(0.5), e(-5), e(-5), e(-5), // -ra-cha, la cu-ca-
  dq(0), [4, 1.5], rest(1), // ra-cha
  rest(0.5), q(0), e(0), e(-1), e(-1), e(-3), e(-3),
  h(-5), rest(0.5), e(-5), e(-5), e(-5),
  dq(-1), e(2), rest(0.5), e(-5), e(-5), e(-5),
  dq(-1), [2, 1.5], rest(1),
  rest(0.5), q(7), e(9), e(7), e(5), e(4), e(2),
  h(0), rest(2),
];
const cucarachaVerse: MelodyNote[] = [
  rest(0.5), q(-5), e(-5), e(0), e(0), e(4), e(4),
  dq(7), [4, 1.5], rest(1),
  rest(0.5), q(7), e(9), e(7), e(5), e(4), e(7),
  dq(5), [2, 1.5], rest(1),
  rest(0.5), q(-5), e(-5), e(-1), e(-1), e(2), e(2),
  dq(5), [2, 1.5], rest(1),
  rest(0.5), q(7), e(9), e(7), e(5), e(4), e(2),
  h(0), rest(2), // room for the pickup
];

// "Abendbrise" / "Evening Breeze": an original bossa nova melody written for Melody Jump. Notes start
// after the beat and are anticipated over the bar line (bars 1→2, 5→6, 9→10, 13→14) – the typical
// bossa/son phrasing. The F# over II7 is its third (secondary dominant leading to ii … V7).
const breezeA: MelodyNote[] = [
  rest(0.5), e(7), e(9), e(7), q(4), e(2), [9, 2], // tied into bar 2
  e(7), h(4),
  rest(0.5), e(9), e(9), e(6), q(9), e(12), e(14),
  [12, 1.5], e(9), e(6), e(9), rest(1),
  rest(0.5), e(5), e(9), e(12), q(14), e(12), [11, 2], // tied into bar 6
];
const eveningBreeze: MelodyNote[] = [
  ...breezeA,
  e(9), e(7), e(5), q(2),
  rest(0.5), e(4), e(5), e(7), h(12),
  rest(1), e(11), e(12), e(14), e(11), q(7),
  ...breezeA,
  e(14), e(12), e(11), e(7), e(5),
  [4, 1.5], e(2), h(0),
  rest(0.5), e(7), e(9), e(7), h(12),
];

export const TUNES: ChapterTune[] = [
  {
    chapter: 'latin',
    melody: {
      id: 'elChoclo',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'i', 'i', 'i', 'V7',
        'V7', 'V7', 'V7', 'i',
        'i', 'i', 'I7', 'iv',
        'iv', 'i', 'V7', 'i',
      ],
      pickup: [e(-5), e(-5), e(-4)], // E E F
      notes: elChoclo,
    },
    key: { tonic: 9, mode: 'minor' }, // A minor, as in the source
    bpm: 120,
    source:
      'Ángel Villoldo († 1919), tango "El Choclo" (1903) → public domain. First strain from John Chambers\' ABC: ' +
      'https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/Argentina/tango/Choclo_Am/0000 ' +
      '(2/4 bars written as 4/4 bars with doubled durations, grace notes left out, chords as in the source).',
  },
  {
    chapter: 'latin',
    melody: {
      id: 'laCucaracha',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', 'I', 'I', 'V',
        'V7', 'V7', 'V7', 'I',
        'I', 'I', 'I', 'V7',
        'V7', 'V7', 'V7', 'I',
      ],
      pickup: [e(-5), e(-5), e(-5)], // la cu-ca-
      notes: [...cucarachaChorus, ...cucarachaVerse],
    },
    key: { tonic: 2, mode: 'major' }, // D major, as in the source
    bpm: 112,
    source:
      'Traditional Mexican song "La Cucaracha" (anonymous → public domain). Melody from the Musica Viva ABC: ' +
      'https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/anon/la-cucaracha/la-cucaracha-1/0000 ' +
      '(chorus moved before the verse, chords as in the source; only the melody is used).',
  },
  {
    chapter: 'latin',
    melody: {
      id: 'laPaloma',
      beatsPerBar: 4,
      bars: 31,
      chords: [
        'I', 'V7', 'V', 'V',
        'V7', 'V7', 'I', 'I',
        'I', 'V7', 'V', 'V',
        'V7', 'V7', 'I', ['I', 'II7'],
        'V', 'V', 'V7', 'V7',
        ['IV', 'I'], 'V7', 'I', ['I', 'II7'],
        'V', 'V', 'V7', 'V7',
        ['V7', 'I'], 'V7', 'I',
      ],
      notes: laPaloma,
    },
    key: { tonic: 0, mode: 'major' }, // C major, as in the source
    bpm: 104,
    source:
      'Sebastián Iradier († 1865), habanera "La Paloma" (about 1860) → public domain. Refrain and "Ay, chinita" part from the ' +
      'Essen folk song collection (ESAC D0229) as ABC: https://abcnotation.com/tunePage?a=ifdo.ca/~seymour/runabc/esac/dva0/0143 ' +
      '(2/4 bars written as 4/4 bars with doubled durations; chords added).',
  },
  {
    chapter: 'latin',
    melody: {
      id: 'eveningBreeze',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', 'I', 'II7', 'II7',
        'ii', 'V7', 'I', 'V7',
        'I', 'I', 'II7', 'II7',
        'ii', 'V7', 'I', 'I',
      ],
      notes: eveningBreeze,
    },
    key: { tonic: 5, mode: 'major' }, // F major
    bpm: 116,
    source: 'Original tune written for Melody Jump (bossa nova style, chords I–II7–ii–V7).',
  },
];
