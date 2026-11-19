// Extra campaign tunes of the chapter "reggae" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import type { ChapterTune } from '../notation';
import { dh, dq, e, h, q, rest } from '../notation';

const JEKYLL =
  'Walter Jekyll, "Jamaican Song and Story" (London 1907; Jekyll died 1929), ' +
  'Project Gutenberg eBook #35410 with MusicXML of every tune: https://www.gutenberg.org/ebooks/35410';

export const TUNES: ChapterTune[] = [
  // "War down a Monkland" – Jamaican digging song no. 88 in Jekyll 1907 (music088.xml of the
  // Gutenberg edition), 4/4, written with three flats but centred on C: C minor (natural minor).
  // Notes and rhythm unchanged; chords added for the band (Jekyll prints the tune only).
  {
    chapter: 'reggae',
    key: { tonic: 0, mode: 'minor' },
    bpm: 72,
    source:
      `Traditional Jamaican digging song "War down a Monkland" (no. 88), transcribed from ${JEKYLL}. ` +
      'Traditional and printed 1907 → public domain. Notes unchanged (C minor), chords added.',
    melody: {
      id: 'monkland',
      beatsPerBar: 4,
      bars: 16,
      chords: ['i', 'III', 'VII', 'i', 'iv', 'v', 'VII', 'i', 'i', 'III', 'VII', 'i', 'iv', 'v', 'VII', 'i'],
      notes: [
        q(0), e(0), e(3), q(7), q(7), // War down a Monkland,
        q(10), e(10), e(10), e(7), e(10), q(10), // war down a Morant Bay,
        q(14), e(14), e(14), e(10), e(14), e(14), e(14), // war down a Chigger foot, the
        q(15), e(14), e(14), q(12), rest(1), // Queen never know.
        h(12), h(12), // War, war,
        h(10), q(7), rest(1), // war oh!
        h(5), h(2), // War oh!
        e(0), e(0), q(0), h(0), // heavy war oh!
        e(0), q(0), e(3), e(7), e(10), q(10), // Soldiers from Newcastle
        e(7), q(10), e(7), e(10), e(10), rest(0.5), e(10), // come down a Monkland with
        dq(14), e(10), dq(14), e(14), // gun an' sword fe
        q(15), e(14), e(14), q(12), rest(1), // kill sinner oh!
        h(12), h(12),
        h(10), q(7), rest(1),
        h(5), h(2),
        e(0), e(0), q(0), h(0),
      ],
    },
  },

  // "A Somerset me barn" – Jamaican digging song no. 85 in Jekyll 1907 (music085.xml), 2/4 with
  // an eighth-note pickup, written with four flats; every phrase ends on F: F minor (natural minor).
  // Two 2/4 bars become one 4/4 bar (half-time, like a slow reggae groove); notes unchanged; chords added.
  {
    chapter: 'reggae',
    key: { tonic: 5, mode: 'minor' },
    bpm: 76,
    source:
      `Traditional Jamaican digging song "A Somerset me barn" (no. 85), transcribed from ${JEKYLL}. ` +
      'Traditional and printed 1907 → public domain. Two 2/4 bars merged into one 4/4 bar, notes unchanged (F minor), chords added.',
    melody: {
      id: 'somersetBarn',
      beatsPerBar: 4,
      bars: 14,
      chords: [
        ['i', 'iv'], 'i', ['i', 'v'], 'i', ['i', 'VII'], 'i', ['i', 'iv'],
        'i', ['i', 'VII'], 'i', ['i', 'iv'], 'i', ['VII', 'iv'], 'i',
      ],
      pickup: [e(3)], // A
      notes: [
        e(7), e(7), e(8), e(7), q(5), rest(1), // Somerset me barn,
        q(0), q(0), q(0), rest(1), // bring dem come,
        e(7), e(7), e(5), e(3), e(2), e(2), q(-5), // bring dem make me batter dem,
        q(0), q(0), q(0), e(3), e(3), // bring dem come, me would
        e(7), e(7), e(3), e(5), e(-2), e(-2), q(-2), // take me picker batter dem,
        q(0), q(0), q(0), rest(0.5), e(7), // bring dem come. A
        e(7), e(7), e(10), e(8), q(5), rest(1), // Woburn Lawn me barn,
        q(0), q(0), q(0), e(0), e(0), // bring dem come, I will
        e(3), e(3), e(2), e(0), e(-2), e(-2), q(-2), // like to see dem batter me,
        q(0), q(0), q(0), rest(0.5), e(3), // bring dem come, A
        q(7), e(8), e(7), q(5), rest(1), // Goatridge me barn,
        q(0), q(0), q(0), rest(0.5), e(7), // bring dem come, I
        e(10), e(10), e(8), e(7), e(5), e(5), q(5), // want to see dem jostle me,
        q(0), q(0), q(0), rest(1), // bring dem come.
      ],
    },
  },

  // Original reggae tune for this game, in a bright major key: every phrase starts after a rest
  // (space for the skank), and the long notes land on beat 3 – the "one drop".
  {
    chapter: 'reggae',
    key: { tonic: 2, mode: 'major' },
    bpm: 70,
    source: 'Original tune written for Melody Jump (2026), no copyright issues.',
    melody: {
      id: 'hillsideMorning',
      beatsPerBar: 4,
      bars: 8,
      chords: ['I', 'IV', 'I', 'V7', 'IV', 'I', ['ii', 'V7'], 'I'],
      notes: [
        rest(1), e(4), e(7), h(12), // I
        rest(0.5), e(12), e(11), e(9), h(5), // IV
        rest(1), e(7), e(9), dq(7), e(4), // I
        rest(0.5), e(11), e(9), e(7), h(2), // V7
        rest(1), e(5), e(9), h(12), // IV
        rest(0.5), e(12), e(11), e(9), h(7), // I
        rest(0.5), e(9), e(5), e(2), q(7), e(11), e(14), // ii – V7
        dh(12), rest(1), // I
      ],
    },
  },
];
