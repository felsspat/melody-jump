import { describe, expect, it } from 'vitest';
import { diatonicChord, intervalScore, midiToFreq, noteName, scalePitchClasses, voiceChord } from '../src/music/theory';

describe('theory', () => {
  it('converts MIDI to frequency', () => {
    expect(midiToFreq(69)).toBeCloseTo(440);
    expect(midiToFreq(81)).toBeCloseTo(880);
    expect(midiToFreq(60)).toBeCloseTo(261.63, 1);
  });

  it('names notes', () => {
    expect(noteName(60)).toBe('C4');
    expect(noteName(61)).toBe('C#4');
    expect(noteName(48)).toBe('C3');
  });

  it('knows major and minor scales', () => {
    expect(scalePitchClasses({ tonic: 0, mode: 'major' })).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(scalePitchClasses({ tonic: 9, mode: 'minor' })).toEqual([9, 11, 0, 2, 4, 5, 7]);
  });

  it('builds diatonic chords', () => {
    const C = { tonic: 0, mode: 'major' as const };
    expect(diatonicChord(C, 1)).toMatchObject({ name: 'C', quality: 'maj', pcs: [0, 4, 7], roman: 'I' });
    expect(diatonicChord(C, 6)).toMatchObject({ name: 'Am', quality: 'min', roman: 'vi' });
    expect(diatonicChord(C, 5)).toMatchObject({ name: 'G', quality: 'maj', roman: 'V' });
    expect(diatonicChord(C, 7)).toMatchObject({ name: 'B°', quality: 'dim' });
    const Am = { tonic: 9, mode: 'minor' as const };
    expect(diatonicChord(Am, 6).name).toBe('F');
    expect(diatonicChord(Am, 7).name).toBe('G');
  });

  it('scores intervals', () => {
    expect(intervalScore(12)).toBe(1);
    expect(intervalScore(7)).toBe(1);
    expect(intervalScore(-4)).toBe(1);
    expect(intervalScore(2)).toBe(0.5);
    expect(intervalScore(6)).toBe(-1);
    expect(intervalScore(0)).toBe(0);
    expect(intervalScore(13)).toBeLessThan(0);
  });

  it('voices chords above a lower bound', () => {
    const v = voiceChord(diatonicChord({ tonic: 0, mode: 'major' }, 1), 55);
    expect(v).toEqual([55, 60, 64]);
  });
});
