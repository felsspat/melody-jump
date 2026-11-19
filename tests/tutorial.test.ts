import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Guide } from '../src/game/Guide';
import { STEPS, TUTORIAL_SECTION, Tutorial, passingPair, stepLines, stepTask, stepTitle } from '../src/game/Tutorial';
import { LOCALES, missingTranslations, setLocale, t, tl } from '../src/i18n/i18n';
import { diagnose, explainNote, intervalName, nearestChordTone, summarize, timingBias } from '../src/music/explain';
import { HarmonyJudge, JudgeContext } from '../src/music/HarmonyJudge';
import { Song, sectionName } from '../src/music/Song';
import { diatonicChord, keyName, noteName, pitchClass, scalePitchClasses } from '../src/music/theory';
import { SPRITE_H, SPRITE_PALETTE, SPRITE_W, spriteRows } from '../src/render/sprites';
import { INTRO_SECTIONS } from '../src/world/Level';

const C_MAJOR = { tonic: 0, mode: 'major' as const };
const C = diatonicChord(C_MAJOR, 1);
const ctx = (beat: number): JudgeContext => ({ key: C_MAJOR, chord: C, beatInBar: beat % 4, beatsPerBar: 4, secPerBeat: 0.75 });

describe('i18n', () => {
  afterEach(() => setLocale('en'));

  it('has every text in every language', () => {
    expect(missingTranslations()).toEqual([]);
  });

  it('switches language and fills placeholders', () => {
    setLocale('de');
    expect(t('hud.resonance', { n: 42 })).toBe('Resonanz 42');
    expect(keyName({ tonic: 11, mode: 'major' })).toBe('H-Dur');
    expect(noteName(71)).toBe('H4');
    setLocale('en');
    expect(t('hud.resonance', { n: 42 })).toBe('Resonance 42');
    expect(keyName({ tonic: 11, mode: 'major' })).toBe('B major');
    expect(noteName(71)).toBe('B4');
  });

  it('chord names follow the language', () => {
    const chord = diatonicChord(C_MAJOR, 7);
    setLocale('de');
    expect(chord.name).toBe('H°');
    setLocale('en');
    expect(chord.name).toBe('B°');
  });

  it('returns the key itself for missing texts', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
  });

  it('has a title, lines and a task for every tutorial step and a name for every section', () => {
    for (const locale of LOCALES) {
      setLocale(locale);
      for (const step of STEPS) {
        expect(stepTitle(step)).not.toContain('tutorial.steps');
        expect(stepLines(step).length).toBeGreaterThan(0);
        expect(stepTask(step)).not.toContain('tutorial.steps');
      }
      for (const s of [...INTRO_SECTIONS, TUTORIAL_SECTION]) expect(sectionName(s)).not.toContain('sections.');
      expect(tl('explain.intervals')).toHaveLength(13);
      expect(tl('noteNames')).toHaveLength(12);
    }
  });
});

describe('explain (German texts)', () => {
  beforeEach(() => setLocale('de'));
  afterEach(() => setLocale('en'));

  it('explains chord tones as fitting', () => {
    const j = new HarmonyJudge();
    const e = explainNote(j.judge({ midi: 64, velocity: 0.7, beat: 0 }, ctx(0)).note);
    expect(e.verdict).toBe('good');
    expect(e.why).toContain('C · E · G');
    expect(e.details[0]).toContain('Schlag');
  });

  it('explains foreign notes with the clashing neighbor and a tip', () => {
    const j = new HarmonyJudge();
    const e = explainNote(j.judge({ midi: 66, velocity: 0.7, beat: 1 }, ctx(1)).note); // F#
    expect(e.verdict).toBe('bad');
    expect(e.why).toContain('Halbton');
    expect(e.why).toContain('G');
    expect(e.details.join(' ')).toContain('G4');
  });

  it('reports timing errors in milliseconds', () => {
    const j = new HarmonyJudge();
    const e = explainNote(j.judge({ midi: 60, velocity: 0.7, beat: 0.6 }, ctx(0.6)).note);
    expect(e.details[0]).toMatch(/ms zu (früh|spät)/);
  });

  it('names intervals', () => {
    expect(intervalName(7)).toBe('Quinte');
    expect(intervalName(-12)).toBe('Oktave');
    expect(intervalName(6)).toBe('Tritonus');
  });

  it('recognizes a constant delay as latency, not as bad rhythm', () => {
    const late = new HarmonyJudge();
    // Every single note is late by the same 0.2 beats (150 ms at 80 BPM)
    for (let i = 0; i < 10; i++) late.judge({ midi: [60, 64, 67][i % 3], velocity: 0.7, beat: i + 0.2 }, ctx(i + 0.2));
    expect(timingBias(late.history)).toBe(150);
    expect(diagnose(late.history, 10, 4, 10)).toContain('Latenz');
    expect(summarize(late.history, 10).tip).toContain('zu spät');

    const mixed = new HarmonyJudge();
    for (let i = 0; i < 10; i++) {
      const b = i + (i % 2 ? 0.12 : -0.12);
      mixed.judge({ midi: [60, 64, 67][i % 3], velocity: 0.7, beat: b }, ctx(b));
    }
    expect(timingBias(mixed.history)).toBeUndefined();
    expect(diagnose(mixed.history, 10, 4, 10)).toContain('neben dem Takt');
  });

  it('sums up a run', () => {
    const j = new HarmonyJudge();
    for (let i = 0; i < 8; i++) j.judge({ midi: [60, 64, 67, 61][i % 4], velocity: 0.7, beat: i }, ctx(i));
    const s = summarize(j.history, 8);
    expect(s.notes).toBe(8);
    expect(s.onGridPct).toBe(100);
    expect(s.chordPct).toBeGreaterThan(0);
    expect(s.chordPct).toBeLessThan(100);
    expect(summarize([], 8).tip).toContain('Spiel Töne');
  });

  it('diagnoses silence and foreign notes', () => {
    expect(diagnose([], 10, 4, 0)).toContain('Spiel Töne');
    const j = new HarmonyJudge();
    for (let i = 0; i < 6; i++) j.judge({ midi: [61, 63, 66][i % 3], velocity: 0.7, beat: i }, ctx(i));
    expect(diagnose(j.history, 6, 4, 10)).toContain('fremde Töne');
    expect(diagnose(j.history, 6, 4, 80)).toBeUndefined();
  });
});

