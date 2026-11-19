// Interactive tutorial: short steps, each with a small task. A step advances
// as soon as its task is done (or via Enter). Arrows ("markers") point at the
// exact lane/key that is meant. All text lives in texts.json under
// tutorial.steps.<id>.{title,lines,task}.

import { t, tl } from '../i18n/i18n';
import { JudgeEvent, JudgedNote } from '../music/HarmonyJudge';
import { SectionDef } from '../music/Song';
import { HIGH_MIDI, LOW_MIDI } from '../input/InputMapper';
import { Chord, Key, pitchClass, scalePitchClasses } from '../music/theory';

export const TUTORIAL_SECTION: SectionDef = {
  name: 'practiceRoom',
  key: { tonic: 0, mode: 'major' },
  bpm: 66,
  beatsPerBar: 4,
  // Each chord lasts two bars so there is time to understand why notes fit
  progression: [1, 1, 6, 6, 4, 4, 5, 5],
  bars: 8,
  difficulty: 0,
};

export interface StepState {
  progress: number;
  seen: Set<string>;
}

export interface FrameStatus {
  resonance: number;
  obstaclesCleared: number;
}

/** Arrow above a note lane: "click here / press this key". */
export interface Marker {
  midi: number;
  /** Already localized label */
  label: string;
}

export interface TutorialStep {
  /** Key into tutorial.steps.* in texts.json */
  id: string;
  goal: number;
  /** Show guide rings */
  guide: boolean;
  /** Spawn obstacles */
  obstacles?: boolean;
  /** Which lanes should currently be marked with arrows? */
  markers?(chord: Chord, key: Key): Marker[];
  onNote?(n: JudgedNote, events: JudgeEvent[], guideHit: boolean, s: StepState): void;
  onFrame?(f: FrameStatus, s: StepState): void;
}

export function stepTitle(step: TutorialStep): string {
  return t(`tutorial.steps.${step.id}.title`);
}

export function stepLines(step: TutorialStep): string[] {
  return tl(`tutorial.steps.${step.id}.lines`);
}

export function stepTask(step: TutorialStep): string {
  return t(`tutorial.steps.${step.id}.task`);
}

/** First note ≥ low whose pitch class is the chord root. */
export function rootFrom(chord: Chord, low: number): number {
  let m = low;
  while (pitchClass(m) !== chord.root) m++;
  return m;
}

export function chordTonesIn(chord: Chord, low: number, high: number): number[] {
  const out: number[] = [];
  for (let m = low; m <= high; m++) if (chord.pcs.includes(pitchClass(m))) out.push(m);
  return out;
}

/** An out-of-key note right next to a chord tone (for the passing-tone exercise). */
export function passingPair(chord: Chord, key: Key, low = 60): [number, number] {
  const scale = scalePitchClasses(key);
  for (const tone of chordTonesIn(chord, low + 1, low + 12)) {
    for (const d of [-1, 1]) {
      if (!scale.includes(pitchClass(tone + d))) return [tone + d, tone];
    }
  }
  const tone = rootFrom(chord, low + 1);
  return [tone - 1, tone];
}

const chordToneMarkers = (c: Chord): Marker[] =>
  chordTonesIn(c, 60, 72).map((m) => ({ midi: m, label: t('tutorial.markers.fits') }));

