// Music timeline: sections with key, tempo, time signature and chord progression.
// Positions are given in beats (quarter notes) since the start of the game.

import { t } from '../i18n/i18n';
import { StyleId } from './styles';
import { Chord, ChordSpec, Key, chordFromSpec, keyName } from './theory';

/** The chords of one bar: a single chord, or several that split the bar evenly. */
export type BarChords = ChordSpec | ChordSpec[];

export interface SectionDef {
  /** Key into sections.* in texts.json */
  name: string;
  key: Key;
  bpm: number;
  beatsPerBar: number;
  /**
   * Chord progression, one entry per bar. An entry can also be a list of chords
   * that split the bar evenly, e.g. ['I', 'V7'] = two beats each in 4/4.
   */
  progression: BarChords[];
  bars: number;
  /** 0 = very easy, increases as the game progresses */
  difficulty: number;
  /** Optional well-known melody (key into MELODIES) shown by the guide rings */
  melody?: string;
  /** Genre (judging rules, backing band); defaults to classic */
  style?: StyleId;
  /** Use dominant seventh chords (blues) instead of plain triads */
  sevenths?: boolean;
}

export interface Section extends SectionDef {
  index: number;
  startBeat: number;
  startBar: number;
  /** Chords per bar of the progression (usually one, sometimes several) */
  chords: Chord[][];
}

export interface MusicPosition {
  section: Section;
  chord: Chord;
  nextChord: Chord;
  /** Bar since game start (global) */
  bar: number;
  barInSection: number;
  /** Position within the bar in beats (0 … beatsPerBar) */
  beatInBar: number;
}

/** Localized display name of a section. */
export function sectionName(s: SectionDef): string {
  return t('sections.' + s.name);
}

export function describeSection(s: SectionDef): string {
  return t('music.sectionInfo', { key: keyName(s.key), bpm: s.bpm, beats: s.beatsPerBar });
}

export class Song {
  readonly sections: Section[] = [];
  private onSectionAdded: ((s: Section) => void)[] = [];

  constructor(
    defs: SectionDef[],
    /** Creates further sections forever; omit for a finite level */
    private generate?: (index: number, prev: Section) => SectionDef,
  ) {
    for (const d of defs) this.append(d);
  }

  /** Callback whenever new sections are generated (e.g. for obstacles). */
  onAdd(cb: (s: Section) => void): void {
    this.onSectionAdded.push(cb);
    for (const s of this.sections) cb(s);
  }

  private append(def: SectionDef): Section {
    const prev = this.sections[this.sections.length - 1];
    const startBeat = prev ? prev.startBeat + prev.bars * prev.beatsPerBar : 0;
    const startBar = prev ? prev.startBar + prev.bars : 0;
    const s: Section = {
      ...def,
      index: this.sections.length,
      startBeat,
      startBar,
      chords: def.progression.map((bar) => (Array.isArray(bar) ? bar : [bar]).map((d) => chordFromSpec(def.key, d, def.sevenths))),
    };
    this.sections.push(s);
    for (const cb of this.onSectionAdded) cb(s);
    return s;
  }

  /** Makes sure sections exist up to at least `beat`. */
  ensure(beat: number): void {
    for (;;) {
      const last = this.sections[this.sections.length - 1];
      const end = last.startBeat + last.bars * last.beatsPerBar;
      if (end > beat) return;
      if (!this.generate) return;
      this.append(this.generate(this.sections.length, last));
    }
  }

  sectionAt(beat: number): Section {
    if (beat < 0) return this.sections[0];
    this.ensure(beat + 64);
    for (let i = this.sections.length - 1; i >= 0; i--) {
      if (this.sections[i].startBeat <= beat) return this.sections[i];
    }
    return this.sections[0];
  }

  nextSection(s: Section): Section {
    this.ensure(s.startBeat + s.bars * s.beatsPerBar + 1);
    // Finite songs: the last section has no successor
    return this.sections[s.index + 1] ?? s;
  }

  bpmAt(beat: number): number {
    return this.sectionAt(beat).bpm;
  }

  positionAt(beat: number): MusicPosition {
    const section = this.sectionAt(beat);
    const bpb = section.beatsPerBar;
    if (beat < 0) {
      // Count-in: bar -1, chord = first chord
      const beatInBar = ((beat % bpb) + bpb) % bpb;
      return {
        section,
        chord: section.chords[0][0],
        nextChord: section.chords[0][0],
        bar: Math.floor(beat / bpb),
        barInSection: -1,
        beatInBar,
      };
    }
    const rel = beat - section.startBeat;
    const barInSection = Math.floor(rel / bpb);
    const beatInBar = rel - barInSection * bpb;
    // Several chords in a bar split it evenly
    const barChords = section.chords[barInSection % section.chords.length];
    const idx = Math.min(barChords.length - 1, Math.floor((beatInBar / bpb) * barChords.length + 1e-9));
    const chord = barChords[idx];
    let nextChord: Chord;
    if (idx + 1 < barChords.length) {
      nextChord = barChords[idx + 1];
    } else if (barInSection + 1 < section.bars) {
      nextChord = section.chords[(barInSection + 1) % section.chords.length][0];
    } else {
      nextChord = this.nextSection(section).chords[0][0];
    }
    return { section, chord, nextChord, bar: section.startBar + barInSection, barInSection, beatInBar };
  }

  /** Beat at which a finite song (campaign level) ends; Infinity for endless songs. */
  get endBeat(): number {
    if (this.generate) return Infinity;
    const last = this.sections[this.sections.length - 1];
    return last.startBeat + last.bars * last.beatsPerBar;
  }
}
