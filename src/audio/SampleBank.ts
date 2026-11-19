// Optional recorded instrument samples (piano, guitars, bass, organ, horns, drums).
// Files live in public/samples (see scripts/fetch-samples.mjs and CREDITS.md).
// Notes that weren't sampled are pitched from the nearest sample via playbackRate.
// Until everything is loaded (or if loading fails) the game keeps using the synthesizer.

import type { StyleId } from '../music/styles';

export type InstrumentId =
  | 'piano'
  | 'sax'
  | 'harmonica'
  | 'guitar'
  | 'overdrive'
  | 'bass'
  | 'uprightBass'
  | 'organ'
  | 'trumpet'
  | 'clavinet'
  | 'harpsichord'
  | 'banjo'
  | 'fiddle'
  | 'steelGuitar'
  | 'nylonGuitar'
  | 'bandoneon'
  | 'choir';

export type DrumId = 'kick' | 'snare' | 'rim' | 'hat' | 'ride' | 'clap';

/** Extra recordings of an instrument at another dynamic (piano and sax have them in VCSL). */
export type Layer = 'soft' | 'loud';

interface Manifest {
  instruments: Record<string, { notes: Record<string, string>; layers?: Partial<Record<Layer, Record<string, string>>> }>;
  drums: Record<string, string>;
}

export interface SampleVoice {
  /** Fades the note out starting at `time` (audio clock). */
  release(time: number): void;
}

/** Picks the sampled note closest to `midi` (prefers sampling down over up on ties). */
export function nearestSample(available: number[], midi: number): number | undefined {
  let best: number | undefined;
  for (const m of available) {
    if (best === undefined || Math.abs(m - midi) < Math.abs(best - midi) || (Math.abs(m - midi) === Math.abs(best - midi) && m > best)) {
      best = m;
    }
  }
  return best;
}

/** Which recording to use for a velocity: soft up to 0.45, loud from 0.8, otherwise the normal one. */
export function layerFor(velocity: number): Layer | undefined {
  if (velocity <= 0.45) return 'soft';
  if (velocity >= 0.8) return 'loud';
  return undefined;
}

export type SampleState = 'idle' | 'loading' | 'ready' | 'failed';

export class SampleBank {
  state: SampleState = 'idle';
  /** 0–1 while loading */
  progress = 0;
  private notes = new Map<string, Map<number, AudioBuffer>>();
  private drums = new Map<string, AudioBuffer>();
  private loading?: Promise<boolean>;

  constructor(
    private ctx: BaseAudioContext,
    private baseUrl = './samples/',
  ) {}

  get ready(): boolean {
    return this.state === 'ready';
  }

  /** Loads all samples once; resolves to false if anything essential is missing. */
  load(): Promise<boolean> {
    this.loading ??= this.doLoad();
    return this.loading;
  }

  private async doLoad(): Promise<boolean> {
    this.state = 'loading';
    try {
      const res = await fetch(this.baseUrl + 'manifest.json');
      if (!res.ok) throw new Error(`manifest: ${res.status}`);
      const manifest = (await res.json()) as Manifest;
      const jobs: { file: string; store: (b: AudioBuffer) => void }[] = [];
      for (const [id, inst] of Object.entries(manifest.instruments)) {
        const map = new Map<number, AudioBuffer>();
        this.notes.set(id, map);
        for (const [midi, file] of Object.entries(inst.notes)) jobs.push({ file, store: (b) => map.set(Number(midi), b) });
        // Softer / louder recordings are stored as "piano:soft", "piano:loud"
        for (const [layer, files] of Object.entries(inst.layers ?? {})) {
          const layerMap = new Map<number, AudioBuffer>();
          this.notes.set(`${id}:${layer}`, layerMap);
          for (const [midi, file] of Object.entries(files)) jobs.push({ file, store: (b) => layerMap.set(Number(midi), b) });
        }
      }
      for (const [id, file] of Object.entries(manifest.drums)) jobs.push({ file, store: (b) => this.drums.set(id, b) });

      // A single broken file must not switch off all instruments: it is skipped, and that
      // note is then played from the nearest other sample (or the synthesizer)
      let done = 0;
      const broken: string[] = [];
      await Promise.all(
        jobs.map(async (job) => {
          try {
            const r = await fetch(this.baseUrl + job.file);
            if (!r.ok) throw new Error(String(r.status));
            job.store(await this.ctx.decodeAudioData(await r.arrayBuffer()));
          } catch (e) {
            broken.push(`${job.file} (${e instanceof Error ? e.message : String(e)})`);
          }
          done++;
          this.progress = done / jobs.length;
        }),
      );
      if (broken.length) console.warn(`Skipped ${broken.length} sample(s) that could not be loaded:`, broken);
      if (broken.length === jobs.length) throw new Error('no sample could be loaded');
      this.state = 'ready';
      return true;
    } catch (e) {
      console.warn('Samples could not be loaded, using the synthesizer instead:', e);
      this.state = 'failed';
      // Allow another attempt later (e.g. the network was down for a moment)
      this.loading = undefined;
      return false;
    }
  }

