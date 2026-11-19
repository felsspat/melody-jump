// Backing band: one pattern per musical style (drums, bass, comping), all synthesized.

import { Song } from '../music/Song';
import { InstrumentId, SampleBank } from './SampleBank';
import { STYLES, StyleId } from '../music/styles';
import { Chord, midiToFreq, voiceChord } from '../music/theory';
import { AudioEngine } from './AudioEngine';

/** Everything a style pattern needs to know about the current eighth-note step. */
interface StepInfo {
  chord: Chord;
  next: Chord;
  bar: number;
  beatIdx: number;
  onBeat: boolean;
  time: number;
  spb: number;
}

export class Backing {
  muted = false;
  /** Recorded instruments (used when the player picked "samples" and they're loaded) */
  samples?: SampleBank;
  useSamples = false;
  private style: StyleId = 'classic';

  private get sampled(): SampleBank | undefined {
    return this.useSamples && this.samples?.ready ? this.samples : undefined;
  }

  /** Bass sound per style: upright bass for the acoustic eras, electric bass later. */
  private get bassInstrument(): InstrumentId {
    return this.style === 'ragtime' || this.style === 'dixieland' || this.style === 'swing' || this.style === 'blues' || this.style === 'classic' ? 'uprightBass' : 'bass';
  }

  constructor(
    private engine: AudioEngine,
    private song: Song,
  ) {}

  /** Called by the Clock for every eighth-note step. */
  onStep(beat: number, time: number, bpm: number): void {
    if (this.muted) return;
    const spb = 60 / bpm;
    const pos = this.song.positionAt(beat);
    const bpb = pos.section.beatsPerBar;
    const onBeat = Number.isInteger(beat);
    const beatIdx = Math.round(pos.beatInBar) % bpb;

    if (beat < 0) {
      // Count-in
      if (onBeat) this.click(time, beatIdx === 0);
      return;
    }
    // Finite campaign levels: the band stops at the end
    if (beat >= this.song.endBeat) {
      if (beat === this.song.endBeat) this.kick(time, 0.9);
      return;
    }

    this.style = pos.section.style ?? 'classic';
    const step: StepInfo = { chord: pos.chord, next: pos.nextChord, bar: pos.bar, beatIdx, onBeat, time, spb };
    switch (pos.section.style) {
      case 'blues':
        this.bluesStep(pos.chord.root, pos.bar, beatIdx, onBeat, time, spb);
        return;
      case 'ragtime':
        return this.ragtimeStep(step);
      case 'dixieland':
        return this.dixielandStep(step);
      case 'swing':
        return this.swingStep(step);
      case 'rock':
        return this.rockStep(step);
      case 'ska':
        return this.skaStep(step);
      case 'reggae':
        return this.reggaeStep(step);
      case 'funk':
        return this.funkStep(step);
      case 'hiphop':
        return this.hiphopStep(step);
      case 'electronic':
        return this.electronicStep(step);
    }

    // Hi-hat on every eighth note
    this.hat(time, onBeat ? 0.09 : 0.05);
    if (!onBeat) return;

    // Kick & Snare
    if (bpb === 3) {
      if (beatIdx === 0) this.kick(time, 0.9);
      else this.snare(time, 0.12);
    } else {
      if (beatIdx === 0 || beatIdx === 2) this.kick(time, beatIdx === 0 ? 0.9 : 0.7);
      if (beatIdx === 1 || beatIdx === 3) this.snare(time, 0.28);
    }

    // Bass: root on beat 1, fifth mid-bar (4/4), octave in waltz time
    const root = 36 + pos.chord.root;
    if (beatIdx === 0) this.bass(time, root, spb * (bpb === 3 ? 0.9 : 1.8));
    else if (bpb === 4 && beatIdx === 2) this.bass(time, root + 7 > 47 ? root - 5 : root + 7, spb * 1.6);
    else if (bpb === 3) this.bass(time, root + 12, spb * 0.8, 0.12);

    // Pad at the start of the bar
    if (beatIdx === 0) {
      for (const m of voiceChord(pos.chord, 55)) this.pad(time, m, spb * bpb);
    }
  }

