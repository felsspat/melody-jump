// Campaign data: chapters in historical order, each with a few levels.
// All chapters that are available can be played in any order – nobody has to
// finish chapter 1 to try the blues. Names, history texts and Wikipedia links
// live in texts.json under campaign.chapters.<id>.

import { SectionDef } from '../music/Song';
import { StyleId } from '../music/styles';
import { Key } from '../music/theory';
import { CHAPTER_TUNES } from '../music/songs';
import { TWELVE_BAR_BLUES, melodySection } from '../world/Level';

export { TWELVE_BAR_BLUES };

export interface LevelDef {
  id: string;
  sections: SectionDef[];
}

export interface ChapterDef {
  id: string;
  /** False = shown on the map as "coming soon" */
  available: boolean;
  levels: LevelDef[];
}

const C_MAJOR: Key = { tonic: 0, mode: 'major' };
const G_MAJOR: Key = { tonic: 7, mode: 'major' };
const F_MAJOR: Key = { tonic: 5, mode: 'major' };

const A_MAJOR: Key = { tonic: 9, mode: 'major' };
const E_MAJOR: Key = { tonic: 4, mode: 'major' };
const A_MINOR: Key = { tonic: 9, mode: 'minor' };
const E_MINOR: Key = { tonic: 4, mode: 'minor' };

/** A section in blues style (dominant seventh chords, blue notes, shuffle). */
function blues(section: SectionDef): SectionDef {
  return { ...section, style: 'blues', sevenths: true };
}

/**
 * The standard level set of a style chapter:
 * 1 = the tune slowly with guide rings, 2 = the tune faster, then optionally a second
 * well-known tune, and last a jam session to improvise (id "<style>-3").
 */
