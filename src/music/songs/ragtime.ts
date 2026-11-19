// Extra campaign tunes of the chapter "ragtime" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import { type ChapterTune, type MelodyNote, e, h, q, rest } from '../notation';

// The rags below come in 2/4; as in the Maple Leaf Rag, each 2/4 bar becomes a 4/4 bar
// (eighths become quarters, sixteenths become eighths).

// "The Easy Winners" (Scott Joplin, 1901; Joplin died 1917). First strain, top line only, from the
// KernScores/Humdrum edition by Craig Stuart Sapp (ABC: https://ifdo.ca/~seymour/kern2abc/joplin.abc,
// "The Easy Winners"). In bar 4 the held Eb is shortened so the run below it (Eb–F–G–Ab–Bb–B) is
// playable; the B natural is a passing tone into the C of bar 5.
const winnersCall: MelodyNote[] = [
  q(4), h(4), q(7), // C C– Eb
  e(9), q(7), e(9), e(7), e(9), q(7), // F Eb F Eb F Eb (syncopated)
];
const easyWinners: MelodyNote[] = [
  ...winnersCall,
  e(14), q(12), e(14), e(12), e(14), e(12), [7, 1.5], // Bb Ab Bb Ab Bb Ab Eb–
  e(-5), e(-3), e(-1), e(0), e(2), e(3), // run up to C
  q(4), h(4), q(7),
  e(9), q(7), e(9), e(7), e(7), q(7),
  e(7), q(2), e(7), e(6), e(7), q(9), // Eb Bb Eb D Eb F
  [7, 2.5], e(-5), e(-1), e(5), // Eb– (Eb G Db over Eb7)
  ...winnersCall,
  e(14), q(12), e(14), e(12), e(12), e(14), [16, 3.5], // … C held over C7
  e(11), e(12),
  e(14), q(12), e(14), e(12), e(14), e(12), [7, 1],
  e(9), e(7), e(5), e(4), q(7), e(7),
  e(7), q(5), e(7), e(5), e(4), q(2), // over Eb7
  [0, 3], rest(1),
];

// "Twelfth Street Rag" (Euday L. Bowman, 1914; Bowman died 1949). First strain from Colin Hume's
// ABC (https://abcnotation.com/tunePage?a=colinhume.com/ABC.txt/1431), chords as given there
// ("D9" written as II7). The famous figure repeats three notes in groups of four eighths, so the
// accent wanders across the beat. The A# in bar 15 is a passing tone into B.
const twelfthFigure: MelodyNote[] = [e(12), e(11), e(9), e(12), e(11), e(9), e(12), e(11)];
const twelfthAnswer: MelodyNote[] = [e(9), e(12), e(11), e(9), e(12), e(11), e(9), rest(0.5)];
const twelfthStreet: MelodyNote[] = [
  ...twelfthFigure, ...twelfthAnswer,
  ...twelfthFigure, q(9), rest(3),
  ...twelfthFigure, ...twelfthAnswer,
  ...twelfthFigure, e(9), rest(3.5),
  ...twelfthFigure, ...twelfthAnswer,
  ...twelfthFigure, q(9), rest(3),
  h(4), q(2), rest(1), // E D (over the ninth chord)
  h(11), q(9), rest(1),
  e(7), q(7), e(7), q(9), q(10), // G G G A A#
  q(11), q(7), q(9), q(11),
];

// "Elite Syncopations" (Scott Joplin, 1902). Second strain, top line only, from the KernScores/Humdrum
// edition by Craig Stuart Sapp (ABC: https://ifdo.ca/~seymour/kern2abc/joplin.abc, "Elite Syncopations
// Rag"). The first strain was left out: its chromatic chords (Db7, diminished chords) do not fit the
// game's chord symbols. Pickup C C C C; bar 7 leans on E7 (VII7) with its G#.
const elitePickup: MelodyNote[] = [e(7), e(7), q(7), q(7)];
const eliteRun: MelodyNote[] = [e(11), e(9), e(7), e(5), e(4), q(5)]; // E D C Bb A Bb
const eliteHome: MelodyNote[] = [e(0), e(4), e(9), [7, 1.5], q(7)]; // F A D C– C
const eliteSyncopations: MelodyNote[] = [
  ...eliteRun, e(2),
  e(0), e(2), e(4), q(-5), e(4), e(2), e(0),
  e(-1), e(0), e(2), q(-5), e(5), e(4), e(2),
  ...eliteHome,
  ...eliteRun, e(-1),
  e(0), e(-1), e(0), q(4), e(4), e(2), e(0),
  e(-1), e(7), e(6), e(4), e(3), q(5), e(-1), // E C B A G# Bb E
  q(4), rest(1), h(7),
  ...eliteRun, e(2),
  e(0), e(2), e(4), q(-5), e(4), e(2), e(0),
  e(-1), e(0), e(2), q(-5), e(5), e(4), e(2),
  ...eliteHome,
  e(9), q(14), q(9), e(14), q(9), // D G D G D (over Gm)
  e(7), q(12), q(7), e(12), q(7), // C F C F C
  e(5), e(2), e(9), q(7), e(5), q(-1),
  q(0), rest(3), // room for the pickup
];

export const TUNES: ChapterTune[] = [
  {
    chapter: 'ragtime',
    melody: {
      id: 'easyWinners',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', 'I', 'IV', 'I',
        'I', 'I', ['V', 'II7'], 'V7',
        'I', 'I', 'IV', 'III7',
        'IV', 'I', 'V7', 'I',
      ],
      notes: easyWinners,
    },
    key: { tonic: 8, mode: 'major' }, // Ab major, as in the original
    bpm: 84,
    source:
      'Scott Joplin († 1917), "The Easy Winners" (1901) → public domain. First strain, top line, from the KernScores edition (C. S. Sapp) as ABC: https://ifdo.ca/~seymour/kern2abc/joplin.abc',
  },
  {
    chapter: 'ragtime',
    melody: {
      id: 'twelfthStreet',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', 'I', 'V7', 'V7',
        'V7', 'V7', 'I', 'I',
        'I', 'I', 'V7', 'V7',
        'II7', 'II7', 'V7', 'V7',
      ],
      notes: twelfthStreet,
    },
    key: { tonic: 10, mode: 'major' }, // Bb major (the source also gives it in C)
    bpm: 96,
    source:
      'Euday L. Bowman († 1949), "Twelfth Street Rag" (1914) → public domain in the EU since 2020. First strain from Colin Hume\'s ABC: https://abcnotation.com/tunePage?a=colinhume.com/ABC.txt/1431 (cross-checked with John Chambers\' ABC).',
  },
  {
    chapter: 'ragtime',
    melody: {
      id: 'eliteSyncopations',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'V7', 'I', 'V7', 'I',
        ['V7', 'III7'], 'vi', ['iii', 'VII7'], ['iii', 'V7'],
        'V7', 'I', 'V7', 'I',
        'ii', 'I', 'V7', 'I',
      ],
      pickup: elitePickup,
      notes: eliteSyncopations,
    },
    key: { tonic: 5, mode: 'major' }, // F major, as in the original
    bpm: 80,
    source:
      'Scott Joplin († 1917), "Elite Syncopations" (1902) → public domain. Second strain, top line, from the KernScores edition (C. S. Sapp) as ABC: https://ifdo.ca/~seymour/kern2abc/joplin.abc',
  },
];
