// Records a demo video of Melody Jump in headless Chromium while a bot plays.
// Picture = the game canvas (captureStream), sound = everything the game sends to the speakers.
// Needs the dev server (the bot reaches the game through the dev-only hook window.__melodyJump)
// and the tools from setup.sh. See SKILL.md.
//
// node record.mjs [--level folk-2 | --endless reggae] [--lang en] [--tempo original] [--sound samples]
//                 [--fill auto|none] [--seconds 100] [--coach off] [--out video.webm] [--url http://localhost:5173/]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TOOLS = process.env.MELODY_VIDEO_TOOLS ?? path.join(os.homedir(), '.cache', 'melody-jump-video');
const { chromium } = createRequire(path.join(TOOLS, 'package.json'))('playwright');

// ---------- Options ----------
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const endless = opt('endless', null);
const level = endless ? null : opt('level', 'folk-2');
const lang = opt('lang', 'en');
const tempo = opt('tempo', 'original');
const sound = opt('sound', 'samples');
const fill = opt('fill', 'auto');
const seconds = Number(opt('seconds', endless ? 100 : 600)); // campaign: until the level ends
const coach = opt('coach', 'off') === 'on';
const out = opt('out', 'demo.webm');
const baseUrl = opt('url', 'http://localhost:5173/');