function styleLevels(
  style: StyleId,
  melody: string,
  [slowBpm, fastBpm]: [number, number],
  jam: SectionDef,
  key: Key = C_MAJOR,
  second?: { melody: string; bpm: number; key?: Key },
): LevelDef[] {
  const tune = (bpm: number, difficulty: number, id = melody, k = key): SectionDef => {
    const s = melodySection(id, k, bpm, 1, difficulty);
    // Short tunes are repeated so every level lasts a while
    const passes = Math.max(1, Math.round(16 / s.bars));
    return { ...s, bars: s.bars * passes, style };
  };
  return [
    { id: `${style}-1`, sections: [tune(slowBpm, 0)] },
    { id: `${style}-2`, sections: [tune(fastBpm, 1)] },
    // The id keeps the jam as "-3" (saved stars stay valid); the second tune is "-tune2"
    ...(second
      ? [
          {
            id: `${style}-tune2`,
            sections: [tune(second.bpm, 1, second.melody, second.key ?? key)],
          },
        ]
      : []),
    { id: `${style}-3`, sections: [{ ...jam, style }] },
  ];
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'folk',
    available: true,
    levels: [
      { id: 'folk-1', sections: [melodySection('twinkle', C_MAJOR, 72, 1, 0)] },
      { id: 'folk-2', sections: [melodySection('ode', G_MAJOR, 76, 2, 1)] },
      {
        id: 'folk-3',
        sections: [
          melodySection('jakob', F_MAJOR, 80, 2, 1),
          {
            name: 'waltz',
            key: F_MAJOR,
            bpm: 84,
            beatsPerBar: 3,
            progression: [1, 4, 5, 1],
            bars: 8,
            difficulty: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'ragtime',
    available: true,
    levels: styleLevels(
      'ragtime',
      'entertainer',
      [64, 80],
      {
        name: 'ragJam',
        key: C_MAJOR,
        bpm: 76,
        beatsPerBar: 4,
        // The "ragtime progression": a chain of secondary dominants back home
        progression: ['I', 'VI7', 'II7', 'V7'],
        bars: 16,
        difficulty: 2,
      },
      C_MAJOR,
      { melody: 'mapleLeaf', bpm: 72 },
    ),
  },
  {
    id: 'blues',
    available: true,
    levels: [
      // Slow, with the guide rings showing a blues tune
      {
        id: 'blues-1',
        sections: [blues(melodySection('bluesTune', C_MAJOR, 66, 2, 0))],
      },
      // Same tune, faster
      {
        id: 'blues-2',
        sections: [blues(melodySection('bluesTune', C_MAJOR, 80, 2, 1))],
      },
      // A traditional tune: "Careless Love"
      {
        id: 'blues-tune2',
        sections: [blues(melodySection('careless', C_MAJOR, 72, 1, 1))],
      },
      // Jam session: no melody, improvise with chord tones and blue notes
      {
        id: 'blues-3',
        sections: [
          blues({
            name: 'bluesJam',
            key: G_MAJOR,
            bpm: 80,
            beatsPerBar: 4,
            progression: TWELVE_BAR_BLUES,
            bars: 24,
            difficulty: 2,
          }),
        ],
      },
    ],
  },
  {
    id: 'dixieland',
    available: true,
    levels: styleLevels(
      'dixieland',
      'saints',
      [84, 104],
      {
        name: 'dixieJam',
        key: F_MAJOR,
        bpm: 100,
        beatsPerBar: 4,
        // A typical New Orleans chord pattern: home, the I7 pulls to IV, then back via V7
        progression: ['I', 'I', 'I7', 'IV', 'I', 'V7', 'I', 'I'],
        bars: 16,
        difficulty: 2,
      },
      F_MAJOR,
      { melody: 'ramble', bpm: 96 },
    ),
  },
  {
    id: 'swing',
    available: true,
    levels: styleLevels(
      'swing',
      'swingRiff',
      [96, 116],
      {
        name: 'swingJam',
        key: F_MAJOR,
        bpm: 112,
        beatsPerBar: 4,
        // ii – V7 – I – VI7: the jazz turnaround
        progression: ['ii', 'V7', 'I', 'VI7'],
        bars: 16,
        difficulty: 2,
      },
      C_MAJOR,
      { melody: 'riverside', bpm: 108, key: F_MAJOR },
    ),
  },
  {
    id: 'rocknroll',
    available: true,
    levels: styleLevels('rock', 'boogieRiff', [110, 132], {
      name: 'rockJam',
      key: A_MAJOR,
      bpm: 132,
      beatsPerBar: 4,
      progression: TWELVE_BAR_BLUES,
      bars: 24,
      difficulty: 2,
      sevenths: true,
    }),
  },
  {
    id: 'ska',
    available: true,
    levels: styleLevels(
      'ska',
      'susanna',
      [104, 124],
      {
        name: 'skaJam',
        key: G_MAJOR,
        bpm: 124,
        beatsPerBar: 4,
        progression: ['I', 'IV', 'V7', 'IV'],
        bars: 16,
        difficulty: 2,
      },
      C_MAJOR,
      { melody: 'linstead', bpm: 112, key: G_MAJOR },
    ),
  },
  {
    id: 'reggae',
    available: true,
    levels: styleLevels(
      'reggae',
      'islandTune',
      [68, 78],
      {
        name: 'reggaeJam',
        key: A_MINOR,
        bpm: 76,
        beatsPerBar: 4,
        progression: ['i', 'iv', 'i', 'VII'],
        bars: 16,
        difficulty: 2,
      },
      E_MINOR,
    ),
  },
  {
    id: 'funk',
    available: true,
    levels: styleLevels('funk', 'funkRiff', [88, 100], {
      name: 'funkJam',
      key: E_MAJOR,
      bpm: 100,
      beatsPerBar: 4,
      // One-chord vamp: funk is about the groove, not the chord changes
      progression: ['I7', 'I7', 'I7', 'IV7'],
      bars: 16,
      difficulty: 2,
    }),
  },
  {
    id: 'hiphop',
    available: true,
    levels: styleLevels(
      'hiphop',
      'hiphopHook',
      [80, 92],
      {
        name: 'hiphopJam',
        key: A_MINOR,
        bpm: 90,
        beatsPerBar: 4,
        progression: ['i', 'iv', 'i', 'VI'],
        bars: 16,
        difficulty: 2,
      },
      A_MINOR,
    ),
  },
  {
    id: 'electronic',
    available: true,
    levels: styleLevels(
      'electronic',
      'clubHook',
      [116, 124],
      {
        name: 'houseJam',
        key: A_MINOR,
        bpm: 124,
        beatsPerBar: 4,
        progression: ['i', 'VI', 'III', 'VII'],
        bars: 16,
        difficulty: 2,
      },
      G_MAJOR,
    ),
  },
];

/**
 * Adds the extra tunes of songs/*.ts to their chapters: one level per tune, in the chapter's
 * style, after the other tunes and before the jam session (if the chapter ends with one).
 * Level id = "<chapter>-<melody id>", so saved stars stay valid when tunes are added.
 */
function addChapterTunes(chapters: ChapterDef[]): void {
  for (const tune of CHAPTER_TUNES) {
    const chapter = chapters.find((c) => c.id === tune.chapter);
    if (!chapter) throw new Error(`tune "${tune.melody.id}": unknown chapter "${tune.chapter}"`);
    const style = chapter.levels[0].sections[0].style;
    const s = melodySection(tune.melody.id, tune.key, tune.bpm, 1, 1);
    // Short tunes are repeated so every level lasts a while
    const passes = Math.max(1, Math.ceil(16 / s.bars)); // at least 16 bars (a 12-bar blues is played twice)
    const level: LevelDef = { id: `${chapter.id}-${tune.melody.id}`, sections: [{ ...s, bars: s.bars * passes, style }] };
    const last = chapter.levels[chapter.levels.length - 1];
    const endsWithJam = !last.sections[0].melody;
    chapter.levels.splice(endsWithJam ? chapter.levels.length - 1 : chapter.levels.length, 0, level);
  }
}

addChapterTunes(CHAPTERS);

export function findLevel(levelId: string): { chapter: ChapterDef; index: number } | undefined {
  for (const chapter of CHAPTERS) {
    const index = chapter.levels.findIndex((l) => l.id === levelId);
    if (index >= 0) return { chapter, index };
  }
  return undefined;
}