  /**
   * Blues shuffle: swung eighths on the hi-hat (long-short), kick on 1 and 3,
   * snare on 2 and 4, a boogie-woogie walking bass (1-3-5-6, then b7-6-5-3)
   * and short piano chords on 2 and 4.
   */
  private bluesStep(root: number, bar: number, beatIdx: number, onBeat: boolean, time: number, spb: number): void {
    const swing = STYLES.blues.swing;
    if (!onBeat) {
      // Off-beat eighth is delayed to the triplet position
      this.hat(time + (swing - 0.5) * spb, 0.05);
      return;
    }
    this.hat(time, 0.08);
    if (beatIdx === 0 || beatIdx === 2) this.kick(time, beatIdx === 0 ? 0.85 : 0.6);
    if (beatIdx === 1 || beatIdx === 3) this.snare(time, 0.24);

    const boogie = bar % 2 === 0 ? [0, 4, 7, 9] : [10, 9, 7, 4];
    this.bass(time, 36 + root + boogie[beatIdx % 4], spb * 0.85, 0.3);

    if (beatIdx === 1 || beatIdx === 3) {
      // Dominant seventh voicing: 3rd, 5th, b7 above the root
      for (const iv of [4, 7, 10]) this.piano(time, 60 + ((root + iv) % 12), spb * 0.5);
    }
  }

  /** Ragtime "oom-pah": bass note on 1 and 3, piano chord on 2 and 4 – no drums. */
  private ragtimeStep(s: StepInfo): void {
    if (!s.onBeat) return;
    const root = 36 + s.chord.root;
    if (s.beatIdx === 0) this.bass(s.time, root, s.spb * 0.8, 0.34);
    else if (s.beatIdx === 2) this.bass(s.time, root + 7 > 47 ? root - 5 : root + 7, s.spb * 0.8, 0.3);
    else this.pianoChord(s.chord, s.time, s.spb * 0.6, 0.05);
  }

  /**
   * Dixieland two-beat: the tuba plays root and fifth on 1 and 3, the banjo strums
   * every beat (accent on 2 and 4), the drummer keeps it light: kick on 1 and 3,
   * a soft snare and the hi-hat "chick" on 2 and 4, lightly swung off-beats.
   */
  private dixielandStep(s: StepInfo): void {
    const swing = STYLES.dixieland.swing;
    if (!s.onBeat) {
      this.hat(s.time + (swing - 0.5) * s.spb, 0.035);
      return;
    }
    const root = 36 + s.chord.root;
    if (s.beatIdx === 0) this.tuba(s.time, root, s.spb * 0.9);
    else if (s.beatIdx === 2) this.tuba(s.time, root + 7 > 47 ? root - 5 : root + 7, s.spb * 0.9);
    this.banjo(s.chord, s.time, s.beatIdx === 1 || s.beatIdx === 3 ? 1 : 0.7);
    if (s.beatIdx === 0 || s.beatIdx === 2) this.kick(s.time, 0.5);
    else {
      this.snare(s.time, 0.14);
      this.hat(s.time, 0.07);
    }
  }

  /**
   * Swing: ride cymbal "ding – ding-a – ding – ding-a" (swung), hi-hat on 2 and 4,
   * walking bass (one note per beat, approaching the next chord) and soft
   * piano chords on every beat.
   */
  private swingStep(s: StepInfo): void {
    const swing = STYLES.swing.swing;
    if (!s.onBeat) {
      if (s.beatIdx === 1 || s.beatIdx === 3) this.ride(s.time + (swing - 0.5) * s.spb, 0.05);
      return;
    }
    this.ride(s.time, 0.08);
    if (s.beatIdx === 1 || s.beatIdx === 3) this.hat(s.time, 0.07);
    this.kick(s.time, 0.18);
    this.walkingBass(s);
    this.pianoChord(s.chord, s.time, s.spb * 0.35, 0.03);
  }

  /** Rock 'n' roll: straight eighths, hard backbeat, boogie bass and pounding piano. */
  private rockStep(s: StepInfo): void {
    this.hat(s.time, s.onBeat ? 0.09 : 0.06);
    const boogie = s.bar % 2 === 0 ? [0, 4, 7, 9] : [10, 9, 7, 4];
    this.bass(s.time, 36 + s.chord.root + boogie[s.beatIdx % 4], s.spb * 0.42, 0.26);
    this.pianoChord(s.chord, s.time, s.spb * 0.3, s.onBeat ? 0.035 : 0.025);
    if (!s.onBeat) {
      if (s.beatIdx === 2) this.kick(s.time, 0.5);
      return;
    }
    if (s.beatIdx === 0 || s.beatIdx === 2) this.kick(s.time, 0.85);
    if (s.beatIdx === 1 || s.beatIdx === 3) this.snare(s.time, 0.38);
  }

