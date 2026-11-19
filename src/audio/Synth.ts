// Polyphonic player voice: two oscillators, low-pass filter, ADSR envelope –
// or, in "samples" sound mode, a recorded instrument that depends on the style.

import { midiToFreq } from '../music/theory';
import { AudioEngine } from './AudioEngine';
import { InstrumentId, SampleBank, SampleVoice } from './SampleBank';

interface Voice {
  oscs: OscillatorNode[];
  gain: GainNode;
  released: boolean;
  autoOff: number;
}

export class Synth {
  private voices = new Map<number, Voice>();
  private sampleVoices = new Map<number, SampleVoice>();
  private nextId = 1;
  /** Recorded instruments; used instead of the synth voice when `instrument()` returns one */
  samples?: SampleBank;
  /** Which recorded instrument the player currently plays (undefined = synthesizer) */
  instrument: () => InstrumentId | undefined = () => undefined;

  constructor(private engine: AudioEngine) {}

  noteOn(midi: number, velocity: number): number {
    const { ctx } = this.engine;
    const t = ctx.currentTime;
    const f = midiToFreq(midi);
    const v = Math.max(0.05, Math.min(1, velocity));

    const inst = this.instrument();
    if (inst && this.samples?.ready) {
      const voice = this.samples.playNote(inst, midi, t, Infinity, 0.15 + 0.55 * v * v, this.engine.playerBus, this.engine.playerReverb, v);
      if (voice) {
        const id = this.nextId++;
        this.sampleVoices.set(id, voice);
        return id;
      }
    }

    const gain = ctx.createGain();
    const peak = 0.07 + 0.23 * v * v;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(peak * 0.55, t + 0.25);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 2;
    const cutoff = 900 + 4500 * v;
    filter.frequency.setValueAtTime(cutoff * 1.6, t);
    filter.frequency.exponentialRampToValueAtTime(cutoff, t + 0.3);

    const o1 = ctx.createOscillator();
    o1.type = 'triangle';
    o1.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.value = f;
    o2.detune.value = 6;
    const o2g = ctx.createGain();
    o2g.gain.value = 0.25;
    const o3 = ctx.createOscillator(); // bell-like overtone for the attack
    o3.type = 'sine';
    o3.frequency.value = f * 4;
    const o3g = ctx.createGain();
    o3g.gain.setValueAtTime(0.15 * v, t);
    o3g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

    o1.connect(filter);
    o2.connect(o2g).connect(filter);
    o3.connect(o3g).connect(filter);
    filter.connect(gain);
    gain.connect(this.engine.playerBus);
    gain.connect(this.engine.playerReverb);

    const oscs = [o1, o2, o3];
    for (const o of oscs) o.start(t);

    const id = this.nextId++;
    // Safety net in case no noteOff arrives (e.g. focus loss)
    const autoOff = window.setTimeout(() => this.noteOff(id), 4000);
    this.voices.set(id, { oscs, gain, released: false, autoOff });
    return id;
  }

  noteOff(id: number): void {
    const sampleVoice = this.sampleVoices.get(id);
    if (sampleVoice) {
      sampleVoice.release(this.engine.ctx.currentTime);
      this.sampleVoices.delete(id);
      return;
    }
    const voice = this.voices.get(id);
    if (!voice || voice.released) return;
    voice.released = true;
    window.clearTimeout(voice.autoOff);
    const t = this.engine.ctx.currentTime;
    const g = voice.gain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.exponentialRampToValueAtTime(0.0001, t + 0.45);
    for (const o of voice.oscs) o.stop(t + 0.5);
    window.setTimeout(() => {
      voice.gain.disconnect();
      this.voices.delete(id);
    }, 600);
  }

  allOff(): void {
    for (const id of [...this.voices.keys(), ...this.sampleVoices.keys()]) this.noteOff(id);
  }
}