  /**
   * Plays a pitched note. `duration` is how long the note is held (it is faded out
   * afterwards); pass Infinity and call release() for notes held by the player.
   * `velocity` (0–1) picks a softer or louder recording if the instrument has one:
   * a soft piano note sounds rounder, a hard one brighter – not just quieter.
   */
  playNote(
    instrument: InstrumentId,
    midi: number,
    time: number,
    duration: number,
    gain: number,
    destination: AudioNode,
    extraDestination?: AudioNode,
    velocity?: number,
  ): SampleVoice | undefined {
    const layer = velocity === undefined ? undefined : layerFor(velocity);
    const layered = layer ? this.notes.get(`${instrument}:${layer}`) : undefined;
    const map = layered?.size ? layered : this.notes.get(instrument);
    if (!this.ready || !map || map.size === 0) return undefined;
    const sampled = nearestSample([...map.keys()], midi)!;
    const buffer = map.get(sampled)!;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = Math.pow(2, (midi - sampled) / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(gain, time + 0.005);
    src.connect(g);
    g.connect(destination);
    if (extraDestination) g.connect(extraDestination);
    src.start(time);
    const length = buffer.duration / src.playbackRate.value;
    let released = false;
    const release = (t: number) => {
      if (released) return;
      released = true;
      const at = Math.max(t, time + 0.01);
      g.gain.cancelScheduledValues(at);
      g.gain.setValueAtTime(gain, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
      src.stop(Math.min(time + length, at + 0.2));
    };
    if (Number.isFinite(duration)) release(time + duration);
    else src.stop(time + length);
    return { release };
  }

  /** Plays a one-shot drum sample; returns false if samples aren't available. */
  playDrum(id: DrumId, time: number, gain: number, destination: AudioNode): boolean {
    const buffer = this.drums.get(id);
    if (!this.ready || !buffer) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(destination);
    src.start(time);
    return true;
  }
}

/**
 * Recorded instrument the player plays in each style ("samples" sound mode).
 * undefined = the synthesizer, which *is* the real instrument of electronic music.
 */
export const PLAYER_INSTRUMENTS: Record<StyleId, InstrumentId | undefined> = {
  classic: 'piano',
  baroque: 'harpsichord',
  // Gospel is sung: the player leads the choir
  gospel: 'choir',
  ragtime: 'piano',
  country: 'fiddle',
  // Bossa nova and son: the nylon-string guitar
  latin: 'nylonGuitar',
  blues: 'harmonica',
  // Dixieland is led by the trumpet (cornet); with no clarinet sample, that is the lead voice
  dixieland: 'trumpet',
  swing: 'sax',
  rock: 'overdrive',
  ska: 'trumpet',
  reggae: 'organ',
  funk: 'clavinet',
  // Hip-hop producers loop piano and Rhodes chords; the player plays the piano hook
  hiphop: 'piano',
  electronic: undefined,
};
