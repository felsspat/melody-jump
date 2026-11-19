// Guide rings: suggest what to play next. In sections with a well-known melody
// they show that melody; otherwise a simple melody that always fits (chord
// tones in small steps). Rings shrink until the note is due, like in rhythm games.

import { melodyTimeline, pickupBeats } from '../music/melodies';
import { Section, Song } from '../music/Song';
import { pitchClass } from '../music/theory';

export interface GuideTarget {
  beat: number;
  midi: number;
  hit: boolean;
  hitAt: number;
}

export class Guide {
  enabled = true;
  /** Beats between suggested notes (2 = calmer, half notes) */
  stride = 1;
  targets: GuideTarget[] = [];
  hits = 0;
  /** Targets that have scrolled past (hit or not) */
  private passed = 0;
  private lastMidi = 64;
  private lastBeat = -Infinity;

  constructor(private rnd: () => number = Math.random) {}

  reset(): void {
    this.targets = [];
    this.hits = 0;
    this.passed = 0;
    this.lastMidi = 64;
    this.lastBeat = -Infinity;
  }

  /**
   * Generates targets up to ~2.5 beats ahead within the pitch range [low, high].
   * Sections with a well-known melody get exactly that melody; other sections
   * get a generated melody of chord tones.
   */
  update(nowBeat: number, song: Song, low: number, high: number): void {
    const before = this.targets.length;
    this.targets = this.targets.filter((t) => t.beat > nowBeat - 0.6);
    this.passed += before - this.targets.length;
    if (!this.enabled) return;
    // Targets are generated for the half-open window [from, to)
    // (negative beats = count-in, where a melody's pickup may already start)
    const from = Math.max(this.lastBeat, nowBeat + 0.3);
    const to = nowBeat + 2.5 * Math.max(1, this.stride);
    if (from >= to) return;
    let section = song.sectionAt(Math.max(from, 0));
    for (;;) {
      const next = song.nextSection(section);
      const last = next === section; // end of a finite song (campaign level)
      // A section owns its pickup (before its start); the next section's pickup is cut off its end
      const start = section.startBeat - pickupBeats(section);
      const end = section.startBeat + section.bars * section.beatsPerBar - (last ? 0 : pickupBeats(next));
      const segFrom = Math.max(from, start);
      const segTo = Math.min(to, end);
      if (segFrom < segTo) {
        if (section.melody) this.addMelodyTargets(section, segFrom, segTo, low);
        else this.addChordTargets(song, section, segFrom, segTo, low, high);
      }
      if (last || end >= to) break;
      section = next;
    }
    this.lastBeat = to;
  }

  /** How many rings were due up to `nowBeat` (to compare with `hits`). */
  dueCount(nowBeat: number): number {
    return this.passed + this.targets.filter((t) => t.beat <= nowBeat).length;
  }

  /** Well-known melody, transposed so its tonic sits at the bottom of the range. */
  private addMelodyTargets(section: Section, from: number, to: number, low: number): void {
    const tonicMidi = low + ((section.key.tonic - pitchClass(low) + 12) % 12);
    for (const n of melodyTimeline(section)) {
      if (n.beat < from || n.beat >= to) continue;
      const midi = tonicMidi + n.offset;
      this.targets.push({ beat: n.beat, midi, hit: false, hitAt: 0 });
      this.lastMidi = midi;
    }
  }

  /** Generated melody: chord tones in small steps on a beat grid of `stride`. */
  private addChordTargets(song: Song, section: Section, from: number, to: number, low: number, high: number): void {
    const step = this.stride;
    const first = section.startBeat + Math.ceil((from - section.startBeat) / step) * step;
    for (let b = first; b < to; b += step) {
      const pos = song.positionAt(b);
      // Leave an occasional rest in the middle of long phrases
      const rest = step === 1 && pos.section.beatsPerBar === 4 && Math.round(pos.beatInBar) === 3 && pos.bar % 2 === 1;
      if (rest) continue;
      const midi = this.choose(pos.chord.pcs, pos.chord.root, Math.round(pos.beatInBar) === 0, low, high);
      this.targets.push({ beat: b, midi, hit: false, hitAt: 0 });
      this.lastMidi = midi;
    }
  }

  private choose(pcs: number[], root: number, downbeat: boolean, low: number, high: number): number {
    const cands: number[] = [];
    for (let m = low; m <= high; m++) if (pcs.includes(pitchClass(m))) cands.push(m);
    if (downbeat) {
      // On beat 1, prefer the root if it is close enough
      const roots = cands.filter((m) => pitchClass(m) === root && Math.abs(m - this.lastMidi) <= 7);
      if (roots.length) return roots[0];
    }
    const others = cands.filter((m) => m !== this.lastMidi).sort((a, b) => Math.abs(a - this.lastMidi) - Math.abs(b - this.lastMidi));
    if (others.length === 0) return this.lastMidi;
    return others[Math.min(others.length - 1, Math.floor(this.rnd() * 2))];
  }

  /** Checks whether a played note hits a target (same pitch class, roughly on time). */
  tryHit(midi: number, beat: number, tolBeats: number, now: number): GuideTarget | undefined {
    for (const t of this.targets) {
      if (t.hit) continue;
      if (Math.abs(t.beat - beat) <= tolBeats && pitchClass(t.midi) === pitchClass(midi)) {
        t.hit = true;
        t.hitAt = now;
        this.hits++;
        return t;
      }
    }
    return undefined;
  }
}