describe('explain (English texts)', () => {
  it('explains foreign notes in English', () => {
    setLocale('en');
    const j = new HarmonyJudge();
    const e = explainNote(j.judge({ midi: 66, velocity: 0.7, beat: 1 }, ctx(1)).note);
    expect(e.headline).toContain('foreign note');
    expect(e.why).toContain('half step');
  });

  it('finds the nearest chord tone', () => {
    expect(nearestChordTone(66, C.pcs)).toBe(67);
    expect(nearestChordTone(61, C.pcs)).toBe(60);
  });
});

describe('Guide', () => {
  it('only suggests chord tones within the range, on the beats', () => {
    const song = new Song([TUTORIAL_SECTION], () => TUTORIAL_SECTION);
    const g = new Guide(() => 0.3);
    for (let b = 0; b < 16; b += 0.25) g.update(b, song, 60, 72);
    expect(g.targets.length).toBeGreaterThan(0);
    for (const target of g.targets) {
      expect(Number.isInteger(target.beat)).toBe(true);
      expect(target.midi).toBeGreaterThanOrEqual(60);
      expect(target.midi).toBeLessThanOrEqual(72);
      expect(song.positionAt(target.beat).chord.pcs).toContain(pitchClass(target.midi));
    }
  });

  it('detects hits by pitch class and timing', () => {
    const song = new Song([TUTORIAL_SECTION], () => TUTORIAL_SECTION);
    const g = new Guide(() => 0);
    g.update(0, song, 60, 72);
    const target = g.targets[0];
    expect(g.tryHit(target.midi + 12, target.beat + 0.1, 0.2, 0)).toBe(target);
    expect(g.tryHit(target.midi, target.beat, 0.2, 0)).toBeUndefined(); // already hit
    expect(g.hits).toBe(1);
  });
});

describe('Tutorial', () => {
  it('ignores notes during the reading phase', () => {
    const tut = new Tutorial();
    expect(tut.reading).toBe(true);
    const j = new HarmonyJudge();
    const r = j.judge({ midi: 60, velocity: 0.7, beat: 0 }, ctx(0));
    tut.onNote(r.note, r.events, false, 0);
    expect(tut.state.progress).toBe(0);
  });

  it('advances to the next step once the task is done, then waits for the player again', () => {
    const tut = new Tutorial();
    tut.reading = false;
    const j = new HarmonyJudge();
    for (let i = 0; i < STEPS[0].goal; i++) {
      const r = j.judge({ midi: 60, velocity: 0.7, beat: i }, ctx(i));
      tut.onNote(r.note, r.events, false, i);
    }
    expect(tut.complete).toBe(true);
    tut.onFrame({ resonance: 0, obstaclesCleared: 0 }, 100);
    expect(tut.index).toBe(1);
    expect(tut.complete).toBe(false);
    expect(tut.reading).toBe(true);
  });

  it('only counts obstacles cleared since the step started', () => {
    const tut = new Tutorial();
    const idx = STEPS.findIndex((s) => s.obstacles);
    tut.index = idx - 1;
    tut.next(7);
    tut.reading = false;
    expect(tut.step.obstacles).toBe(true);
    tut.onFrame({ resonance: 0, obstaclesCleared: 9 }, 0);
    expect(tut.state.progress).toBe(2);
  });

  it('the passing-tone exercise marks an out-of-key note next to a chord tone', () => {
    for (let degree = 1; degree <= 7; degree++) {
      const chord = diatonicChord(C_MAJOR, degree);
      const [foreign, target] = passingPair(chord, C_MAJOR);
      expect(scalePitchClasses(C_MAJOR)).not.toContain(pitchClass(foreign));
      expect(chord.pcs).toContain(pitchClass(target));
      expect(Math.abs(foreign - target)).toBe(1);
    }
  });
});

describe('player sprite', () => {
  it('every frame is a full grid using only known colors', () => {
    for (const frame of ['runA', 'runB', 'jump', 'hurt'] as const) {
      const rows = spriteRows(frame);
      expect(rows).toHaveLength(SPRITE_H);
      for (const row of rows) {
        expect(row).toHaveLength(SPRITE_W);
        for (const ch of row) if (ch !== '.') expect(SPRITE_PALETTE[ch]).toBeDefined();
      }
    }
  });
});
