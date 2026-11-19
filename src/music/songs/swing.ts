// Extra campaign tunes of the chapter "swing" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import { e, h, q, rest, type ChapterTune } from '../notation';

export const TUNES: ChapterTune[] = [
  {
    // "The Bonnie Banks o' Loch Lomond" (traditional Scottish song, first printed 1841 → public domain).
    // Swing-era hit as a jazz record by Maxine Sullivan with Claude Thornhill (1937); only the
    // traditional melody is used here, the game's band supplies the swing.
    // Notes transcribed from the ABC "The Bonnie Banks of Loch Lomond", Allan's Violin Gems, ed. Nigel
    // Gatherer: https://abcnotation.com/tunePage?a=www.nigelgatherer.com/tunes/abc/tb02/0001
    // Chords simplified after the ABC of natunelist.net (G – D7 – C – Am), with a ii chord in bars 6 and 14.
    chapter: 'swing',
    melody: {
      id: 'lochLomond',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'I', ['V7', 'IV'], 'I', ['IV', 'I'],
        ['IV', 'I'], ['ii', 'IV'], ['I', 'IV'], ['V7', 'I'],
        'I', ['V7', 'IV'], 'I', ['IV', 'I'],
        ['IV', 'I'], ['ii', 'IV'], ['I', 'IV'], ['V7', 'I'],
      ],
      pickup: [q(-5)], // "By"
      notes: [
        q(0), e(0), e(2), q(4), e(2), e(0), // yon bon-nie banks and by
        q(2), e(2), e(0), q(-3), q(-5), // yon bon-nie braes, where the
        q(0), q(0), q(0), e(4), e(7), // sun shines bright on Loch
        h(9), q(7), q(7), // Lo-mond, where
        q(9), e(9), e(7), q(4), e(4), e(7),
        e(5), e(4), e(2), e(0), q(-3), e(-5), e(-3),
        q(0), e(4), e(7), q(9), e(7), e(4),
        h(2), q(12), q(-5), // … Loch Lo-mond. Oh,
        q(0), e(0), e(2), q(4), e(2), e(0), // ye'll tak' the high road
        e(2), e(4), e(2), e(0), q(-3), e(-5), e(-3),
        q(0), q(0), q(0), e(4), e(7),
        h(9), q(7), q(7),
        q(9), e(12), e(9), q(7), e(4), e(7),
        e(5), e(4), e(2), e(0), q(-3), e(-5), e(-3),
        e(0), e(0), e(4), e(7), q(9), e(7), e(4),
        h(2), q(0), rest(1), // room for the pickup
      ],
    },
    key: { tonic: 7, mode: 'major' }, // G major
    bpm: 116,
    source:
      "Traditional Scottish song \"The Bonnie Banks o' Loch Lomond\" (first printed 1841, public domain), a swing hit in 1937. Notes from the ABC in Allan's Violin Gems (ed. Nigel Gatherer) via abcnotation.com; chords simplified.",
  },
  {
    // Original minor swing tune: an arpeggio riff (root – 3rd – 5th – octave) answered by a
    // scale run, over i – iv – V7. The C# in the A7 bars is the leading tone of D minor.
    chapter: 'swing',
    melody: {
      id: 'midnightRiff',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'i', 'i', 'iv', 'iv',
        'i', 'i', 'V7', 'V7',
        'i', 'i', 'iv', 'iv',
        'VI', 'V7', 'i', 'i',
      ],
      notes: [
        q(0), e(3), e(7), q(12), q(7),
        e(5), e(3), e(2), e(3), q(0), rest(1),
        q(5), e(8), e(12), q(14), q(12),
        e(10), e(8), e(7), e(5), q(8), rest(1),
        q(0), e(3), e(7), q(12), q(7),
        e(5), e(3), e(2), e(3), q(0), rest(1),
        q(-5), e(-1), e(2), q(5), q(2), // A7
        e(7), e(5), e(2), e(-1), q(2), rest(1),
        q(0), e(3), e(7), q(12), q(7),
        e(5), e(3), e(2), e(3), q(0), rest(1),
        q(5), e(8), e(12), q(14), q(12),
        e(10), e(8), e(7), e(5), q(8), rest(1),
        e(12), e(10), e(8), e(7), q(8), q(3), // Bb
        q(7), e(5), e(2), q(-1), q(2), // A7
        q(0), e(3), e(7), q(12), q(7),
        e(3), e(2), h(0), rest(1),
      ],
    },
    key: { tonic: 2, mode: 'minor' }, // D minor
    bpm: 126,
    source:
      'Original tune written for Melody Jump: a minor swing riff in D minor (arpeggio call, scale-run answer) over i – iv – V7, with the leading tone C# over the A7 chord.',
  },
  {
    // Original big-band riff tune: a short syncopated riff repeated over I – vi – ii – V
    // turnarounds (like the A part of many swing tunes), then a bridge through the chain of
    // secondary dominants III7 – VI7 – II7 – V7 (D7 – G7 – C7 – F7 in Bb).
    chapter: 'swing',
    melody: {
      id: 'jumpTown',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        ['I', 'vi'], ['ii', 'V7'], ['I', 'vi'], ['ii', 'V7'],
        'I7', 'IV', ['I', 'vi'], ['ii', 'V7'],
        'III7', 'VI7', 'II7', 'V7',
        ['I', 'vi'], ['ii', 'V7'], 'I', 'I',
      ],
      notes: [
        e(7), q(4), e(7), h(9), // riff
        rest(1), e(2), e(5), q(7), q(5), // answer
        e(7), q(4), e(7), h(9),
        q(14), e(12), e(9), q(11), q(7),
        q(12), e(10), e(7), h(4),
        rest(1), e(5), e(9), q(12), q(9),
        e(7), q(4), e(7), h(9),
        q(2), q(5), q(7), rest(1),
        q(4), e(8), e(11), q(14), q(11), // D7
        q(14), e(13), e(9), q(7), q(9), // G7
        q(12), e(9), e(6), q(2), q(6), // C7
        q(5), e(7), e(11), h(14), // F7
        e(7), q(4), e(7), h(9),
        q(14), e(12), e(9), q(11), q(5),
        q(4), q(7), h(12),
        q(0), rest(3),
      ],
    },
    key: { tonic: 10, mode: 'major' }, // Bb major
    bpm: 138,
    source:
      'Original tune written for Melody Jump: a syncopated big-band riff over I – vi – ii – V turnarounds, with a bridge through the secondary dominants D7 – G7 – C7 – F7.',
  },
];
