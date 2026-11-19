// Extra campaign tunes of the chapter "rocknroll" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import { dh, e, h, q, rest, type ChapterTune } from '../notation';

const TWELVE_BAR = ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'];

export const TUNES: ChapterTune[] = [
  {
    // Original 12-bar riff tune: a short lick (blue 3rd sliding into the major 3rd, then down the
    // chord) moved through I7 – IV7 – V7, answered by phrases that start on the backbeat.
    // Over D7 the F is a passing tone into F#.
    chapter: 'rocknroll',
    melody: {
      id: 'sockHop',
      beatsPerBar: 4,
      bars: 12,
      chords: TWELVE_BAR,
      notes: [
        e(3), e(4), q(7), q(4), q(0),
        rest(1), q(10), e(9), e(7), q(4),
        e(3), e(4), q(7), q(4), q(0),
        rest(1), q(10), h(12),
        e(8), e(9), q(12), q(9), q(5), // D7
        rest(1), q(3), e(2), e(0), q(-3),
        e(3), e(4), q(7), q(4), q(0),
        rest(1), e(7), e(4), h(0),
        e(10), e(11), q(14), q(11), q(7), // E7
        e(8), e(9), q(12), q(9), q(5), // D7
        e(3), e(4), q(7), q(4), q(0),
        q(-1), q(2), q(7), rest(1),
      ],
    },
    key: { tonic: 9, mode: 'major' }, // A major
    bpm: 140,
    source:
      'Original tune written for Melody Jump: a 12-bar blues riff tune (blue third sliding into the major third, answers on the backbeat), moved through I7 – IV7 – V7.',
  },
  {
    // Original doo-wop style tune over the "50s progression" I – vi – IV – V7: long, singable
    // notes in the first half, then short "doo-wop" calls starting after beat 1.
    chapter: 'rocknroll',
    melody: {
      id: 'doowopMoon',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', 'vi', 'IV', 'V7',
        'I', 'vi', 'IV', 'V7',
        'I', 'vi', 'IV', 'V7',
        'I', 'vi', ['IV', 'V7'], 'I',
      ],
      notes: [
        q(4), q(7), h(12),
        h(9), q(7), q(4),
        q(5), q(9), h(12),
        h(14), q(11), q(7),
        q(4), q(7), q(12), e(14), e(12),
        h(9), q(7), q(9),
        q(12), q(9), q(5), q(9),
        dh(7), rest(1),
        rest(1), e(7), e(7), q(12), q(7),
        rest(1), e(9), e(9), q(12), q(9),
        rest(1), e(5), e(9), q(12), q(9),
        h(14), h(11),
        h(12), q(7), q(4),
        h(9), q(4), q(0),
        q(5), q(9), q(7), q(11),
        h(12), rest(2),
      ],
    },
    key: { tonic: 3, mode: 'major' }, // Eb major
    bpm: 116,
    source:
      'Original tune written for Melody Jump: an up-tempo doo-wop style melody over the "50s progression" I – vi – IV – V7, long sung notes answered by short "doo-wop" calls.',
  },
  {
    // Original fast boogie with a stop-time feel: in most bars the melody hits beat 1, keeps
    // quiet on beat 2 and answers with an eighth-note fill (like a band that stops and lets the
    // singer or guitar fill the gap); bars 7–8 run in boogie eighths.
    // The blue notes G (b3) and D (b7) belong to the rock style; C over A7 is a passing tone into C#.
    chapter: 'rocknroll',
    melody: {
      id: 'stopTimeBoogie',
      beatsPerBar: 4,
      bars: 12,
      chords: TWELVE_BAR,
      notes: [
        q(12), rest(1), e(10), e(7), e(3), e(4),
        q(7), rest(1), e(0), e(3), e(4), e(7),
        q(12), rest(1), e(10), e(7), e(3), e(4),
        q(0), rest(1), e(4), e(7), e(10), e(12),
        q(9), rest(1), e(8), e(9), e(12), e(9), // A7
        q(5), rest(1), e(3), e(5), e(9), e(12),
        e(0), e(4), e(7), e(9), e(10), e(9), e(7), e(4),
        e(12), e(10), e(9), e(7), h(4),
        q(11), rest(1), e(14), e(11), e(7), e(5), // B7
        q(9), rest(1), e(12), e(9), e(5), e(3), // A7
        e(3), e(4), e(7), e(9), q(12), q(7),
        q(7), q(11), q(14), rest(1),
      ],
    },
    key: { tonic: 4, mode: 'major' }, // E major
    bpm: 150,
    source:
      'Original tune written for Melody Jump: a fast 12-bar boogie with a stop-time feel (a hit on beat 1, silence, then an eighth-note fill) and two bars of running boogie eighths.',
  },
];
