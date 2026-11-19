// Level sections (music) and procedural obstacles/collectibles.

import { MELODIES } from '../music/melodies';
import { Section, SectionDef } from '../music/Song';
import { StyleId } from '../music/styles';
import { ChordSpec, Key } from '../music/theory';
import { MONSTER_GRID, Obstacle, PX_PER_BEAT, jumpShape, minResonanceFor, takeoffBeat } from './physics';

/** A section that accompanies a well-known melody (chords and length come from the melody). */
export function melodySection(id: string, key: Key, bpm: number, passes: number, difficulty: number): SectionDef {
  const mel = MELODIES[id];
  return {
    name: id,
    key,
    bpm,
    beatsPerBar: mel.beatsPerBar,
    progression: mel.chords,
    bars: mel.bars * passes,
    difficulty,
    melody: id,
  };
}

/**
 * Hand-made opening sections. `name` is a key into sections.* in texts.json.
 * The game starts with famous public-domain tunes so beginners hear right away
 * whether they're playing the "right" notes.
 */
export const INTRO_SECTIONS: SectionDef[] = [
  melodySection('twinkle', { tonic: 0, mode: 'major' }, 72, 1, 0),
  melodySection('ode', { tonic: 7, mode: 'major' }, 76, 2, 1),
  melodySection('jakob', { tonic: 5, mode: 'major' }, 80, 2, 1),
  { name: 'waltz', key: { tonic: 5, mode: 'major' }, bpm: 84, beatsPerBar: 3, progression: [1, 4, 5, 1], bars: 8, difficulty: 2 },
  { name: 'dusk', key: { tonic: 9, mode: 'minor' }, bpm: 90, beatsPerBar: 4, progression: [1, 6, 3, 7], bars: 8, difficulty: 3 },
];

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

/** Deterministic random numbers (mulberry32) so runs are reproducible. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAJOR_PROGS = [[1, 5, 6, 4], [1, 4, 5, 1], [1, 6, 4, 5], [2, 5, 1, 1], [1, 4, 6, 5], [1, 3, 4, 5]];
const MINOR_PROGS = [[1, 6, 3, 7], [1, 4, 5, 1], [1, 7, 6, 7], [1, 4, 7, 3], [1, 6, 7, 1]];
const NAMES = ['storm', 'crystalCave', 'starPath', 'fogMoor', 'bellTower', 'cloudSea', 'echoValley', 'sparkForest'];

/** 12-bar blues form: I I I I / IV IV I I / V IV I V */
export const TWELVE_BAR_BLUES = [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5];
/** "Quick change" variant: IV already in bar 2 */
const QUICK_CHANGE_BLUES = [1, 4, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5];

/** What the endless mode plays: one style, or "mixed" (classic intro, then every style). */
export type EndlessStyle = StyleId | 'mixed';
export const ENDLESS_STYLES: EndlessStyle[] = ['mixed', 'classic', 'ragtime', 'blues', 'dixieland', 'swing', 'rock', 'ska', 'reggae', 'funk', 'hiphop', 'electronic'];

export function isEndlessStyle(v: string): v is EndlessStyle {
  return (ENDLESS_STYLES as string[]).includes(v);
}

/** How the endless generator builds sections for one style (keys, chord progressions, tempo). */
interface StyleRecipe {
  /** Tonic pitch classes of the keys this style likes (e.g. guitar keys for rock) */
  majorTonics: number[];
  minorTonics?: number[];
  /** Chance of a minor key (0 = never) */
  minorChance: number;
  majorProgs: ChordSpec[][];
  minorProgs?: ChordSpec[][];
  /** Tempo range: starts slow, gets faster the longer you play */
  bpm: [number, number];
  /** Bars per section (a multiple of the progression lengths) */
  bars: number;
  sevenths?: boolean;
  /** Keys into sections.* in texts.json */
  names: string[];
}