  /** Ska: guitar/piano "skank" on every off-beat, walking bass, rimshot on 2 and 4. */
  private skaStep(s: StepInfo): void {
    if (!s.onBeat) {
      this.skank(s.chord, s.time);
      this.hat(s.time, 0.07);
      return;
    }
    if (s.beatIdx === 0 || s.beatIdx === 2) this.kick(s.time, 0.7);
    if (s.beatIdx === 1 || s.beatIdx === 3) this.rim(s.time, 0.3);
    this.walkingBass(s);
  }

  /**
   * Reggae one drop: kick and rimshot only on beat 3, skank on 2 and 4,
   * "bubble" organ on the off-beats, a deep bass that leaves space.
   */
  private reggaeStep(s: StepInfo): void {
    const root = 36 + s.chord.root;
    if (!s.onBeat) {
      this.organChord(s.chord, s.time, s.spb * 0.3);
      if (s.beatIdx === 2) this.bass(s.time, root + 7 > 47 ? root - 5 : root + 7, s.spb * 0.9, 0.3);
      return;
    }
    this.hat(s.time, 0.05);
    if (s.beatIdx === 2) {
      this.kick(s.time, 0.9);
      this.rim(s.time, 0.3);
    }
    if (s.beatIdx === 1 || s.beatIdx === 3) this.skank(s.chord, s.time);
    if (s.beatIdx === 0) this.bass(s.time, root, s.spb * 1.4, 0.36);
  }

  /**
   * Funk: 16th-note hi-hats, a big kick on "the One", syncopated octave bass
   * and short muted guitar stabs on the 16ths in between.
   */
  private funkStep(s: StepInfo): void {
    const sixteenth = s.spb / 4;
    this.hat(s.time, s.onBeat ? 0.08 : 0.06);
    this.hat(s.time + sixteenth, 0.035);
    this.guitarStab(s.chord, s.time + sixteenth);
    const root = 36 + s.chord.root;
    const eighth = s.beatIdx * 2 + (s.onBeat ? 0 : 1);
    // Bass pattern over one bar (eighth notes): root, -, octave, root, -, root, octave, -
    const pattern = [0, null, 12, 0, null, 0, 12, null];
    const iv = pattern[eighth % 8];
    if (iv !== null) this.bass(s.time, root + iv, s.spb * 0.35, eighth === 0 ? 0.4 : 0.28);
    if (!s.onBeat) {
      if (s.beatIdx === 1) this.kick(s.time, 0.6);
      return;
    }
    if (s.beatIdx === 0) this.kick(s.time, 1.0);
    if (s.beatIdx === 2) this.kick(s.time, 0.55);
    if (s.beatIdx === 1 || s.beatIdx === 3) this.snare(s.time, 0.34);
  }

  /**
   * Hip-hop "boom bap": a deep drum-machine kick ("boom"), a hard snare on 2 and 4
   * ("bap"), lazily swung hi-hats, a bass that follows the kick and soft piano
   * chords like a sampled loop. Every fourth bar ends with a record scratch.
   */
  private hiphopStep(s: StepInfo): void {
    const swing = STYLES.hiphop.swing;
    const time = s.onBeat ? s.time : s.time + (swing - 0.5) * s.spb;
    const root = 36 + s.chord.root;
    const eighth = s.beatIdx * 2 + (s.onBeat ? 0 : 1);
    this.hat(time, s.onBeat ? 0.055 : 0.035);
    // Kick on 1, the "and" of 2 and (every other bar) the "and" of 3
    const kicks = s.bar % 2 === 0 ? [0, 3] : [0, 3, 5];
    if (kicks.includes(eighth)) {
      this.machineKick(time, 0.95, 0.55);
      this.synthBass(time, root, s.spb * 0.9, 0.3);
    }
    if (eighth === 2 || eighth === 6) this.snare(time, 0.42);
    // The "sampled" piano loop: a chord on 1 and a lazy one on the "and" of 3
    if (eighth === 0) this.pianoChord(s.chord, time, s.spb * 1.4, 0.03);
    if (eighth === 5) this.pianoChord(s.chord, time, s.spb * 0.8, 0.022);
    if (s.bar % 4 === 3 && eighth === 7) this.scratch(time, s.spb * 0.45);
  }

