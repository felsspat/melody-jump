// Extra campaign tunes of the chapter "ska" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import type { ChapterTune } from '../notation';
import { e, q, rest, s } from '../notation';

const JEKYLL =
  'Walter Jekyll, "Jamaican Song and Story" (London 1907; Jekyll died 1929), ' +
  'Project Gutenberg eBook #35410 with MusicXML of every tune: https://www.gutenberg.org/ebooks/35410';

export const TUNES: ChapterTune[] = [
  // "Mahngoose a come" – Jamaican dancing tune no. 196 in Jekyll 1907 (file music196.xml of the
  // Gutenberg edition), C major, 2/4. Two 2/4 bars become one 4/4 bar; notes unchanged
  // (written here in F major). Chords added for the band (Jekyll prints the tune only).
  {
    chapter: 'ska',
    key: { tonic: 5, mode: 'major' },
    bpm: 126,
    source:
      `Traditional Jamaican dancing tune "Mahngoose a come" (no. 196), transcribed from ${JEKYLL}. ` +
      'Traditional and printed 1907 → public domain. Two 2/4 bars merged into one 4/4 bar, transposed from C to F, chords added.',
    melody: {
      id: 'mahngoose',
      beatsPerBar: 4,
      bars: 8,
      chords: [['I', 'vi'], ['V7', 'I'], 'I', ['V7', 'I'], ['I', 'vi'], ['V7', 'I'], 'I', ['V7', 'I']],
      notes: [
        q(7), e(12), e(11), q(9), e(4), e(7), // Mahngoose a come, Dory,
        q(2), e(7), e(5), q(4), rest(1), // Mahngoose a come.
        e(4), e(4), e(4), e(4), e(4), e(2), e(4), e(7), // All them gal are dead fe Dory,
        q(2), e(7), e(5), q(4), rest(1), // Mahngoose a come.
        q(7), e(12), e(11), q(9), e(4), e(7), // Come back me dear, Dory,
        q(2), e(7), e(5), q(4), rest(1), // Come back me dear.
        e(4), e(4), e(4), e(4), e(4), e(2), e(4), e(7), // All them gal are dead fe Dory,
        q(2), e(4), e(2), q(0), rest(1), // Mahngoose a come.
      ],
    },
  },

  // "Don't cry too much, Jamaica gal" – dancing tune no. 139 in Jekyll 1907 (music139.xml),
  // F major, 2/4 with an eighth-note pickup. Two 2/4 bars become one 4/4 bar; notes unchanged
  // (written here in Bb major). Chords added for the band; I7 in bar 5 leads to IV
  // (a secondary dominant).
  {
    chapter: 'ska',
    key: { tonic: 10, mode: 'major' },
    bpm: 112,
    source:
      `Traditional Jamaican dancing tune "Don't cry too much, Jamaica gal" (no. 139), transcribed from ${JEKYLL}. ` +
      'Traditional and printed 1907 → public domain. Two 2/4 bars merged into one 4/4 bar, transposed from F to Bb, chords added.',
    melody: {
      id: 'jamaicaGal',
      beatsPerBar: 4,
      bars: 8,
      chords: ['I', ['V7', 'I'], 'I', ['V7', 'I'], 'I7', ['IV', 'I'], 'I', ['V7', 'I']],
      pickup: [e(-5)],
      notes: [
        e(0), e(-1), e(0), e(2), e(4), e(5), e(7), e(0),
        e(4), e(2), e(0), e(-1), e(-3), e(-5), e(-8), e(-5),
        e(0), e(-1), e(0), e(2), e(4), e(5), e(7), s(0), s(2),
        e(4), e(2), e(0), s(-1), s(-1), q(0), rest(0.5), e(7),
        e(7), e(7), e(7), e(7), e(7), e(7), e(7), e(7),
        e(9), e(9), s(7), s(5), s(4), s(2), e(0), e(0), e(-1), e(-5),
        e(0), e(-1), e(0), e(2), e(4), e(5), e(7), s(0), s(2),
        e(4), e(2), e(0), s(-1), s(-1), q(0), rest(1),
      ],
    },
  },

  // "Mango Walk" – traditional Jamaican folk song. ABC from folkinfo.org (BBC "Singing Together",
  // Spring 1970), via https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/folkinfo.org/Mango_Walk/0000 ;
  // cross-checked with the Digital Tradition ABC (MANGOWLK), which differs only in bar 9 (D D E F).
  // Melody unchanged (G major there, written here in D major); chords added. The syncopated
  // "G B2 D G2 B2" bars put notes on the off-beat – perfect for ska.
  {
    chapter: 'ska',
    key: { tonic: 2, mode: 'major' },
    bpm: 120,
    source:
      'Traditional Jamaican folk song "Mango Walk" (author unknown → public domain). Melody from the folkinfo.org ABC ' +
      '(BBC "Singing Together", 1970) on https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/folkinfo.org/Mango_Walk/0000, ' +
      'checked against the Digital Tradition ABC. Only the melody is used, transposed from G to D; chords added.',
    melody: {
      id: 'mangoWalk',
      beatsPerBar: 4,
      bars: 16,
      chords: ['I', 'I', 'V7', 'I', 'I', 'I', 'V7', 'I', 'IV', 'I', 'V7', 'I', 'V7', 'I', 'V7', 'I'],
      pickup: [q(7)], // My
      notes: [
        e(7), e(9), e(7), e(5), e(4), e(5), e(4), e(2), // brother did-a tell me that you
        e(0), q(4), e(-5), q(0), q(4), // go mango walk, you
        e(2), q(5), e(-5), q(-1), q(2), // go mango walk, you
        e(0), q(4), e(-5), q(0), q(7), // go mango walk. My
        e(7), e(9), e(7), e(5), e(4), e(5), e(4), e(2),
        e(0), q(4), e(-5), q(0), q(4),
        e(2), q(5), e(-5), q(-1), q(2),
        q(0), q(0), rest(1), q(-5), // 'leven. Now
        q(-5), q(-5), q(-3), q(0), // tell me, Joe, do
        e(0), q(4), e(-5), q(0), q(4),
        e(2), q(5), e(-5), q(-1), q(2),
        q(0), [4, 2], q(-5),
        q(-5), q(-5), q(-3), q(-1),
        e(0), q(4), e(-5), q(0), q(4),
        e(2), q(5), e(-5), q(-1), q(2),
        q(0), q(0), rest(2),
      ],
    },
  },
];