const RECIPES: Record<Exclude<StyleId, 'classic'>, StyleRecipe> = {
  ragtime: {
    majorTonics: [0, 5, 7, 10],
    minorChance: 0,
    majorProgs: [
      // Chains of secondary dominants leading back home
      ['I', 'VI7', 'II7', 'V7'],
      ['I', 'IV', 'I', 'V7'],
      ['I', 'III7', 'VI7', 'VI7', 'II7', 'II7', 'V7', 'V7'],
    ],
    bpm: [64, 84],
    bars: 16,
    names: ['ragJam', 'honkyTonk', 'riverboat'],
  },
  blues: {
    majorTonics: [0, 7, 2, 9, 4, 5],
    minorChance: 0,
    majorProgs: [TWELVE_BAR_BLUES, QUICK_CHANGE_BLUES],
    bpm: [66, 90],
    bars: 24,
    sevenths: true,
    names: ['bluesJam', 'crossroads', 'deltaPorch'],
  },
  dixieland: {
    // Brass-band keys: F, B♭, E♭, C
    majorTonics: [5, 10, 3, 0],
    minorChance: 0,
    majorProgs: [
      ['I', 'I', 'I7', 'IV', 'I', 'V7', 'I', 'I'],
      ['I', 'VI7', 'II7', 'V7'],
      ['I', 'IV', 'I', 'V7'],
    ],
    bpm: [84, 116],
    bars: 16,
    names: ['dixieJam', 'frenchQuarter', 'paradeStreet'],
  },
  swing: {
    majorTonics: [5, 10, 3, 0, 7],
    minorChance: 0,
    majorProgs: [
      ['ii', 'V7', 'I', 'VI7'],
      ['I', 'VI7', 'ii', 'V7'],
      ['ii', 'V7', 'I', 'I'],
      ['iii', 'VI7', 'ii', 'V7'],
    ],
    bpm: [100, 132],
    bars: 16,
    names: ['swingJam', 'ballroom', 'nightTrain'],
  },
  rock: {
    majorTonics: [9, 4, 7, 2, 0],
    minorChance: 0,
    majorProgs: [TWELVE_BAR_BLUES, QUICK_CHANGE_BLUES, [1, 1, 4, 4, 1, 1, 5, 4]],
    bpm: [116, 148],
    bars: 24,
    sevenths: true,
    names: ['rockJam', 'jukebox', 'diner'],
  },
  ska: {
    majorTonics: [7, 2, 9, 0, 5],
    minorChance: 0,
    majorProgs: [
      ['I', 'IV', 'V7', 'IV'],
      ['I', 'vi', 'IV', 'V7'],
      ['I', 'I', 'IV', 'V7'],
    ],
    bpm: [104, 132],
    bars: 16,
    names: ['skaJam', 'soundSystem', 'harbour'],
  },
  reggae: {
    majorTonics: [7, 2, 0],
    minorTonics: [9, 4, 2, 11],
    minorChance: 0.7,
    majorProgs: [
      ['I', 'IV', 'I', 'V'],
      ['I', 'IV', 'V', 'IV'],
    ],
    minorProgs: [
      ['i', 'iv', 'i', 'VII'],
      ['i', 'VII', 'VI', 'VII'],
      ['i', 'iv', 'VII', 'III'],
    ],
    bpm: [66, 84],
    bars: 16,
    names: ['reggaeJam', 'beachRiddim', 'blueMountains'],
  },
  funk: {
    majorTonics: [4, 9, 2, 7],
    minorChance: 0,
    majorProgs: [
      // Vamps: funk is about the groove, not the chord changes
      ['I7', 'I7', 'I7', 'IV7'],
      ['I7', 'IV7', 'I7', 'IV7'],
      ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'],
    ],
    bpm: [92, 112],
    bars: 16,
    names: ['funkJam', 'discoBall', 'grooveCellar'],
  },
  hiphop: {
    majorTonics: [0, 5, 7],
    minorTonics: [9, 4, 2, 0],
    minorChance: 0.8,
    majorProgs: [
      ['ii', 'V', 'I', 'I'],
      ['I', 'vi', 'IV', 'V'],
    ],
    minorProgs: [
      // Short loops, as if sampled from a record
      ['i', 'i', 'VI', 'VII'],
      ['i', 'iv', 'i', 'VI'],
      ['i', 'VII', 'VI', 'VII'],
    ],
    bpm: [80, 96],
    bars: 16,
    names: ['hiphopJam', 'blockParty', 'cypher'],
  },
  electronic: {
    majorTonics: [7, 0, 5],
    minorTonics: [9, 4, 2],
    minorChance: 0.5,
    majorProgs: [
      ['vi', 'IV', 'I', 'V'],
      ['I', 'V', 'vi', 'IV'],
    ],
    minorProgs: [
      ['i', 'VI', 'III', 'VII'],
      ['i', 'i', 'VI', 'VII'],
    ],
    bpm: [118, 128],
    bars: 16,
    names: ['houseJam', 'warehouse', 'strobeLights'],
  },
};

