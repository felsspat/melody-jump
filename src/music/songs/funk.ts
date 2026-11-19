// Extra campaign tunes of the chapter "funk" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import { e, h, q, rest, s, type ChapterTune } from '../notation';

export const TUNES: ChapterTune[] = [
  {
    chapter: 'funk',
    key: { tonic: 5, mode: 'major' }, // F major
    bpm: 112,
    source:
      'Original tune written for Melody Jump: a disco strut over I – IV with a ii – V turnaround; every bar starts on the One, the answers sit on the off-beats.',
    melody: {
      id: 'mirrorBallStrut',
      beatsPerBar: 4,
      bars: 8,
      chords: ['I', 'IV', 'I', 'IV', 'ii', 'V7', 'I', 'V7'],
      notes: [
        q(12), rest(0.5), e(7), e(9), e(7), q(4), // I
        q(9), rest(0.5), e(12), e(9), e(12), q(5), // IV
        q(7), e(4), e(7), rest(0.5), e(12), e(11), e(12), // I
        h(9), rest(1), e(5), e(7), // IV
        q(9), rest(0.5), e(5), e(9), e(12), q(14), // ii
        q(11), e(7), e(11), e(14), e(11), q(7), // V7
        [12, 1.5], e(7), e(9), e(12), q(16), // I
        e(14), e(12), q(11), rest(1), e(5), e(7), // V7
      ],
    },
  },
  {
    chapter: 'funk',
    key: { tonic: 4, mode: 'minor' }, // E minor (dorian vamp: i – IV7)
    bpm: 100,
    source:
      'Original tune written for Melody Jump: a dark minor funk vamp (i – IV7, the "dorian" sound) with 16th notes into the One and a riff that answers itself.',
    melody: {
      id: 'basementGrease',
      beatsPerBar: 4,
      bars: 8,
      chords: ['i', 'i', 'IV7', 'IV7', 'i', 'i', 'VII', 'IV7'],
      notes: [
        s(0), s(0), e(3), rest(0.5), e(5), e(7), rest(0.5), s(10), s(7), e(5), // i
        e(7), rest(0.5), e(10), e(7), s(5), s(3), e(0), rest(1), // i
        s(9), s(9), e(12), rest(0.5), e(10), e(9), e(5), q(3), // IV7
        rest(1), e(12), e(10), e(9), e(7), q(5), // IV7
        s(0), s(0), e(3), rest(0.5), e(5), e(7), rest(0.5), s(10), s(7), e(5), // i
        e(12), rest(0.5), e(10), e(7), s(10), s(12), e(15), rest(1), // i
        q(14), e(10), e(14), rest(0.5), e(10), q(5), // VII
        s(9), s(9), e(5), rest(0.5), e(3), q(0), rest(1), // IV7
      ],
    },
  },
  {
    chapter: 'funk',
    key: { tonic: 2, mode: 'major' }, // D major
    bpm: 104,
    source:
      'Original tune written for Melody Jump: a horn-section riff in call and response, a short stab on the One, then a bluesy answer with the flat third sliding up to the third.',
    melody: {
      id: 'brassPunch',
      beatsPerBar: 4,
      bars: 8,
      chords: ['I7', 'I7', 'IV7', 'I7', 'V7', 'IV7', 'I7', 'I7'],
      notes: [
        e(12), e(12), rest(0.5), s(10), s(12), rest(1), e(7), e(10), // I7 call
        s(15), s(16), e(12), e(10), e(7), rest(0.5), e(3), q(4), // I7 answer
        e(12), e(12), rest(0.5), s(10), s(12), rest(1), e(9), e(10), // IV7 call
        s(15), s(16), e(12), e(10), e(7), rest(0.5), e(4), q(0), // I7 answer
        e(14), e(14), rest(0.5), s(11), s(14), rest(1), e(11), e(7), // V7 call
        e(12), e(9), rest(0.5), s(5), s(9), rest(1), e(12), e(10), // IV7 call
        q(12), e(10), e(7), s(3), s(4), e(0), rest(1), // I7
        e(7), e(10), q(12), rest(2), // I7
      ],
    },
  },
];
