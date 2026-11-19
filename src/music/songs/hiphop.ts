// Extra campaign tunes of the chapter "hiphop" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import { e, h, q, rest, type ChapterTune } from '../notation';

export const TUNES: ChapterTune[] = [
  {
    chapter: 'hiphop',
    key: { tonic: 2, mode: 'minor' }, // D minor
    bpm: 90,
    source:
      'Original tune written for Melody Jump: a dusty piano loop over i – iv, like a sample lifted from an old record, with a rest in every bar for the beat.',
    melody: {
      id: 'dustyKeys',
      beatsPerBar: 4,
      bars: 8,
      chords: ['i', 'iv', 'i', 'iv', 'i', 'iv', 'VI', 'VII'],
      notes: [
        q(7), e(3), e(7), rest(0.5), e(12), q(10), // i
        q(8), e(5), e(8), rest(1), q(0), // iv
        q(7), e(3), e(7), rest(0.5), e(12), q(10), // i
        q(8), e(5), e(8), rest(0.5), e(10), q(12), // iv
        q(7), e(3), e(7), rest(0.5), e(12), q(10), // i
        q(8), e(12), e(8), q(5), rest(1), // iv
        rest(0.5), e(8), e(12), e(15), h(12), // VI
        q(14), e(10), e(5), h(2), // VII
      ],
    },
  },
  {
    chapter: 'hiphop',
    key: { tonic: 0, mode: 'minor' }, // C minor
    bpm: 86,
    source:
      'Original tune written for Melody Jump: a jazzy late-night hook that keeps landing on the sevenths of the chords (the soft "minor-seven" colour of jazz samples).',
    melody: {
      id: 'vinylRain',
      beatsPerBar: 4,
      bars: 8,
      chords: ['i', 'iv', 'VII', 'III', 'VI', 'iv', 'v', 'v'],
      notes: [
        rest(1), e(10), e(12), q(15), e(14), e(10), // i
        q(12), rest(0.5), e(8), e(10), e(12), q(15), // iv
        q(14), e(10), e(8), h(10), // VII
        rest(0.5), e(7), e(10), e(14), q(15), q(14), // III
        q(12), e(15), e(12), q(7), e(8), e(10), // VI
        q(12), e(8), e(5), h(3), // iv
        rest(0.5), e(2), e(5), e(7), q(10), e(14), e(12), // v
        q(10), q(7), rest(2), // v
      ],
    },
  },
  {
    chapter: 'hiphop',
    key: { tonic: 1, mode: 'minor' }, // C# minor
    bpm: 84,
    source:
      'Original tune written for Melody Jump: a dark, sparse hook over i – VI – iv – v; a repeated note leans on its upper neighbour like a horror-film sample.',
    melody: {
      id: 'concreteShadows',
      beatsPerBar: 4,
      bars: 8,
      chords: ['i', 'VI', 'iv', 'v', 'i', 'VI', 'iv', 'v'],
      notes: [
        e(7), e(7), rest(0.5), e(8), q(7), rest(1), // i
        e(8), e(8), rest(0.5), e(7), q(3), rest(0.5), e(0), // VI
        e(5), e(5), rest(0.5), e(8), q(12), rest(1), // iv
        q(10), e(7), e(2), h(-2), // v
        e(7), e(7), rest(0.5), e(8), q(7), rest(1), // i
        e(12), e(12), rest(0.5), e(15), q(12), rest(0.5), e(8), // VI
        q(12), e(8), e(5), q(3), rest(1), // iv
        e(2), e(3), q(2), h(-5), // v
      ],
    },
  },
];