export const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    goal: 3,
    guide: false,
    markers: (c) => [{ midi: rootFrom(c, 60), label: t('tutorial.markers.clickHere') }],
    onNote: (_n, _e, _g, s) => s.progress++,
  },
  {
    id: 'pitch',
    goal: 2,
    guide: false,
    markers: (c) => [
      // Lowest and highest octave on screen (fewer lanes on phones)
      { midi: rootFrom(c, LOW_MIDI), label: t('tutorial.markers.low') },
      { midi: rootFrom(c, HIGH_MIDI - 10), label: t('tutorial.markers.high') },
    ],
    onNote: (n, _e, _g, s) => {
      if (n.midi <= LOW_MIDI + 11) s.seen.add('low');
      if (n.midi >= HIGH_MIDI - 12) s.seen.add('high');
      s.progress = s.seen.size;
    },
  },
  {
    id: 'beat',
    goal: 4,
    guide: true,
    onNote: (n, _e, _g, s) => {
      if (n.parts.timing >= 1.25) s.progress++;
    },
  },
  {
    id: 'chordTones',
    goal: 4,
    guide: false,
    markers: chordToneMarkers,
    onNote: (n, _e, _g, s) => {
      if (n.quality === 'chord') s.progress++;
    },
  },
  {
    id: 'chordChange',
    goal: 3,
    guide: false,
    markers: chordToneMarkers,
    onNote: (n, _e, _g, s) => {
      if (n.quality === 'chord') s.seen.add(String(n.chord.root));
      s.progress = s.seen.size;
    },
  },
  {
    id: 'rings',
    goal: 6,
    guide: true,
    onNote: (_n, _e, hit, s) => {
      if (hit) s.progress++;
    },
  },
  {
    id: 'dissonance',
    goal: 1,
    guide: false,
    markers: (c, k) => {
      const [foreign, target] = passingPair(c, k);
      return [
        { midi: foreign, label: t('tutorial.markers.foreign') },
        { midi: target, label: t('tutorial.markers.resolve') },
      ];
    },
    onNote: (_n, events, _g, s) => {
      if (events.includes('resolution')) s.progress++;
    },
  },
  {
    id: 'melody',
    goal: 1,
    guide: true,
    onFrame: (f, s) => {
      if (f.resonance >= 70) s.progress = 1;
    },
  },
  {
    id: 'specials',
    goal: 2,
    guide: false,
    markers: (c) => {
      const root = rootFrom(c, 60);
      const triad = chordTonesIn(c, root, root + 11);
      return [
        ...triad.map((m, i) => ({ midi: m, label: t('tutorial.markers.chordTone', { n: i + 1 }) })),
        { midi: root + 12, label: t('tutorial.markers.octave') },
      ];
    },
    onNote: (_n, events, _g, s) => {
      if (events.includes('octave')) s.seen.add('octave');
      if (events.includes('chord')) s.seen.add('chord');
      s.progress = s.seen.size;
    },
  },
  {
    id: 'obstacles',
    goal: 4,
    guide: true,
    obstacles: true,
    onFrame: (f, s) => {
      s.progress = f.obstaclesCleared;
    },
  },
  {
    id: 'done',
    goal: Infinity,
    guide: true,
  },
];

export class Tutorial {
  index = 0;
  state: StepState = { progress: 0, seen: new Set() };
  completedAt = -1;
  /** Reading phase at the start of each step: the world is frozen until the player is ready */
  reading = true;
  /** Obstacles already cleared when the current step started */
  clearedOffset = 0;

  get step(): TutorialStep {
    return STEPS[this.index];
  }

  get isLast(): boolean {
    return this.index === STEPS.length - 1;
  }

  get complete(): boolean {
    return this.completedAt >= 0;
  }

  onNote(n: JudgedNote, events: JudgeEvent[], guideHit: boolean, now: number): void {
    if (this.complete || this.reading) return;
    this.step.onNote?.(n, events, guideHit, this.state);
    this.check(now);
  }

  onFrame(f: FrameStatus, now: number): void {
    if (this.reading) return;
    if (!this.complete) {
      this.step.onFrame?.({ ...f, obstaclesCleared: f.obstaclesCleared - this.clearedOffset }, this.state);
      this.check(now);
    } else if (now - this.completedAt > 1.8) {
      this.next(f.obstaclesCleared);
    }
  }

  private check(now: number): void {
    if (this.state.progress >= this.step.goal) this.completedAt = now;
  }

  next(obstaclesCleared: number): void {
    if (this.isLast) return;
    this.index++;
    this.state = { progress: 0, seen: new Set() };
    this.completedAt = -1;
    this.clearedOffset = obstaclesCleared;
    this.reading = true;
  }
}
