// Extra campaign tunes of the chapter "electronic" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import { dh, e, q, rest, type ChapterTune } from '../notation';

export const TUNES: ChapterTune[] = [
  {
    chapter: 'electronic',
    key: { tonic: 2, mode: 'major' }, // D major
    bpm: 124,
    source:
      'Original tune written for Melody Jump: a bright piano-house riff over I – V – vi – IV; the piano hits between the kicks and holds across the beat.',
    melody: {
      id: 'sunrisePiano',
      beatsPerBar: 4,
      bars: 8,
      chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'vi', 'IV'],
      notes: [
        rest(0.5), q(12), q(16), q(14), e(12), // I
        rest(0.5), q(11), q(14), q(11), e(7), // V
        rest(0.5), q(9), q(12), q(16), e(12), // vi
        rest(0.5), q(9), q(12), e(9), e(7), e(5), // IV
        rest(0.5), e(12), e(12), e(14), q(16), e(14), e(12), // I
        rest(0.5), e(11), e(11), e(14), q(14), e(11), e(7), // V
        rest(0.5), e(9), e(12), e(9), q(16), q(12), // vi
        rest(0.5), [12, 1.5], q(9), e(5), e(7), // IV
      ],
    },
  },
  {
    chapter: 'electronic',
    key: { tonic: 5, mode: 'minor' }, // F minor
    bpm: 128,
    source:
      'Original tune written for Melody Jump: an acid-techno arpeggio over i – VI – III – VII that climbs through each chord, then a second half that only plays between the kicks.',
    melody: {
      id: 'acidCircuit',
      beatsPerBar: 4,
      bars: 8,
      chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'],
      notes: [
        e(0), e(7), rest(0.5), e(12), e(3), e(7), rest(0.5), e(15), // i
        e(-4), e(3), rest(0.5), e(8), e(0), e(3), rest(0.5), e(12), // VI
        e(3), e(10), rest(0.5), e(15), e(7), e(10), rest(0.5), e(14), // III
        e(-2), e(5), rest(0.5), e(10), e(2), e(5), rest(0.5), e(14), // VII
        rest(0.5), e(12), rest(0.5), e(12), rest(0.5), e(15), e(12), e(7), // i
        rest(0.5), e(12), rest(0.5), e(8), rest(0.5), e(15), e(12), e(8), // VI
        rest(0.5), e(10), rest(0.5), e(7), rest(0.5), e(15), e(14), e(10), // III
        rest(0.5), e(10), rest(0.5), e(14), e(10), e(5), q(2), // VII
      ],
    },
  },
  {
    chapter: 'electronic',
    key: { tonic: 3, mode: 'major' }, // Eb major
    bpm: 120,
    source:
      'Original tune written for Melody Jump: a warm deep-house line over ii – V – I – vi; long notes that start on the off-beat and float over the kick.',
    melody: {
      id: 'velvetFloor',
      beatsPerBar: 4,
      bars: 8,
      chords: ['ii', 'V', 'I', 'vi', 'ii', 'V', 'I', 'vi'],
      notes: [
        rest(0.5), [9, 1.5], rest(0.5), e(12), e(9), e(5), // ii
        rest(0.5), [11, 1.5], rest(0.5), e(14), e(11), e(7), // V
        rest(0.5), [12, 1.5], rest(0.5), e(11), e(12), e(7), // I
        rest(0.5), [9, 2.5], rest(1), // vi
        rest(0.5), e(5), rest(0.5), e(9), rest(0.5), e(12), e(14), e(12), // ii
        rest(0.5), e(11), rest(0.5), e(14), rest(0.5), e(11), q(7), // V
        rest(0.5), e(7), rest(0.5), e(12), rest(0.5), e(11), q(12), // I
        rest(0.5), dh(9), e(7), // vi
      ],
    },
  },
];