/** Endless sections without a fixed style: random keys near the previous one, also minor and 3/4 time. */
function classicSection(index: number, prev: Section | undefined, rnd: () => number): SectionDef {
  const minor = rnd() < 0.4;
  // Prefer neighboring keys on the circle of fifths so transitions sound smooth
  const step = pick([7, 5, 0, 7, 5, 9, 3], rnd);
  const key: Key = { tonic: ((prev?.key.tonic ?? 0) + step) % 12, mode: minor ? 'minor' : 'major' };
  return {
    name: pick(NAMES, rnd),
    key,
    bpm: Math.min(140, 88 + index * 4 + Math.floor(rnd() * 8)),
    beatsPerBar: rnd() < 0.3 ? 3 : 4,
    progression: pick(minor ? MINOR_PROGS : MAJOR_PROGS, rnd),
    bars: 8,
    difficulty: Math.min(6, index),
  };
}

/** A section in the given style; `level` (0, 1, 2 …) makes it faster and harder over time. */
export function styleSection(style: Exclude<StyleId, 'classic'>, level: number, rnd: () => number): SectionDef {
  const r = RECIPES[style];
  const minor = !!r.minorTonics && rnd() < r.minorChance;
  const [lo, hi] = r.bpm;
  return {
    name: pick(r.names, rnd),
    key: { tonic: pick(minor ? r.minorTonics! : r.majorTonics, rnd), mode: minor ? 'minor' : 'major' },
    bpm: Math.round(Math.min(hi, lo + (hi - lo) * Math.min(1, level / 8) + rnd() * 4)),
    beatsPerBar: 4,
    progression: pick(minor ? r.minorProgs! : r.majorProgs, rnd),
    bars: r.bars,
    difficulty: Math.min(6, level),
    style,
    sevenths: r.sevenths,
  };
}

/**
 * Creates further endless sections. 'classic' keeps the original behavior;
 * a style plays only that style; 'mixed' picks a random style for every section.
 */
export function makeSectionGenerator(rnd: () => number, style: EndlessStyle = 'classic') {
  return (index: number, prev?: Section): SectionDef => {
    const s = style === 'mixed' ? pick(ENDLESS_STYLES.filter((x) => x !== 'mixed'), rnd) : style;
    if (s === 'classic') return classicSection(index, prev, rnd);
    return styleSection(s, index, rnd);
  };
}

/** The first sections of an endless run: famous tunes for classic/mixed, otherwise straight into the style. */
export function endlessIntro(style: EndlessStyle, rnd: () => number): SectionDef[] {
  if (style === 'classic' || style === 'mixed') return INTRO_SECTIONS;
  return [styleSection(style, 0, rnd)];
}

export interface Coin {
  beat: number;
  height: number;
  taken: boolean;
}

/** Target resonance band per difficulty. */
function resonanceBand(difficulty: number): [number, number] {
  const lo = Math.min(55, 12 + difficulty * 8);
  return [lo, lo + 20];
}

/** Share of obstacles that are pixel monsters (endless mode and campaign; not in the tutorial). */
export const MONSTER_CHANCE = 0.25;

