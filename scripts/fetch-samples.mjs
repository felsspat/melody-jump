#!/usr/bin/env node
// Downloads the instrument samples used by the optional "samples" sound mode,
// verifies every note's pitch, trims/encodes them into small mono MP3s and
// writes public/samples/manifest.json.
//
// Sources (see CREDITS.md):
//   - VCSL (Versilian Community Sample Library), CC0 – piano, sax, harmonica, drums
//   - Drum-set kick "drum_bass_hard" by menegass (freesound.org #100051), CC0, via the Sonic Pi sample folder
//   - FluidR3_GM soundfont rendered by midi-js-soundfonts, CC BY 3.0 – guitars, basses, organ, trumpet, clavinet
//
// Usage (needs Node 18+ and ffmpeg; run inside WSL for this project):
//   node scripts/fetch-samples.mjs

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = 'public/samples';
const TMP = join(tmpdir(), 'melody-jump-samples');
const VCSL = 'https://raw.githubusercontent.com/sgossner/VCSL/master/';
const FLUID = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/';

const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
/** Scientific pitch name (C4 = 60) -> MIDI */
const midiOf = (name) => {
  const m = /^([A-G][b#]?)(-?\d)$/.exec(name);
  return 12 * (Number(m[2]) + 1) + PC[m[1]];
};

// ---- What to fetch -------------------------------------------------------

/** Melodic instruments: id -> { license, source, maxSeconds, notes: [{ url, expectedMidi }] } */
const MELODIC = {};

/**
 * `pattern` contains {n} (note name) and optionally {v} (velocity layer, e.g. vl2).
 * `layers` maps extra dynamics to VCSL layers, e.g. { soft: 'vl1', loud: 'vl3' }.
 */
function vcsl(id, dir, pattern, names, maxSeconds, main = 'vl2', layers = {}) {
  const url = (n, v) => VCSL + encodeURI(dir + pattern.replace('{n}', n).replace('{v}', v)).replace(/,/g, '%2C').replace(/#/g, '%23');
  MELODIC[id] = {
    license: 'CC0',
    source: 'VCSL',
    maxSeconds,
    // VCSL names notes one octave lower than scientific pitch (its "C4" sounds as C5 = MIDI 72),
    // which the pitch check below confirmed. We correct for that here.
    notes: [
      ...names.map((n) => ({ url: url(n, main), expected: midiOf(n) + 12 })),
      ...Object.entries(layers).flatMap(([layer, v]) => names.map((n) => ({ url: url(n, v), expected: midiOf(n) + 12, layer }))),
    ],
  };
}

function fluid(id, instrument, low, high, maxSeconds) {
  const names = [];
  for (let midi = low; midi <= high; midi += 3) {
    const pc = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][midi % 12];
    names.push(pc + (Math.floor(midi / 12) - 1));
  }
  MELODIC[id] = {
    license: 'CC BY 3.0',
    source: 'FluidR3_GM',
    maxSeconds,
    notes: names.map((n) => ({ url: `${FLUID}${instrument}-mp3/${n}.mp3`, expected: midiOf(n) })),
  };
}

// Piano and sax also get softer/louder recordings (velocity layers) for the player
vcsl('piano', 'Chordophones/Zithers/Upright Piano, Yamaha/Sustains/', 'Upright1_Sus_{n}_{v}_rr1.wav', ['C2', 'G2', 'C3', 'G3', 'C4', 'G4', 'C5', 'G5'], 3, 'vl2', { soft: 'vl1', loud: 'vl3' });
vcsl('sax', 'Aerophones/Reed Aerophones/Tenor Saxophone/Non-Vibrato/', 'BrettTenor_NV_Main_{n}_{v}_rr1.wav', ['C2', 'E2', 'G#2', 'C3', 'E3', 'G#3', 'C4', 'E4'], 2.5, 'vl2', { loud: 'vl3' });
vcsl('harmonica', 'Aerophones/Free Aerophones/Harmonica-Hohner-Special20-C/Sustains/Normal/', 'Hohner-Special20_Normal_{n}.wav', ['C3', 'E3', 'C4', 'E4', 'G4', 'C5', 'E5'], 2.5);
fluid('guitar', 'electric_guitar_clean', 40, 88, 3);
fluid('overdrive', 'overdriven_guitar', 40, 88, 3);
fluid('bass', 'electric_bass_finger', 28, 64, 2.5);
fluid('uprightBass', 'acoustic_bass', 28, 64, 2.5);
fluid('organ', 'drawbar_organ', 36, 96, 3);
fluid('trumpet', 'trumpet', 52, 88, 2.5);
fluid('clavinet', 'clavinet', 36, 84, 2);

/** One-shot drum samples (CC0): id -> [VCSL path or full URL, maxSeconds] */
const DRUMS = {
  // Drum-set kick (VCSL only has a concert bass drum, which booms too long for a band)
  kick: ['https://raw.githubusercontent.com/sonic-pi-net/sonic-pi/dev/etc/samples/drum_bass_hard.flac', 0.45],
  snare: ['Membranophones/Struck Membranophones/Snare Drum, Modern 1/Snare2_HitSN_v5_rr1_Mid.wav', 0.6],
  rim: ['Membranophones/Struck Membranophones/Snare Drum, Modern 1/Snare2_stick_v1_rr1_Mid.wav', 0.25],
  hat: ['Idiophones/Struck Idiophones/Hi-Hat Cymbal/HiHat_HitC_v3_rr1_Mid.wav', 0.3],
  ride: ['Idiophones/Struck Idiophones/Suspended Cymbal 1/susCymb1_hit_stick_mp1.wav', 1.5],
  clap: ['Idiophones/Struck Idiophones/Claps/Clap_rr1.wav', 0.5],
};

// ---- Helpers -------------------------------------------------------------

async function download(url, file) {
  const res = await fetch(url, { headers: { 'User-Agent': 'melody-jump-sample-fetcher' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

/** Trims leading silence, cuts to maxSeconds with a fade-out, encodes a mono MP3. */
function encode(input, output, maxSeconds) {
  const fade = Math.min(0.4, maxSeconds / 3);
  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y', '-i', input,
    '-af', `silenceremove=start_periods=1:start_threshold=-50dB,atrim=0:${maxSeconds},afade=t=out:st=${maxSeconds - fade}:d=${fade}`,
    '-ac', '1', '-ar', '44100', '-b:a', '96k', output,
  ]);
}

/** Fundamental frequency (YIN) of the first second after the attack, as a MIDI number. */
function detectMidi(input) {
  const raw = join(TMP, 'pitch.raw');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', input, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB', '-ac', '1', '-ar', '44100', '-f', 'f32le', raw]);
  const buf = readFileSync(raw);
  const data = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4));
  const rate = 44100, W = 4096, maxLag = 2200;
  const start = Math.min(Math.floor(rate * 0.25), Math.max(0, data.length - W - maxLag - 1));
  const x = data.subarray(start, start + W + maxLag);
  const d = new Float64Array(maxLag);
  for (let tau = 1; tau < maxLag; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) {
      const v = x[i] - x[i + tau];
      s += v * v;
    }
    d[tau] = s;
  }
  let running = 0;
  let tauFound = -1;
  const cmnd = new Float64Array(maxLag);
  for (let tau = 1; tau < maxLag; tau++) {
    running += d[tau];
    cmnd[tau] = (d[tau] * tau) / (running || 1);
  }
  for (let tau = 15; tau < maxLag - 1; tau++) {
    if (cmnd[tau] < 0.15) {
      while (tau + 1 < maxLag && cmnd[tau + 1] < cmnd[tau]) tau++;
      tauFound = tau;
      break;
    }
  }
  if (tauFound < 0) return NaN;
  let f = rate / tauFound;
  // YIN sometimes locks onto the 2nd harmonic (e.g. saxophone). If the sub-octave
  // carries noticeable energy, that is the real fundamental.
  const energy = (freq) => {
    const w = (2 * Math.PI * freq) / rate;
    const c = 2 * Math.cos(w);
    let s1 = 0;
    let s2 = 0;
    const n = Math.min(32768, data.length - start);
    for (let i = 0; i < n; i++) {
      const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
      const s = data[start + i] * hann + c * s1 - s2;
      s2 = s1;
      s1 = s;
    }
    return s1 * s1 + s2 * s2 - c * s1 * s2;
  };
  if (f > 60 && energy(f / 2) > 0.005 * energy(f)) f /= 2;
  return 69 + 12 * Math.log2(f / 440);
}