const browser = await chromium.launch({
  // The full Chromium decodes the MP3 samples; the slim "headless shell" does not
  channel: 'chromium',
  args: ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('console', (m) => {
  if (!m.text().startsWith('[vite]')) console.log('[page]', m.text());
});
page.on('pageerror', (e) => console.log('[page error]', e.message));

const fd = fs.openSync(out, 'w');
await page.exposeFunction('__saveChunk', (b64) => {
  fs.writeSync(fd, Buffer.from(b64, 'base64'));
});

await page.addInitScript(() => {
  // Without a sound card the fake output reports a latency that keeps growing, which would make
  // the game's clock jump and the bot's notes late. The recording taps the mixer before any
  // output, so the true latency here is 0.
  Object.defineProperty(AudioContext.prototype, 'outputLatency', { get: () => 0 });
  Object.defineProperty(AudioContext.prototype, 'baseLatency', { get: () => 0 });
  // Whatever is connected to the speakers is also sent to a recordable stream
  const orig = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    const r = orig.call(this, dest, ...rest);
    if (dest instanceof AudioDestinationNode) {
      const ctx = dest.context;
      if (!ctx.__rec) ctx.__rec = ctx.createMediaStreamDestination();
      orig.call(this, ctx.__rec);
      window.__recCtx = ctx;
    }
    return r;
  };
});

await page.goto(`${baseUrl}?lang=${lang}`);
await page.waitForFunction(() => !!window.__melodyJump, null, { timeout: 30000 });

await page.evaluate(
  ({ tempo, sound, coach }) => {
    const g = window.__melodyJump;
    g.changeTempo(tempo);
    g.changeSound(sound);
    g.coachOn = coach;
    g.guideOn = true;
    g.ensureEngine(); // creates the AudioContext now, so the recorder gets its audio track
  },
  { tempo, sound, coach },
);
if (sound === 'samples') {
  await page.waitForFunction(() => ['ready', 'failed'].includes(window.__melodyJump.sampleBank?.state), null, { timeout: 120000 });
  const state = await page.evaluate(() => window.__melodyJump.sampleBank.state);
  console.log('samples:', state);
  if (state !== 'ready') console.log('WARNING: samples did not load, the video uses the synthesizer');
}
await page.evaluate(() => window.__melodyJump.engine.resume());

/** Position of the level's chapter on the campaign map (asks the dev server for chapters.ts). */
async function chapterIndexOf(levelId) {
  return page.evaluate(async (id) => {
    const { CHAPTERS } = await import('/src/campaign/chapters.ts');
    const i = CHAPTERS.findIndex((c) => c.levels.some((l) => l.id === id));
    if (i < 0) throw new Error(`unknown level "${id}"`);
    return i;
  }, levelId);
}

const result = await page.evaluate(
  (o) =>
    new Promise((resolve) => {
      const g = window.__melodyJump;
      const canvas = document.getElementById('game');
      const actx = window.__recCtx;
      const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...actx.__rec.stream.getAudioTracks()]);
      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6, audioBitsPerSecond: 192e3 });
      let chain = Promise.resolve();
      rec.ondataavailable = (e) => {
        if (!e.data.size) return;
        chain = chain.then(async () => {
          const buf = new Uint8Array(await e.data.arrayBuffer());
          let s = '';
          for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
          await window.__saveChunk(btoa(s));
        });
      };

      // ---------- The bot: plays through the keyboard like a person would ----------
      const PIANO = { 0: 'KeyA', 1: 'KeyW', 2: 'KeyS', 3: 'KeyE', 4: 'KeyD', 5: 'KeyF', 6: 'KeyT', 7: 'KeyG', 8: 'KeyY', 9: 'KeyH', 10: 'KeyU', 11: 'KeyJ', 12: 'KeyK', 13: 'KeyO', 14: 'KeyL', 15: 'KeyP', 16: 'Semicolon' };
      const held = new Map();
      let last = 67;
      const press = (midi, holdMs, accent) => {
        const code = PIANO[midi - g.input.octaveBase];
        if (!code) return;
        if (held.has(code)) {
          clearTimeout(held.get(code));
          window.dispatchEvent(new KeyboardEvent('keyup', { code }));
        }
        window.dispatchEvent(new KeyboardEvent('keydown', { code, shiftKey: accent }));
        held.set(code, setTimeout(() => { window.dispatchEvent(new KeyboardEvent('keyup', { code })); held.delete(code); }, holdMs));
        last = midi;
      };
      const played = new WeakSet();
      const fillsDone = new Set();
      const bot = setInterval(() => {
        if (g.state !== 'playing') return;
        const beat = g.currentBeat();
        const spbMs = g.clock.secPerBeatAt(g.engine.audibleTime) * 1000;
        // 1) Hit every guide ring on time (in melody levels the rings are the melody itself)
        const targets = g.guide.targets;
        targets.forEach((t, i) => {
          if (played.has(t) || t.beat > beat + 0.005 || t.beat < beat - 0.15) return;
          played.add(t);
          const next = targets[i + 1];
          const gap = next ? next.beat - t.beat : 1;
          const pos = g.song.positionAt(t.beat);
          const accent = g.song.positionAt(t.beat).section.style === 'reggae' ? Math.round(pos.beatInBar) === 2 : Math.round(pos.beatInBar) === 0;
          press(t.midi, spbMs * Math.max(0.25, Math.min(1.5, gap * 0.85)), accent);
        });
        // 2) Without a melody: a chord tone on every off-beat (fits the grooves that reward the off-beat)
        if (o.fill === 'none') return;
        const k = Math.floor(beat);
        if (beat < 0 || beat - k < 0.495 || beat - k >= 0.6 || fillsDone.has(k)) return;
        fillsDone.add(k);
        const pos = g.song.positionAt(k + 0.5 + 0.12);
        if (pos.section.melody) return;
        const lo = g.input.octaveBase;
        const cands = [];
        for (let m = lo; m <= lo + 16; m++) if (pos.chord.pcs.includes(((m % 12) + 12) % 12) && m !== last) cands.push(m);
        cands.sort((a, b) => Math.abs(a - last) - Math.abs(b - last));
        if (cands.length) press(cands[Math.random() < 0.7 ? 0 : Math.min(1, cands.length - 1)], spbMs * 0.25, false);
      }, 3);

      const started = performance.now();
      const log = setInterval(() => {
        const secs = (performance.now() - started) / 1000;
        console.log(`t=${secs.toFixed(0)}s state=${g.state} bar=${g.lastBar} resonance=${g.resonance.toFixed(0)} score=${Math.floor(g.score)} lives=${g.player.lives}`);
      }, 5000);

      const finish = (why) => {
        clearInterval(bot);
        clearInterval(log);
        clearInterval(watch);
        rec.onstop = () =>
          chain.then(() =>
            resolve({ why, mime, score: Math.floor(g.score), bars: g.lastBar + 1, livesLost: g.livesLost, stars: g.state === 'levelComplete' ? g.lastStars : undefined }),
          );
        rec.stop();
      };

      // Title screen → menu of the mode → the run
      rec.start(1000);
      setTimeout(() => {
        if (o.endless) {
          g.endlessStyle = o.endless;
          g.openStyles();
        } else {
          // The campaign map, already on the level's chapter (chapter index = position in the map)
          g.openMap();
          if (typeof o.chapterIndex === 'number') g.mapChapter = o.chapterIndex;
        }
      }, 2500);
      setTimeout(() => (o.endless ? g.startEndless(o.endless) : g.startLevel(o.level)), 5000);
      const stopAt = setTimeout(() => finish('time'), 5000 + o.seconds * 1000);
      // Keep the level-complete / game-over screen a few seconds in the video
      const watch = setInterval(() => {
        if (g.state === 'levelComplete' || g.state === 'gameover') {
          clearInterval(watch);
          clearTimeout(stopAt);
          setTimeout(() => finish(g.state), 6000);
        }
      }, 200);
    }),
  { endless, level, fill, seconds, chapterIndex: level ? await chapterIndexOf(level) : undefined },
);
console.log('result:', JSON.stringify(result));
fs.closeSync(fd);
await browser.close();
