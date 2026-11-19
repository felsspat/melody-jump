import { describe, expect, it } from 'vitest';
import { parseMidiMessage } from '../src/input/MidiInput';

describe('MIDI keyboard', () => {
  it('reads note-on with its velocity', () => {
    expect(parseMidiMessage([0x90, 60, 127])).toEqual({ type: 'on', midi: 60, velocity: 1 });
    const soft = parseMidiMessage([0x93, 64, 1]); // channel 4
    expect(soft?.type).toBe('on');
    expect(soft && soft.type === 'on' && soft.velocity).toBeCloseTo(0.2 + 0.8 / 127);
  });

  it('treats note-off and note-on with velocity 0 the same', () => {
    expect(parseMidiMessage([0x80, 60, 40])).toEqual({ type: 'off', midi: 60 });
    expect(parseMidiMessage([0x90, 60, 0])).toEqual({ type: 'off', midi: 60 });
  });

  it('ignores everything else', () => {
    expect(parseMidiMessage([0xb0, 64, 127])).toBeUndefined(); // sustain pedal
    expect(parseMidiMessage([0xe0, 0, 64])).toBeUndefined(); // pitch bend
    expect(parseMidiMessage([0xf8])).toBeUndefined(); // clock
  });
});