  /**
   * House: "four-on-the-floor" – a kick on every beat –, the open hi-hat on every
   * off-beat, clap on 2 and 4, a bouncing off-beat bass and short synth stabs.
   */
  private electronicStep(s: StepInfo): void {
    const root = 36 + s.chord.root;
    if (s.onBeat) {
      this.machineKick(s.time, 0.9, 0.25);
      if (s.beatIdx === 1 || s.beatIdx === 3) this.clap(s.time, 0.3);
      // Quiet closed hi-hat on the sixteenths before the off-beat
      this.hat(s.time + s.spb / 4, 0.02);
      return;
    }
    this.openHat(s.time, 0.06);
    this.synthBass(s.time, root + 12, s.spb * 0.4, 0.26);
    if (s.beatIdx === 1 || s.beatIdx === 3) this.synthStab(s.chord, s.time, s.spb * 0.35);
    this.hat(s.time + s.spb / 4, 0.02);
  }

  /**
   * Drum-machine kick (like the famous 808/909 boxes): a sine that drops quickly in pitch.
   * Always synthesized – it *is* an electronic sound, also in "real instruments" mode.
   */
  private machineKick(time: number, peak: number, decay: number): void {
    const ctx = this.engine.ctx;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(130, time);
    o.frequency.exponentialRampToValueAtTime(45, time + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    o.connect(g).connect(this.engine.musicBus);
    o.start(time);
    o.stop(time + decay + 0.02);
  }

  /** Hand clap: a recorded clap, or three short noise bursts close together. */
  private clap(time: number, peak: number): void {
    if (this.sampled?.playDrum('clap', time, peak * 2, this.engine.musicBus)) return;
    for (let i = 0; i < 3; i++) this.noiseHit(time + i * 0.011, 'bandpass', 1400, peak * (i === 2 ? 1 : 0.6), i === 2 ? 0.12 : 0.02);
  }

  private openHat(time: number, peak: number): void {
    this.noiseHit(time, 'highpass', 6500, peak, 0.14);
  }

  /** Synth bass: a filtered sawtooth (electronic styles). */
  private synthBass(time: number, midi: number, dur: number, peak: number): void {
    const ctx = this.engine.ctx;
    const g = this.envGain(time, peak, 0.005, Math.max(0, dur - 0.08), 0.06);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, time);
    f.frequency.exponentialRampToValueAtTime(220, time + dur);
    f.connect(g);
    g.connect(this.engine.musicBus);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = midiToFreq(midi);
    o.connect(f);
    o.start(time);
    o.stop(time + dur + 0.1);
  }