// ---- Main ----------------------------------------------------------------

rmSync(OUT, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const manifest = { instruments: {}, drums: {} };
const problems = [];

for (const [id, inst] of Object.entries(MELODIC)) {
  mkdirSync(join(OUT, id), { recursive: true });
  manifest.instruments[id] = { license: inst.license, source: inst.source, notes: {} };
  for (const note of inst.notes) {
    const src = join(TMP, 'src' + (note.url.endsWith('.mp3') ? '.mp3' : '.wav'));
    try {
      await download(note.url, src);
    } catch (e) {
      problems.push(`${id}: download failed (${e.message})`);
      continue;
    }
    // The (corrected) file names are trusted. Pitch detection only guards against
    // mislabeled files: it often lands an octave off (strong harmonics, sub-octave
    // organ registers), so only a wrong pitch class makes us skip a file.
    const detected = detectMidi(src);
    const midi = note.expected;
    if (Number.isNaN(detected)) {
      problems.push(`${id}: ${midi} pitch not measurable (kept)`);
    } else {
      const offPc = Math.abs(((((detected - midi) % 12) + 18) % 12) - 6);
      if (offPc > 0.6) {
        problems.push(`${id}: expected MIDI ${midi}, measured ${detected.toFixed(2)} – wrong pitch class, skipped (${note.url})`);
        continue;
      }
      if (Math.abs(detected - midi) > 0.6) problems.push(`${id}: ${midi} measured ${detected.toFixed(2)} (octave ambiguity, kept)`);
    }
    // Velocity layers go next to the normal recording: piano/soft-60.mp3, piano/loud-60.mp3
    const file = note.layer ? `${id}/${note.layer}-${midi}.mp3` : `${id}/${midi}.mp3`;
    encode(src, join(OUT, file), inst.maxSeconds);
    if (note.layer) {
      const layers = (manifest.instruments[id].layers ??= {});
      (layers[note.layer] ??= {})[midi] = file;
    } else {
      manifest.instruments[id].notes[midi] = file;
    }
    process.stdout.write(`${id} ${note.layer ?? ''} ${midi} (${detected.toFixed(2)}) ✓\n`);
  }
}

mkdirSync(join(OUT, 'drums'), { recursive: true });
for (const [id, [path, maxSeconds]] of Object.entries(DRUMS)) {
  const url = path.startsWith('https:') ? path : VCSL + encodeURI(path).replace(/,/g, '%2C').replace(/#/g, '%23');
  const src = join(TMP, 'drum' + (url.endsWith('.flac') ? '.flac' : '.wav'));
  await download(url, src);
  const file = `drums/${id}.mp3`;
  encode(src, join(OUT, file), maxSeconds);
  manifest.drums[id] = file;
  process.stdout.write(`drum ${id} ✓\n`);
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
rmSync(TMP, { recursive: true, force: true });
console.log('\nDone. Notes:', problems.length ? '\n  ' + problems.join('\n  ') : 'none');