export class LevelGen {
  readonly obstacles: Obstacle[] = [];
  readonly coins: Coin[] = [];

  constructor(private rnd: () => number) {}

  /** Generates obstacles for a section on the bar grid. */
  addSection(s: Section): void {
    const [lo, hi] = resonanceBand(s.difficulty);
    const density = Math.min(0.85, 0.45 + s.difficulty * 0.08);
    // First section: two bars to warm up
    const firstBar = s.index === 0 ? 2 : 1;
    let lastEnd = s.startBeat;
    for (let bar = firstBar; bar < s.bars; bar++) {
      if (this.rnd() > density) continue;
      const barStart = s.startBeat + bar * s.beatsPerBar;
      const beat = barStart + Math.floor(this.rnd() * s.beatsPerBar) * 0.5 + 1;
      if (beat - lastEnd < 3.2) continue;
      // Now and then a pixel monster takes the place of a wall or gap
      const o = this.makeObstacle(beat, lo, hi, this.rnd() < MONSTER_CHANCE);
      this.obstacles.push(o);
      lastEnd = o.beat + o.width;
    // Collectible notes above some obstacles, only reachable with a better melody
      if (this.rnd() < 0.55) {
        const r = Math.min(100, o.minResonance + 22 + this.rnd() * 10);
        const shape = jumpShape(r);
        const start = takeoffBeat(o, shape);
        this.coins.push({ beat: start + shape.duration / 2, height: shape.height * 0.92, taken: false });
      }
    }
  }

  /** Inserts a single obstacle later on (tutorial). */
  addObstacleAt(beat: number, lo: number, hi: number): Obstacle {
    const o = this.makeObstacle(beat, lo, hi);
    this.obstacles.push(o);
    return o;
  }

  private makeObstacle(beat: number, lo: number, hi: number, monster = false): Obstacle {
    let best: Obstacle | undefined;
    let bestDist = Infinity;
    for (let i = 0; i < 24; i++) {
      const gap = this.rnd() < 0.5;
      const o: Obstacle = monster
        ? this.makeMonster(beat)
        : gap
        ? { kind: 'gap', beat, width: 0.4 + this.rnd() * 2.0, height: 0, minResonance: 0 }
        : { kind: 'wall', beat, width: 0.25 + Math.floor(this.rnd() * 3) * 0.25, height: 30 + this.rnd() * 200, minResonance: 0 };
      o.minResonance = minResonanceFor(o);
      if (o.minResonance >= lo && o.minResonance <= hi) return o;
      const d = o.minResonance < lo ? lo - o.minResonance : o.minResonance - hi;
      if (d < bestDist) {
        bestDist = d;
        best = o;
      }
    }
    return best!;
  }

  /** A pixel monster: physically a wall whose size depends on its pixel scale (36–132 px). */
  private makeMonster(beat: number): Obstacle {
    const scale = 3 + Math.floor(this.rnd() * 9);
    const size = MONSTER_GRID * scale;
    return {
      kind: 'wall',
      beat,
      width: size / PX_PER_BEAT,
      height: size,
      minResonance: 0,
      monster: {
        shape: Math.floor(this.rnd() * 2),
        color: Math.floor(this.rnd() * 3),
        scale,
      },
    };
  }

  /** Next obstacle not yet passed, starting at `beat`. */
  nextObstacle(beat: number): Obstacle | undefined {
    for (const o of this.obstacles) if (o.beat + o.width > beat) return o;
    return undefined;
  }

  isGapAt(beat: number): Obstacle | undefined {
    for (const o of this.obstacles) {
      if (o.kind === 'gap' && beat > o.beat && beat < o.beat + o.width) return o;
    }
    return undefined;
  }

  prune(beat: number): void {
    while (this.obstacles.length && this.obstacles[0].beat + this.obstacles[0].width < beat - 16) this.obstacles.shift();
    while (this.coins.length && this.coins[0].beat < beat - 16) this.coins.shift();
  }
}
