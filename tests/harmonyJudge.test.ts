import { describe, expect, it } from 'vitest';
import { HarmonyJudge, JudgeContext, timingMultiplier } from '../src/music/HarmonyJudge';
import { Chord, diatonicChord } from '../src/music/theory';

const C_MAJOR = { tonic: 0, mode: 'major' as const };
const SPB = 0.6; // 100 BPM

function ctxFor(beat: number, chord: Chord = diatonicChord(C_MAJOR, 1)): JudgeContext {
  return { key: C_MAJOR, chord, beatInBar: ((beat % 4) + 4) % 4, beatsPerBar: 4, secPerBeat: SPB };
}

function play(j: HarmonyJudge, notes: [number, number][], velocity = 0.7) {
  return notes.map(([midi, beat]) => j.judge({ midi, velocity, beat }, ctxFor(beat)));
}

describe('timingMultiplier', () => {
  it('rewards notes on the beat', () => {
    expect(timingMultiplier(4.0, SPB).mult).toBe(1.25);
    expect(timingMultiplier(4.05, SPB).mult).toBe(1.25); // 30 ms off
    expect(timingMultiplier(4.5, SPB).mult).toBe(1.0);
    expect(timingMultiplier(4.37, SPB).mult).toBe(0.55);
  });
});

describe('HarmonyJudge', () => {
  it('classifies chord, scale and out-of-scale notes', () => {
    const j = new HarmonyJudge();
    const [a, b, c] = play(j, [
      [64, 0], // E: chord tone of C
      [62, 1], // D: scale tone
      [66, 2], // F#: outside the scale
    ]);
    expect(a.note.quality).toBe('chord');
    expect(b.note.quality).toBe('scale');
    expect(c.note.quality).toBe('dissonant');
    expect(c.note.score).toBeLessThan(0);
  });

  it('an on-beat C major arpeggio yields high resonance', () => {
    const j = new HarmonyJudge();
    play(j, [
      [60, 0], [64, 1], [67, 2], [72, 3],
      [67, 4], [64, 5], [60, 6], [64, 7],
    ]);
    expect(j.resonance(7.2, 4)).toBeGreaterThan(75);
  });

  it('off-key notes played off the beat yield low resonance', () => {
    const j = new HarmonyJudge();
    const notes: [number, number][] = [];
    const wrong = [61, 66, 70, 63, 68]; // all outside C major
    for (let i = 0; i < 16; i++) notes.push([wrong[i % wrong.length], 0.37 + i * 0.45]);
    play(j, notes);
    expect(j.resonance(7.6, 4)).toBeLessThan(10);
  });

  it('an ascending chromatic line scores between key mashing and an arpeggio', () => {
    const j = new HarmonyJudge();
    const notes: [number, number][] = [];
    for (let i = 0; i < 16; i++) notes.push([61 + (i % 6), 0.37 + i * 0.45]);
    play(j, notes);
    const r = j.resonance(7.6, 4);
    expect(r).toBeGreaterThan(10);
    expect(r).toBeLessThan(60);
  });

  it('silence lets the resonance decay', () => {
    const j = new HarmonyJudge();
    play(j, [[60, 0], [64, 1], [67, 2]]);
    const early = j.resonance(2.1, 4);
    expect(j.resonance(9, 4)).toBeLessThan(early);
    expect(j.resonance(20, 4)).toBe(0);
  });

  it('dampens spamming the same note', () => {
    const j = new HarmonyJudge();
    const results = play(j, [[60, 0], [60, 0.5], [60, 1], [60, 1.5]]);
    expect(results[3].note.score).toBeLessThan(results[0].note.score);
  });

  it('detects chord patterns (shield)', () => {
    const j = new HarmonyJudge();
    const r = play(j, [[60, 0], [64, 0.25], [67, 0.5]]);
    expect(r[2].events).toContain('chord');
  });

  it('detects octave leaps (double jump)', () => {
    const j = new HarmonyJudge();
    const r = play(j, [[60, 0], [72, 1]]);
    expect(r[1].events).toContain('octave');
  });

  it('softens resolved passing tones', () => {
    const j = new HarmonyJudge();
    const r = play(j, [[66, 0.5], [67, 1]]); // F# -> G
    expect(r[1].events).toContain('resolution');
    expect(j.history[0].quality).toBe('passing');
  });

  it('reports dissonance streaks', () => {
    const j = new HarmonyJudge();
    const r = play(j, [[61, 0], [63, 1], [66, 2]]);
    expect(r[2].events).toContain('dissonance');
  });
});