  /** Short synth chord whose filter closes quickly ("stab"). */
  private synthStab(chord: Chord, time: number, dur: number): void {
    const ctx = this.engine.ctx;
    const g = this.envGain(time, 0.035, 0.004, dur * 0.3, dur * 0.7);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 4;
    f.frequency.setValueAtTime(3000, time);
    f.frequency.exponentialRampToValueAtTime(500, time + dur);
    f.connect(g);
    g.connect(this.engine.musicBus);
    for (const m of voiceChord(chord, 60)) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midiToFreq(m);
      o.connect(f);
      o.start(time);
      o.stop(time + dur + 0.05);
    }
  }

  /** DJ scratch: noise through a filter that sweeps up and down, like a record pulled back and forth. */
  private scratch(time: number, dur: number): void {
    const ctx = this.engine.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.engine.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 6;
    f.frequency.setValueAtTime(500, time);
    f.frequency.exponentialRampToValueAtTime(2600, time + dur * 0.4);
    f.frequency.exponentialRampToValueAtTime(400, time + dur);
    const g = this.envGain(time, 0.12, 0.01, dur * 0.6, dur * 0.3);
    src.connect(f).connect(g).connect(this.engine.musicBus);
    src.start(time);
    src.stop(time + dur + 0.05);
  }

  /** One walking-bass note per beat: root, third, fifth, then a half step below the next root. */
  private walkingBass(s: StepInfo): void {
    const root = 36 + s.chord.root;
    const third = s.chord.pcs[1] - s.chord.root;
    const fifth = s.chord.pcs[2] - s.chord.root;
    const steps = [0, (third + 12) % 12, (fifth + 12) % 12];
    let midi: number;
    if (s.beatIdx < 3) midi = root + steps[s.beatIdx];
    else {
      const nextRoot = 36 + s.next.root;
      midi = (nextRoot > root + 6 ? nextRoot - 12 : nextRoot) - 1;
    }
    this.bass(s.time, midi, s.spb * 0.85, 0.3);
  }

  private pianoChord(chord: Chord, time: number, dur: number, peak: number): void {
    // (each note goes through piano(), which picks samples or synthesis)
    for (const m of voiceChord(chord, 57)) this.piano(time, m, dur, peak);
  }

  /** Short, bright chord on the off-beat (ska/reggae guitar "skank"). */
  private skank(chord: Chord, time: number): void {
    const sb = this.sampled;
    if (sb) {
      for (const m of voiceChord(chord, 60)) sb.playNote('guitar', m, time, 0.11, 0.13, this.engine.musicBus);
      return;
    }
    const ctx = this.engine.ctx;
    const g = this.envGain(time, 0.035, 0.003, 0.02, 0.07);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1600;
    f.Q.value = 0.8;
    f.connect(g);
    g.connect(this.engine.musicBus);
    for (const m of voiceChord(chord, 60)) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midiToFreq(m);
      o.connect(f);
      o.start(time);
      o.stop(time + 0.12);
    }
  }

  /** Very short muted guitar chord (funk "chicken scratch"). */
  private guitarStab(chord: Chord, time: number): void {
    const sb = this.sampled;
    if (sb) {
      for (const m of voiceChord(chord, 64)) sb.playNote('clavinet', m, time, 0.07, 0.08, this.engine.musicBus);
      return;
    }
    const ctx = this.engine.ctx;
    const g = this.envGain(time, 0.018, 0.002, 0.01, 0.04);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2200;
    f.connect(g);
    g.connect(this.engine.musicBus);
    for (const m of voiceChord(chord, 64)) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midiToFreq(m);
      o.connect(f);
      o.start(time);
      o.stop(time + 0.06);
    }
  }

  /** Soft organ chord (reggae "bubble"): stacked sine partials. */
  private organChord(chord: Chord, time: number, dur: number): void {
    const sb = this.sampled;
    if (sb) {
      for (const m of voiceChord(chord, 55)) sb.playNote('organ', m, time, dur, 0.07, this.engine.musicBus);
      return;
    }
    const ctx = this.engine.ctx;
    const g = this.envGain(time, 0.025, 0.01, Math.max(0, dur - 0.05), 0.05);
    g.connect(this.engine.musicBus);
    for (const m of voiceChord(chord, 55)) {
      for (const mult of [1, 2]) {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = midiToFreq(m) * mult;
        o.connect(g);
        o.start(time);
        o.stop(time + dur + 0.1);
      }
    }
  }

  /** Ride cymbal: long, bright noise. */
  private ride(time: number, peak: number): void {
    if (this.sampled?.playDrum('ride', time, peak * 3, this.engine.musicBus)) return;
    this.noiseHit(time, 'highpass', 5000, peak, 0.35);
  }

  /** Rimshot / cross-stick: short, high click. */
  private rim(time: number, peak: number): void {
    if (this.sampled?.playDrum('rim', time, peak * 2, this.engine.musicBus)) return;
    this.noiseHit(time, 'bandpass', 3200, peak, 0.04);
  }

  /** Short percussive piano-like tone (triangle + sine, quick decay). */
  private piano(time: number, midi: number, dur: number, peak = 0.05): void {
    if (this.sampled?.playNote('piano', midi, time, dur, peak * 3.5, this.engine.musicBus, this.engine.reverbSend)) return;
    const ctx = this.engine.ctx;
    const f = midiToFreq(midi);
    const g = this.envGain(time, peak, 0.005, Math.max(0, dur * 0.3), dur * 0.9);
    g.connect(this.engine.musicBus);
    g.connect(this.engine.reverbSend);
    for (const [type, mult] of [['triangle', 1], ['sine', 2]] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f * mult;
      o.connect(g);
      o.start(time);
      o.stop(time + dur * 1.4);
    }
  }

  private envGain(time: number, peak: number, attack: number, hold: number, release: number): GainNode {
    const g = this.engine.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(peak, time + attack);
    g.gain.setValueAtTime(peak, time + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, time + attack + hold + release);
    return g;
  }

  private pad(time: number, midi: number, dur: number): void {
    // With samples, the classic pad becomes a sustained piano chord
    if (this.sampled?.playNote('piano', midi, time, dur, 0.16, this.engine.musicBus, this.engine.reverbSend)) return;
    const ctx = this.engine.ctx;
    const f = midiToFreq(midi);
    const g = this.envGain(time, 0.05, 0.12, Math.max(0, dur - 0.2), 0.35);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1300;
    filter.connect(g);
    g.connect(this.engine.musicBus);
    g.connect(this.engine.reverbSend);
    for (const det of [-8, 8]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(filter);
      o.start(time);
      o.stop(time + dur + 0.5);
    }
  }

  /**
   * Tuba (Dixieland bass): a round, slightly buzzy brass tone. There is no tuba
   * sample, so with "real instruments" the upright bass plays these notes.
   */
  private tuba(time: number, midi: number, dur: number): void {
    if (this.sampled) {
      this.bass(time, midi, dur, 0.34);
      return;
    }
    const ctx = this.engine.ctx;
    const g = this.envGain(time, 0.26, 0.03, Math.max(0, dur - 0.18), 0.12);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 520;
    f.Q.value = 1.2;
    f.connect(g);
    g.connect(this.engine.musicBus);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = midiToFreq(midi);
    o.connect(f);
    o.start(time);
    o.stop(time + dur + 0.2);
  }

  /** Banjo strum: a bright, quickly fading chord, the notes a few milliseconds apart. */
  private banjo(chord: Chord, time: number, accent: number): void {
    const notes = voiceChord(chord, 62);
    const sb = this.sampled;
    if (sb) {
      notes.forEach((m, i) => sb.playNote('guitar', m, time + i * 0.012, 0.16, 0.1 * accent, this.engine.musicBus));
      return;
    }
    const ctx = this.engine.ctx;
    notes.forEach((m, i) => {
      const t0 = time + i * 0.012;
      const g = this.envGain(t0, 0.03 * accent, 0.002, 0.01, 0.16);
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 900;
      f.connect(g);
      g.connect(this.engine.musicBus);
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = midiToFreq(m);
      o.connect(f);
      o.start(t0);
      o.stop(t0 + 0.22);
    });
  }

  private bass(time: number, midi: number, dur: number, peak = 0.32): void {
    if (this.sampled?.playNote(this.bassInstrument, midi, time, dur, peak * 1.6, this.engine.musicBus)) return;
    const ctx = this.engine.ctx;
    const g = this.envGain(time, peak, 0.01, Math.max(0, dur - 0.15), 0.12);
    g.connect(this.engine.musicBus);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = midiToFreq(midi);
    o.connect(g);
    o.start(time);
    o.stop(time + dur + 0.2);
  }

  private kick(time: number, peak: number): void {
    if (this.sampled?.playDrum('kick', time, peak * 1.1, this.engine.musicBus)) return;
    const ctx = this.engine.ctx;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(150, time);
    o.frequency.exponentialRampToValueAtTime(40, time + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
    o.connect(g).connect(this.engine.musicBus);
    o.start(time);
    o.stop(time + 0.32);
  }

  private noiseHit(time: number, type: BiquadFilterType, freq: number, peak: number, decay: number): void {
    const ctx = this.engine.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.engine.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    src.connect(f).connect(g).connect(this.engine.musicBus);
    src.start(time, Math.random() * 0.5);
    src.stop(time + decay + 0.02);
  }

  private snare(time: number, peak: number): void {
    if (this.sampled?.playDrum('snare', time, peak * 1.8, this.engine.musicBus)) return;
    this.noiseHit(time, 'bandpass', 1800, peak, 0.16);
  }

  private hat(time: number, peak: number): void {
    if (this.sampled?.playDrum('hat', time, peak * 3, this.engine.musicBus)) return;
    this.noiseHit(time, 'highpass', 7000, peak, 0.045);
  }

  private click(time: number, accent: boolean): void {
    const ctx = this.engine.ctx;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = accent ? 1600 : 1000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    o.connect(g).connect(this.engine.musicBus);
    o.start(time);
    o.stop(time + 0.08);
  }
}
