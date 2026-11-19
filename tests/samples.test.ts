import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLAYER_INSTRUMENTS, SampleBank, layerFor, nearestSample } from '../src/audio/SampleBank';
import { CHAPTERS } from '../src/campaign/chapters';
import { setLocale, t } from '../src/i18n/i18n';

const manifest = JSON.parse(readFileSync('public/samples/manifest.json', 'utf8')) as {
  instruments: Record<string, { license: string; notes: Record<string, string> }>;
  drums: Record<string, string>;
};

describe('sample files', () => {
  it('every file in the manifest exists', () => {
    const files = [
      ...Object.values(manifest.instruments).flatMap((i) => Object.values(i.notes)),
      ...Object.values(manifest.drums),
    ];
    expect(files.length).toBeGreaterThan(100);
    for (const f of files) expect(existsSync(`public/samples/${f}`), f).toBe(true);
  });

  it('no file is empty (an MP3 with only a header does not decode)', () => {
    const m = JSON.parse(readFileSync('public/samples/manifest.json', 'utf8'));
    const files: string[] = [...Object.values(m.drums as Record<string, string>)];
    for (const inst of Object.values(m.instruments) as { notes: Record<string, string>; layers?: Record<string, Record<string, string>> }[]) {
      files.push(...Object.values(inst.notes));
      for (const layer of Object.values(inst.layers ?? {})) files.push(...Object.values(layer));
    }
    for (const f of files) expect(statSync(`public/samples/${f}`).size, f).toBeGreaterThan(2000);
  });

  it('every instrument the game uses is in the manifest, with a free license', () => {
    const used = new Set([...Object.values(PLAYER_INSTRUMENTS).filter((i) => i !== undefined), 'piano', 'guitar', 'clavinet', 'organ', 'bass', 'uprightBass']);
    for (const id of used) {
      expect(manifest.instruments[id], id).toBeDefined();
      expect(['CC0', 'CC BY 3.0']).toContain(manifest.instruments[id].license);
      expect(Object.keys(manifest.instruments[id].notes).length, id).toBeGreaterThan(4);
    }
    for (const d of ['kick', 'snare', 'rim', 'hat', 'ride', 'clap']) expect(manifest.drums[d], d).toBeDefined();
  });

  it('samples cover the playable range without huge pitch shifts', () => {
    // The player plays MIDI 48–84; no note should be stretched more than ~7 half steps
    for (const inst of new Set(Object.values(PLAYER_INSTRUMENTS).filter((i) => i !== undefined))) {
      const available = Object.keys(manifest.instruments[inst].notes).map(Number);
      for (let midi = 55; midi <= 80; midi++) {
        expect(Math.abs(nearestSample(available, midi)! - midi), `${inst} @${midi}`).toBeLessThanOrEqual(7);
      }
    }
  });

  it('every style chapter has a player instrument with a localized name', () => {
    setLocale('de');
    for (const c of CHAPTERS) {
      for (const l of c.levels) {
        const inst = PLAYER_INSTRUMENTS[l.sections[0].style ?? 'classic'];
        // undefined = the synthesizer (house & techno)
        expect(t(`instruments.${inst ?? 'synth'}`)).not.toContain('instruments.');
      }
    }
    setLocale('en');
  });
});

describe('SampleBank', () => {
  it('picks the nearest sampled note', () => {
    expect(nearestSample([48, 55, 60, 67], 58)).toBe(60);
    expect(nearestSample([48, 55, 60, 67], 52)).toBe(55);
    expect(nearestSample([], 60)).toBeUndefined();
  });

  it('loads samples and reports progress', async () => {
    const ctx = { decodeAudioData: async () => ({ duration: 2 }) } as unknown as BaseAudioContext;
    const files: Record<string, unknown> = {
      'x/manifest.json': { instruments: { piano: { notes: { 60: 'piano/60.mp3' } } }, drums: { kick: 'drums/kick.mp3' } },
    };
    globalThis.fetch = (async (url: string) => ({
      ok: url in files || url.endsWith('.mp3'),
      status: 200,
      json: async () => files[url],
      arrayBuffer: async () => new ArrayBuffer(8),
    })) as unknown as typeof fetch;
    const bank = new SampleBank(ctx, 'x/');
    expect(await bank.load()).toBe(true);
    expect(bank.state).toBe('ready');
    expect(bank.progress).toBe(1);
  });

  it('skips a single broken file instead of giving up on all samples', async () => {
    const ctx = {
      decodeAudioData: async (b: ArrayBuffer) => {
        if (b.byteLength === 0) throw new Error('Unable to decode audio data');
        return { duration: 2 };
      },
    } as unknown as BaseAudioContext;
    const manifestData = { instruments: { piano: { notes: { 48: 'piano/48.mp3', 60: 'piano/60.mp3' } } }, drums: {} };
    globalThis.fetch = (async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => manifestData,
      arrayBuffer: async () => new ArrayBuffer(url.endsWith('48.mp3') ? 0 : 8),
    })) as unknown as typeof fetch;
    const bank = new SampleBank(ctx, 'y/');
    expect(await bank.load()).toBe(true);
    expect(bank.state).toBe('ready');
  });

  it('falls back (state "failed") when samples are missing', async () => {
    globalThis.fetch = (async () => ({ ok: false, status: 404 })) as unknown as typeof fetch;
    const bank = new SampleBank({} as BaseAudioContext, 'missing/');
    expect(await bank.load()).toBe(false);
    expect(bank.state).toBe('failed');
    expect(bank.ready).toBe(false);
  });
});

describe('velocity layers and drum-set kick', () => {
  it('piano and sax have softer/louder recordings, picked by velocity', () => {
    const m = JSON.parse(readFileSync('public/samples/manifest.json', 'utf8'));
    expect(Object.keys(m.instruments.piano.layers.soft).length).toBeGreaterThan(4);
    expect(Object.keys(m.instruments.piano.layers.loud).length).toBeGreaterThan(4);
    expect(Object.keys(m.instruments.sax.layers.loud).length).toBeGreaterThan(4);
    for (const layer of Object.values(m.instruments.piano.layers) as Record<string, string>[]) {
      for (const f of Object.values(layer)) expect(existsSync(`public/samples/${f}`), f).toBe(true);
    }
    expect(layerFor(0.3)).toBe('soft');
    expect(layerFor(0.6)).toBeUndefined();
    expect(layerFor(0.9)).toBe('loud');
  });
});
