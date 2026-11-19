// Game controller: wires together audio, music, scoring, world, input and rendering.

import { AudioEngine } from '../audio/AudioEngine';
import { Backing } from '../audio/Backing';
import { Clock } from '../audio/Clock';
import { PLAYER_INSTRUMENTS, SampleBank } from '../audio/SampleBank';
import { Sfx } from '../audio/Sfx';
import { Synth } from '../audio/Synth';
import { LOCALES, Locale, getLocale, setLocale, t } from '../i18n/i18n';
import { InputMapper, NoteRequest, setLaneRange } from '../input/InputMapper';
import { MidiInput } from '../input/MidiInput';
import { NoteExplanation, blockTip, diagnose, explainNote, monsterTip, summarize } from '../music/explain';
import { GUIDE_HIT_BONUS, HarmonyJudge, JudgedNote } from '../music/HarmonyJudge';
import { Section, SectionDef, Song, describeSection, sectionName } from '../music/Song';
import { Chord, pcName, pitchClass } from '../music/theory';
import { Button, Flash, Hud, HudView, STYLE_GRID_COLS } from '../render/Hud';
import { NoteParticles } from '../render/NoteParticles';
import { Popup, Renderer, groundY, playerScreenX } from '../render/Renderer';
import { Enemies } from '../world/Enemies';
import {
  BLOCK_HALF_BEATS,
  ENDLESS_STYLES,
  EndlessStyle,
  LevelGen,
  endlessIntro,
  isEndlessStyle,
  makeRng,
  makeSectionGenerator,
} from '../world/Level';
import { PLAYER_H, PLAYER_W, PX_PER_BEAT } from '../world/physics';
import { Player, PlayerEvent } from '../world/Player';
import { CreditsPanel } from '../ui/CreditsPanel';
import { TheoryPanel } from '../ui/TheoryPanel';
import { CHAPTERS, LevelDef, findLevel } from '../campaign/chapters';
import { loadProgress, recordResult, saveProgress, starsFor } from '../campaign/progress';
import { styleOf } from '../music/styles';
import { Guide } from './Guide';
import { STEPS, TUTORIAL_SECTION, Tutorial } from './Tutorial';

type State = 'title' | 'map' | 'styles' | 'playing' | 'paused' | 'gameover' | 'levelComplete';
type Mode = 'run' | 'tutorial' | 'campaign';
type SoundMode = 'synth' | 'samples';

/** Player-selectable game speed: scales all tempos and makes timing/guides more forgiving. */
export const TEMPOS = {
  slow: { factor: 0.75, toleranceSec: 0.1, guideStride: 2 },
  medium: { factor: 0.88, toleranceSec: 0.085, guideStride: 1 },
  original: { factor: 1, toleranceSec: 0.07, guideStride: 1 },
} as const;
export type TempoId = keyof typeof TEMPOS;

/**
 * A note reached by sliding the pointer is only judged once the pointer has rested on it this long
 * (or was lifted there). Lanes merely crossed on the way sound, but do not count.
 */
const GLIDE_SETTLE_SEC = 0.12;

interface PendingGlide {
  req: NoteRequest;
  beat: number;
  secPerBeat: number;
  /** When the note started (seconds) */
  at: number;
}

const MAX_VOLUME = 1.5;

/** Seconds after game over before its buttons react (a tap meant as a note must not restart). */
const GAME_OVER_CLICK_DELAY = 0.8;

/** The tutorial is always slow and forgiving. */
const TUTORIAL_TOLERANCE_SEC = 0.12;
const TUTORIAL_GUIDE_STRIDE = 2;

function isTempoId(v: string): v is TempoId {
  return v in TEMPOS;
}

// Settings remembered in the browser (optional – everything works without storage)
function load(key: string, fallback: string): string {
  try {
    return localStorage.getItem('melody-jump-' + key) ?? fallback;
  } catch {
    return fallback;
  }
}

/** A saved volume factor (1 = default mix). */
function loadVolume(key: string): number {
  const v = Number(load(key, '1'));
  return Number.isFinite(v) ? Math.max(0, Math.min(MAX_VOLUME, v)) : 1;
}

function save(key: string, value: string): void {
  try {
    localStorage.setItem('melody-jump-' + key, value);
  } catch {
    /* ignore */
  }
}

export class Game {
  private state: State = 'title';
  private mode: Mode = 'run';
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;

  private engine?: AudioEngine;
  private synth?: Synth;
  private sfx?: Sfx;
  private clock?: Clock;
  private backing?: Backing;

  private song!: Song;
  private level!: LevelGen;
  private player = new Player();
  private enemies = new Enemies();
  private judge = new HarmonyJudge();
  private particles = new NoteParticles();
  private renderer = new Renderer();
  private hud = new Hud();
  private guide = new Guide();
  private tutorial = new Tutorial();
  private input: InputMapper;
  private midi: MidiInput;

  private resonance = 0;
  private gloom = 0;
  private score = 0;
  private regenBars = 0;
  private lastBar = -99;
  private lastBeat = 0;
  private lastEnemyBeat = -99;
  /** The first pixel monster of a run is announced */
  private monsterSeen = false;
  private lastNoteId = -1;
  /** Notes currently held down (voice id -> MIDI), drawn as pressed piano keys */
  private held = new Map<number, number>();
  /** Glide notes that sound but are not judged yet (voice id -> note) */
  private pendingGlides = new Map<number, PendingGlide>();
  /** Every judged note of the current run, for the review at the end */
  private runNotes: JudgedNote[] = [];
  /** Review lines shown on the level-complete and game-over screens */
  private review: string[] = [];
  private obstaclesCleared = 0;
  private flashes: Flash[] = [];
  private shakeUntil = 0;
  private debug = false;
  private best = Number(load('best', '0')) || 0;
  private tutorialDone = load('tutorial-done', '0') === '1';
  private guideOn = load('guide', '1') === '1';
  private coachOn = load('coach', '1') === '1';
  /** Recorded instruments by default; the synthesizer is the choice (and the fallback if samples fail to load) */
  private soundMode: SoundMode = ((v) => (v === 'synth' ? 'synth' : 'samples'))(load('sound', 'samples'));
  private sampleBank?: SampleBank;
  /** Volume of the band and of the player's own instrument (1 = default mix) */
  private bandVolume = loadVolume('vol-band');
  private playerVolume = loadVolume('vol-player');
  private sfxVolume = loadVolume('vol-sfx');
  /** Score numbers floating up in the world (+100 …) */
  private popups: Popup[] = [];
  /** The first note block of a run is announced */
  private blockSeen = false;
  /** The pause banner shows the settings (volume, speed, sound) */
  private pauseSettingsOpen = false;
  /** People who asked their system for less motion get no screen shake */
  private reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private tempo: TempoId = ((v) => (isTempoId(v) ? v : 'medium'))(load('tempo', 'medium'));
  /** Music style of the endless mode ("mixed" = classic intro, then all styles) */
  private endlessStyle: EndlessStyle = ((v) => (isEndlessStyle(v) ? v : 'mixed'))(load('endless-style', 'mixed'));
  private explanation?: NoteExplanation;
  private explainedAt = -10;
  private coachTip?: string;
  /** Clickable buttons of the current menu screen (title, map, level complete) */
  private titleButtons: Button[] = [];
  /** Clickable buttons during play (pause / resume and the pause banner) */
  private hudButtons: Button[] = [];
  /** When the game ended (seconds); its buttons ignore taps right after it, which were meant as notes */
  private gameOverAt = 0;
  /** When the game was paused (seconds); texts like the coach do not fade out while paused */
  private pausedAt = 0;
  // Campaign
  private progress = loadProgress();
  private mapChapter = 0;
  private campaignLevel?: LevelDef;
  private resonanceSamples: number[] = [];
  private livesLost = 0;
  private lastStars = 0;
  private theory = new TheoryPanel(() => this.onTheoryClosed());
  private credits = new CreditsPanel();
  /** True if opening the theory panel paused the game (so closing it resumes). */
  private pausedForTheory = false;
  private lastFrame = performance.now();

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.prepareRun('run');
    // Saved choice "real instruments": start loading right away (decoding works before the first click)
    if (this.soundMode === 'samples') {
      this.ensureEngine();
      void this.sampleBank!.load();
    }
    this.input = new InputMapper(canvas, {
      noteOn: (r) => this.noteOn(r),
      noteOff: (id, superseded) => this.noteOff(id, superseded),
      command: (code) => this.command(code),
      canPlay: () => this.state === 'playing' && !this.tutorialReading,
      click: (x, y) => this.onMenuClick(x, y),
      uiClick: (x, y) => this.onHudClick(x, y),
      currentKey: () => this.song.positionAt(this.currentBeat()).section.key,
    });
    // A MIDI keyboard, if there is one (access is asked for when the first game starts)
    this.midi = new MidiInput({
      note: (e) => this.input.midiNote(e),
      connected: (name) => this.flash(t('flash.midi', { name }), '#8cffaa'),
    });
    window.addEventListener('resize', () => this.resize());
    // A hidden tab stops drawing while the audio clock runs on: pause instead
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.togglePause();
    });
    this.resize();
    requestAnimationFrame((ts) => this.frame(ts));
  }

  private get now(): number {
    return performance.now() / 1000;
  }

  private resize(): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    if (setLaneRange(this.width)) this.input?.releaseAll();
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
  }

  private prepareRun(mode: Mode, campaignLevel?: LevelDef): void {
    this.mode = mode;
    const rnd = makeRng(Date.now() & 0xffffffff);
    this.level = new LevelGen(rnd);
    if (mode === 'tutorial') {
      // Always the same calm section; obstacles only appear near the end
      this.song = new Song([TUTORIAL_SECTION], () => TUTORIAL_SECTION);
    } else if (mode === 'campaign' && campaignLevel) {
      // Finite level: the song ends after its sections
      const factor = TEMPOS[this.tempo].factor;
      this.song = new Song(campaignLevel.sections.map((d) => ({ ...d, bpm: Math.round(d.bpm * factor) })));
      this.song.onAdd((s) => this.level.addSection(s));
    } else {
      // Scale all tempos by the selected game speed (read when a section is made: it can change in the pause menu)
      const scale = (d: SectionDef): SectionDef => ({ ...d, bpm: Math.round(d.bpm * TEMPOS[this.tempo].factor) });
      // The chosen style decides keys, chord progressions, tempo range and the backing band
      const generate = makeSectionGenerator(rnd, this.endlessStyle);
      this.song = new Song(endlessIntro(this.endlessStyle, rnd).map(scale), (i, prev) => scale(generate(i, prev)));
      this.song.onAdd((s) => this.level.addSection(s));
    }
    this.player.reset();
    this.enemies.clear();
    this.judge.reset();
    this.guide = new Guide(rnd);
    this.tutorial = new Tutorial();
    this.resonance = 0;
    this.gloom = 0;
    this.score = 0;
    this.regenBars = 0;
    this.lastBar = -99;
    this.lastBeat = 0;
    this.lastEnemyBeat = -99;
    this.obstaclesCleared = 0;
    this.monsterSeen = false;
    this.blockSeen = false;
    this.popups = [];
    this.flashes = [];
    this.held.clear();
    this.pendingGlides.clear();
    this.runNotes = [];
    this.review = [];
    this.explanation = undefined;
    this.coachTip = undefined;
    this.campaignLevel = campaignLevel;
    this.resonanceSamples = [];
    this.livesLost = 0;
  }

  /** Creates the audio engine, player voice and sample bank on first use. */
  private ensureEngine(): AudioEngine {
    if (!this.engine) {
      this.engine = new AudioEngine();
      const offset = Number(load('latency-offset', '0'));
      this.engine.userOffset = Number.isFinite(offset) ? Math.max(-0.2, Math.min(0.3, offset)) : 0;
      this.engine.setVolumes(this.bandVolume, this.playerVolume, this.sfxVolume);
      this.synth = new Synth(this.engine);
      this.sfx = new Sfx(this.engine);
      this.sampleBank = new SampleBank(this.engine.ctx);
      this.synth.samples = this.sampleBank;
      // In "samples" mode the player plays the instrument that fits the current style
      this.synth.instrument = () =>
        this.soundMode === 'samples' ? PLAYER_INSTRUMENTS[this.song.positionAt(this.currentBeat()).section.style ?? 'classic'] : undefined;
    }
    return this.engine;
  }

  private async startRun(mode: Mode, campaignLevel?: LevelDef): Promise<void> {
    const engine = this.ensureEngine();
    void this.midi.start();
    if (this.soundMode === 'samples') void this.sampleBank!.load();
    await engine.resume();
    this.clock?.stop();
    this.prepareRun(mode, campaignLevel);
    const backing = new Backing(engine, this.song);
    this.backing = backing;
    backing.samples = this.sampleBank;
    backing.useSamples = this.soundMode === 'samples';
    if (this.soundMode === 'samples') {
      const inst = PLAYER_INSTRUMENTS[this.song.sections[0].style ?? 'classic'];
      this.flash(t('flash.instrument', { name: t(inst ? `instruments.${inst}` : 'instruments.synth') }), '#ffd75a');
    }
    this.clock = new Clock(
      engine.ctx,
      (b) => this.song.bpmAt(b),
      (b, time, bpm) => backing.onStep(b, time, bpm),
    );
    this.clock.start(-this.song.sections[0].beatsPerBar);
    this.state = 'playing';
  }

  private toTitle(): void {
    this.clock?.stop();
    this.synth?.allOff();
    this.input.releaseAll();
    if (this.engine && this.engine.ctx.state !== 'running') void this.engine.ctx.resume();
    this.prepareRun('run');
    this.state = 'title';
  }

  private currentBeat(): number {
    if (!this.clock || !this.engine) return 0;
    if (!this.clock.running) return this.lastBeat;
    return this.clock.beatAt(this.engine.audibleTime);
  }

  // ---------- Input ----------

  private onMenuClick(x: number, y: number): void {
    const b = this.titleButtons.find((btn) => x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h);
    if (this.state === 'title') {
      if (!b) return;
      if (b.id.startsWith('lang:')) this.changeLocale(b.id.slice(5) as Locale);
      else if (b.id.startsWith('tempo:')) this.changeTempo(b.id.slice(6));
      else if (b.id.startsWith('sound:')) this.changeSound(b.id.slice(6));
      else if (b.id === 'theory') this.openTheory();
      else if (b.id === 'credits') this.credits.open();
      else if (b.id === 'campaign') this.openMap();
      else if (b.id === 'play') this.openStyles();
      else void this.startRun('tutorial');
    } else if (this.state === 'styles') {
      if (!b) return;
      if (b.id === 'back') this.toTitle();
      else if (b.id.startsWith('style:')) this.startEndless(b.id.slice(6));
    } else if (this.state === 'map') {
      if (!b) return;
      if (b.id === 'back') this.toTitle();
      else if (b.id === 'wiki') this.openChapterWiki();
      else if (b.id.startsWith('chapter:')) this.mapChapter = Number(b.id.slice(8));
      else if (b.id.startsWith('level:')) this.startLevel(b.id.slice(6));
    } else if (this.state === 'levelComplete') {
      if (b) this.levelCompleteAction(b.id);
    } else if (this.state === 'playing' && this.tutorialReading) {
      this.beginTutorialStep();
    } else if (this.state === 'gameover') {
      if (b && this.now - this.gameOverAt > GAME_OVER_CLICK_DELAY) this.gameOverAction(b.id);
    }
  }

  private gameOverAction(id: string): void {
    if (id === 'retry') this.retry();
    else if (id === 'map') this.openMap();
    else if (id === 'menu') this.toTitle();
  }

  /** Buttons of the in-game HUD: pause/resume, and the pause banner. Returns true if one was hit. */
  private onHudClick(x: number, y: number): boolean {
    if (this.state !== 'playing' && this.state !== 'paused') return false;
    const b = this.hudButtons.find((btn) => x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h);
    if (!b) return this.state === 'paused'; // while paused, a click elsewhere does nothing (time to read)
    if (b.id === 'toggle:guide') this.toggleGuide();
    else if (b.id === 'toggle:coach') this.toggleCoach();
    else if (b.id === 'pause' || b.id === 'pause:resume') this.togglePause();
    else if (b.id === 'pause:settings') this.pauseSettingsOpen = !this.pauseSettingsOpen;
    else if (b.id.startsWith('pause:vol:')) this.changeVolume(b.id.split(':')[2], b.id.endsWith('+') ? 0.1 : -0.1);
    else if (b.id.startsWith('pause:tempo:')) this.changeTempo(b.id.slice(12));
    else if (b.id.startsWith('pause:sound:')) this.changeSound(b.id.slice(12));
    else if (b.id === 'pause:theory') this.openTheory();
    else if (b.id === 'pause:menu') this.toTitle();
    return true;
  }

  // ---------- Endless mode ----------

  /** Screen between the title and the endless mode: pick the music style to jam to. */
  private openStyles(): void {
    this.toTitle();
    this.state = 'styles';
  }

  /** Remembers the chosen style and starts an endless run with it. */
  private startEndless(id: string): void {
    if (!isEndlessStyle(id)) return;
    this.endlessStyle = id;
    save('endless-style', id);
    void this.startRun('run');
  }

  /** Enter/Space in a menu: from the title to the style screen, after game over straight into a new run. */
  private startFromMenu(): void {
    if (this.state === 'title') this.openStyles();
    else void this.startRun('run');
  }

  /** Moves the selection on the style screen (arrow keys); up/down jumps a whole row. */
  private moveStyleSelection(delta: number): void {
    const i = ENDLESS_STYLES.indexOf(this.endlessStyle);
    const next = Math.max(0, Math.min(ENDLESS_STYLES.length - 1, i + delta));
    this.endlessStyle = ENDLESS_STYLES[next];
  }

  // ---------- Campaign ----------

  private openMap(): void {
    this.toTitle();
    this.state = 'map';
  }

  private openChapterWiki(): void {
    const url = t(`campaign.chapters.${CHAPTERS[this.mapChapter].id}.wikiUrl`);
    window.open(url, '_blank', 'noopener');
  }

  private startLevel(levelId: string): void {
    const found = findLevel(levelId);
    if (!found) return;
    this.mapChapter = CHAPTERS.indexOf(found.chapter);
    void this.startRun('campaign', found.chapter.levels[found.index]);
  }

  /** Restarts the current level (campaign) or a new endless run. */
  private retry(): void {
    if (this.mode === 'campaign' && this.campaignLevel) this.startLevel(this.campaignLevel.id);
    else void this.startRun(this.mode === 'tutorial' ? 'tutorial' : 'run');
  }

  private nextLevelId(): string | undefined {
    if (!this.campaignLevel) return undefined;
    const found = findLevel(this.campaignLevel.id);
    if (!found) return undefined;
    return found.chapter.levels[found.index + 1]?.id;
  }

  private levelCompleteAction(id: string): void {
    if (id === 'next') {
      const next = this.nextLevelId();
      if (next) this.startLevel(next);
      else this.openMap();
    } else if (id === 'retry') {
      this.retry();
    } else if (id === 'map') {
      this.openMap();
    }
  }

  /** The finite song of a campaign level has ended. */
  private completeLevel(): void {
    const level = this.campaignLevel;
    if (!level) return;
    const samples = this.resonanceSamples;
    const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : this.resonance;
    this.lastStars = starsFor(avg, this.livesLost);
    recordResult(this.progress, level.id, this.lastStars, this.score);
    saveProgress(this.progress);
    this.review = this.makeReview();
    this.sfx?.fanfare(this.song.positionAt(Math.max(0, this.song.endBeat - 0.5)).chord);
    this.state = 'levelComplete';
    this.clock?.stop();
    this.synth?.allOff();
    this.input.releaseAll();
  }

  /** Sums up the run that just ended: shares of chord tones and on-time notes, rings hit, and one tip. */
  private makeReview(): string[] {
    const beat = Math.max(0, this.lastBeat);
    const s = summarize(this.runNotes, beat);
    const due = this.guideActive ? this.guide.dueCount(beat) : 0;
    const params = { notes: s.notes, chord: s.chordPct, grid: s.onGridPct, hits: this.guide.hits, total: due };
    const lines = s.notes ? [t(due > 0 ? 'review.statsRings' : 'review.stats', params)] : [];
    lines.push(t('review.tip', { tip: s.tip }));
    return lines;
  }

  private get averageResonance(): number {
    const s = this.resonanceSamples;
    return s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0;
  }

  /** Switches between synthesizer (default) and recorded samples; samples load in the background. */
  private changeSound(id: string): void {
    if (id !== 'synth' && id !== 'samples') return;
    this.soundMode = id;
    save('sound', id);
    if (this.backing) this.backing.useSamples = id === 'samples';
    if (id === 'samples') {
      this.ensureEngine();
      void this.sampleBank!.load().then((ok) => this.flash(t(ok ? 'flash.samplesReady' : 'flash.samplesFailed'), ok ? '#8cffaa' : '#ff8a8a'));
    }
  }

  private changeTempo(id: string): void {
    if (!isTempoId(id) || id === this.tempo) return;
    const ratio = TEMPOS[id].factor / TEMPOS[this.tempo].factor;
    this.tempo = id;
    save('tempo', id);
    // A game in progress follows right away; the clock picks the new tempo up at its next step.
    // (The tutorial keeps its own slow tempo.)
    if (this.mode !== 'tutorial') for (const s of this.song.sections) s.bpm = Math.round(s.bpm * ratio);
  }

  /** Changes the volume of the band or of the player's instrument in steps of 10 %. */
  private changeVolume(which: string, delta: number): void {
    const step = (v: number) => Math.max(0, Math.min(MAX_VOLUME, Math.round((v + delta) * 10) / 10));
    if (which === 'band') {
      this.bandVolume = step(this.bandVolume);
      save('vol-band', String(this.bandVolume));
    } else if (which === 'sfx') {
      this.sfxVolume = step(this.sfxVolume);
      save('vol-sfx', String(this.sfxVolume));
    } else {
      this.playerVolume = step(this.playerVolume);
      save('vol-player', String(this.playerVolume));
    }
    this.engine?.setVolumes(this.bandVolume, this.playerVolume, this.sfxVolume);
  }

  private get tutorialReading(): boolean {
    return this.mode === 'tutorial' && this.tutorial.reading;
  }

  /** Ends the reading phase of a tutorial step: the music continues. */
  private beginTutorialStep(): void {
    if (this.tutorial.isLast) {
      this.finishTutorial();
      return;
    }
    this.tutorial.reading = false;
    if (this.engine && this.state === 'playing') void this.engine.ctx.resume();
  }

  /** Freezes the world while the player reads a tutorial step. */
  private enterReadingPause(): void {
    if (!this.engine || this.engine.ctx.state !== 'running') return;
    this.input.releaseAll();
    this.synth?.allOff();
    void this.engine.ctx.suspend();
  }

  private changeLocale(locale: Locale): void {
    setLocale(locale, true);
    this.flash(t('flash.language'), '#9cf');
  }

  /** Opens the "understanding music" panel at the topic of the last note (pauses the game). */
  private openTheory(): void {
    if (this.state === 'playing') {
      this.togglePause();
      this.pausedForTheory = true;
    }
    this.theory.open(this.explanation?.topic);
  }

  private onTheoryClosed(): void {
    if (this.pausedForTheory && this.state === 'paused') this.togglePause();
    this.pausedForTheory = false;
  }

  private command(code: string): boolean {
    // While the theory panel is open, keys only close it (no notes are played)
    if (this.theory.isOpen) {
      if (code === 'Escape' || code === 'KeyI') this.theory.close();
      return true;
    }
    if (this.credits.isOpen) {
      if (code === 'Escape') this.credits.close();
      return true;
    }
    // Campaign screens have their own keys
    if (this.state === 'map') {
      if (code === 'Escape') this.toTitle();
      else if (code === 'ArrowLeft') this.mapChapter = Math.max(0, this.mapChapter - 1);
      else if (code === 'ArrowRight') this.mapChapter = Math.min(CHAPTERS.length - 1, this.mapChapter + 1);
      else if (code === 'Enter' || code === 'NumpadEnter') {
        const c = CHAPTERS[this.mapChapter];
        const level = c.levels.find((l) => !this.progress.stars[l.id]) ?? c.levels[0];
        if (c.available && level) this.startLevel(level.id);
      } else if (code === 'KeyI') this.openTheory();
      return true;
    }
    if (this.state === 'styles') {
      if (code === 'Escape' || code === 'KeyQ') this.toTitle();
      else if (code === 'ArrowLeft') this.moveStyleSelection(-1);
      else if (code === 'ArrowRight') this.moveStyleSelection(1);
      else if (code === 'ArrowUp') this.moveStyleSelection(-STYLE_GRID_COLS);
      else if (code === 'ArrowDown') this.moveStyleSelection(STYLE_GRID_COLS);
      else if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') this.startEndless(this.endlessStyle);
      else if (/^Digit[0-9]$/.test(code)) {
        // 1–9 = first nine cards, 0 = the tenth
        const style = ENDLESS_STYLES[(Number(code.slice(5)) + 9) % 10];
        if (style) this.startEndless(style);
      } else if (code === 'KeyI') this.openTheory();
      return true;
    }
    if (this.state === 'levelComplete') {
      if (code === 'Enter' || code === 'NumpadEnter') this.levelCompleteAction(this.nextLevelId() ? 'next' : 'map');
      else if (code === 'KeyR') this.levelCompleteAction('retry');
      else if (code === 'KeyM' || code === 'Escape' || code === 'KeyQ') this.levelCompleteAction('map');
      return true;
    }
    if (this.state === 'gameover' && this.mode === 'campaign') {
      if (code === 'Enter' || code === 'NumpadEnter' || code === 'KeyR' || code === 'Space') this.retry();
      else if (code === 'KeyM') this.openMap();
      else if (code === 'KeyQ') this.toTitle();
      return true;
    }
    if (this.state === 'title' && code === 'KeyK') {
      this.openMap();
      return true;
    }
    const menu = this.state === 'title' || this.state === 'gameover';
    switch (code) {
      case 'KeyI':
        this.openTheory();
        return true;
      case 'Enter':
      case 'NumpadEnter':
        if (menu) {
          this.startFromMenu();
        } else if (this.state === 'playing' && this.mode === 'tutorial') {
          if (this.tutorial.reading || this.tutorial.isLast) this.beginTutorialStep();
          else this.tutorial.next(this.obstaclesCleared);
        }
        return true;
      case 'Space':
        if (menu) this.startFromMenu();
        return true;
      case 'KeyT':
        if (menu) {
          void this.startRun('tutorial');
          return true;
        }
        return false;
      case 'KeyL':
        if (this.state === 'title') {
          const i = LOCALES.indexOf(getLocale());
          this.changeLocale(LOCALES[(i + 1) % LOCALES.length]);
          return true;
        }
        return false;
      case 'KeyQ':
        if (this.state === 'paused' || this.state === 'gameover') {
          this.toTitle();
          return true;
        }
        return false;
      case 'Escape':
        this.togglePause();
        return true;
      case 'F3':
        this.debug = !this.debug;
        return true;
      case 'KeyV':
        this.toggleGuide();
        return true;
      case 'KeyC':
        this.toggleCoach();
        return true;
      case 'BracketLeft':
      case 'BracketRight':
        if (this.engine) {
          const d = code === 'BracketLeft' ? -0.01 : 0.01;
          this.engine.userOffset = Math.max(-0.2, Math.min(0.3, this.engine.userOffset + d));
          save('latency-offset', this.engine.userOffset.toFixed(2));
          this.flash(t('flash.latency', { ms: Math.round(this.engine.userOffset * 1000) }), '#9cf');
        }
        return true;
      case 'KeyM':
        if (this.backing) {
          this.backing.muted = !this.backing.muted;
          this.flash(t(this.backing.muted ? 'flash.backingOff' : 'flash.backingOn'), '#9cf');
        }
        return true;
    }
    return false;
  }

  private toggleGuide(): void {
    this.guideOn = !this.guideOn;
    save('guide', this.guideOn ? '1' : '0');
    this.flash(t(this.guideOn ? 'flash.guideOn' : 'flash.guideOff'), '#9cf');
  }

  private toggleCoach(): void {
    this.coachOn = !this.coachOn;
    save('coach', this.coachOn ? '1' : '0');
    this.flash(t(this.coachOn ? 'flash.coachOn' : 'flash.coachOff'), '#9cf');
  }

  private finishTutorial(): void {
    this.tutorialDone = true;
    save('tutorial-done', '1');
    void this.startRun('run');
  }

  private togglePause(): void {
    if (!this.engine) return;
    if (this.state === 'playing') {
      this.state = 'paused';
      this.pauseSettingsOpen = false;
      this.pausedAt = this.now;
      this.input.releaseAll();
      void this.engine.ctx.suspend();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      // Texts that fade out over time (coach, flashes) continue where they were
      const pausedFor = this.now - this.pausedAt;
      this.explainedAt += pausedFor;
      for (const f of this.flashes) f.born += pausedFor;
      // During a tutorial reading phase the world stays frozen
      if (!this.tutorialReading) void this.engine.ctx.resume();
    }
  }

  private get guideActive(): boolean {
    return this.mode === 'tutorial' ? this.tutorial.step.guide : this.guideOn;
  }

  private get coachActive(): boolean {
    return this.mode === 'tutorial' || this.coachOn;
  }

  private noteOn(req: NoteRequest): number {
    if (!this.engine || !this.synth || !this.clock) return -1;
    const id = this.synth.noteOn(req.midi, req.velocity);
    const beat = this.clock.beatAt(this.engine.audibleTime);
    const spb = this.clock.secPerBeatAt(this.engine.audibleTime);
    this.held.set(id, req.midi);
    // While gliding, lanes that are only crossed must not count as (mostly wrong) notes
    if (req.glide) this.pendingGlides.set(id, { req, beat, secPerBeat: spb, at: this.now });
    else this.judgeNote(id, req, beat, spb);
    return id;
  }

  /** Scores a sounding note at the beat it started on, and shows it (particle, coach, tutorial). */
  private judgeNote(id: number, req: NoteRequest, beat: number, spb: number): void {
    const pos = this.song.positionAt(beat);
    // Notes played slightly early already count towards the next chord
    const chordPos = this.song.positionAt(beat + 0.12);
    const { note, events } = this.judge.judge(
      { midi: req.midi, velocity: req.velocity, beat },
      {
        key: chordPos.section.key,
        chord: chordPos.chord,
        beatInBar: pos.beatInBar,
        beatsPerBar: pos.section.beatsPerBar,
        secPerBeat: spb,
        style: styleOf(chordPos.section.style),
        toleranceSec: this.mode === 'tutorial' ? TUTORIAL_TOLERANCE_SEC : TEMPOS[this.tempo].toleranceSec,
      },
    );
    this.runNotes.push(note);
    const now = this.now;
    for (const ev of events) {
      switch (ev) {
        case 'resolution':
          this.particles.requalify(this.lastNoteId, 'passing');
          break;
        case 'chord':
          if (!this.player.shield) {
            this.player.shield = true;
            this.flash(t('flash.shieldGained'), '#78dcff');
          }
          break;
        case 'octave':
          if (!this.player.doubleJump) {
            this.player.doubleJump = true;
            this.flash(t('flash.doubleJumpGained'), '#c8f0ff');
          }
          break;
        case 'dissonance':
          // No enemies in the tutorial – it's a safe place to experiment
          if (this.mode !== 'tutorial' && beat >= 0 && beat - this.lastEnemyBeat > pos.section.beatsPerBar * 2) {
            this.lastEnemyBeat = beat;
            const ahead = (this.width - playerScreenX(this.width)) / PX_PER_BEAT + 0.5;
            this.enemies.spawn(beat + ahead);
            this.flash(t('flash.enemy'), '#ff5a6e');
          }
          break;
      }
    }

    const guideHit = this.guideActive ? !!this.guide.tryHit(req.midi, beat, 0.16 / spb, now) : false;
    if (guideHit) {
      this.score += 5;
      this.judge.addBonus(note, GUIDE_HIT_BONUS);
    }
    if (this.mode === 'tutorial') this.tutorial.onNote(note, events, guideHit, now);

    this.explanation = explainNote(note);
    if (guideHit) this.explanation.details.unshift(t('explain.guideHit'));
    this.explainedAt = now;
    this.particles.spawn(id, note, req.x, req.y, now);
    this.lastNoteId = id;
  }

  private noteOff(id: number, superseded = false): void {
    if (id < 0) return;
    const pending = this.pendingGlides.get(id);
    if (pending) {
      this.pendingGlides.delete(id);
      // Lifting the pointer on a note makes it the target of the glide; sliding on drops it
      if (!superseded) this.judgeNote(id, pending.req, pending.beat, pending.secPerBeat);
    }
    this.synth?.noteOff(id);
    this.held.delete(id);
    this.particles.release(id, this.now);
  }

  private flash(text: string, color: string): void {
    this.flashes.push({ text, color, born: this.now });
    if (this.flashes.length > 6) this.flashes.shift();
  }

  // ---------- Game loop ----------

  private frame(ts: number): void {
    const dt = Math.min(0.05, (ts - this.lastFrame) / 1000);
    this.lastFrame = ts;
    if (this.state === 'playing') this.update(dt);
    else this.particles.update(dt, this.now, playerScreenX(this.width), groundY(this.height) - PLAYER_H);
    this.render();
    requestAnimationFrame((next) => this.frame(next));
  }

  /** Pitch range in which the guide rings suggest notes (matches the keyboard). */
  private guideRange(): [number, number] {
    let low = this.input.octaveBase;
    if (this.input.scaleMode) low += this.song.positionAt(this.currentBeat()).section.key.tonic;
    return [low, low + 12];
  }

  private update(dt: number): void {
    const now = this.now;
    // Glide notes the pointer has rested on now count
    for (const [id, p] of this.pendingGlides) {
      if (now - p.at < GLIDE_SETTLE_SEC) continue;
      this.pendingGlides.delete(id);
      this.judgeNote(id, p.req, p.beat, p.secPerBeat);
    }
    const beat = this.currentBeat();
    const pos = this.song.positionAt(beat);
    const bpb = pos.section.beatsPerBar;

    const raw = this.judge.resonance(beat, bpb);
    this.resonance += (raw - this.resonance) * Math.min(1, dt * 3);

    // Dissonance darkens the world
    const recent = this.judge.history.filter((n) => beat - n.beat < bpb * 2);
    const bad = recent.filter((n) => n.quality === 'dissonant').length;
    const gloomTarget = recent.length ? Math.min(1, (bad / recent.length) * 1.5) : 0;
    this.gloom += (gloomTarget - this.gloom) * Math.min(1, dt * 2);

    this.guide.enabled = this.guideActive;
    this.guide.stride = this.mode === 'tutorial' ? TUTORIAL_GUIDE_STRIDE : TEMPOS[this.tempo].guideStride;
    const [gLow, gHigh] = this.guideRange();
    this.guide.update(beat, this.song, gLow, gHigh);

    if (this.mode === 'tutorial') this.updateTutorialWorld(beat);

    if (beat >= 0) {
      const events: PlayerEvent[] = this.player.update(beat, now, this.resonance, this.level);
      const dBeat = Math.max(0, Math.min(1, beat - this.lastBeat));
      events.push(...this.enemies.update(dBeat, beat, now, this.player));
      for (const ev of events) this.onPlayerEvent(ev);

      for (const o of this.level.obstacles) {
        if (o.counted || o.beat + o.width > beat - 0.2) continue;
        o.counted = true;
        if (!o.hit) this.obstaclesCleared++;
        if (o.monster && !o.hit && !o.broken) {
          this.score += 50;
          this.popup(o.beat + o.width / 2, o.height + 20, '+50', '#b0ffb0');
        }
      }

      // Announce the first pixel monster of a run as soon as it walks onto the screen
      if (!this.monsterSeen) {
        const ahead = (this.width - playerScreenX(this.width)) / PX_PER_BEAT;
        if (this.level.obstacles.some((o) => o.monster && o.beat > beat && o.beat - beat < ahead)) {
          this.monsterSeen = true;
          this.flash(t('flash.monster'), '#c89bff');
        }
      }

      for (const c of this.level.coins) {
        if (c.taken || Math.abs(c.beat - beat) > 0.2) continue;
        if (Math.abs(this.player.y - c.height) < 36) {
          c.taken = true;
          this.score += 100;
          this.popup(c.beat, c.height + PLAYER_H, '+100', '#ffd75a');
          this.sfx?.coin(pos.chord);
        }
      }

      // Note blocks: bumped when the runner's head reaches their bottom edge underneath them
      for (const b of this.level.blocks) {
        if (b.bumped || Math.abs(b.beat - beat) > BLOCK_HALF_BEATS + PLAYER_W / 2 / PX_PER_BEAT) continue;
        if (this.player.state === 'jump' && this.player.y + PLAYER_H >= b.bottom) {
          b.bumped = true;
          b.bumpedAt = now;
          this.score += 100;
          this.popup(b.beat, b.bottom + 40, '♪ +100', '#ffd75a');
          this.sfx?.bump(pos.chord);
        }
      }

      // Announce the first note block of a run
      if (!this.blockSeen && this.mode !== 'tutorial') {
        const ahead = (this.width - playerScreenX(this.width)) / PX_PER_BEAT;
        if (this.level.blocks.some((b) => b.beat > beat && b.beat - beat < ahead)) {
          this.blockSeen = true;
          this.flash(t('flash.block'), '#ffd75a');
        }
      }

      if (pos.bar !== this.lastBar) {
        this.lastBar = pos.bar;
        this.score += 10 + this.resonance / 5;
        if (pos.bar >= 0) this.resonanceSamples.push(this.resonance);
        if (this.resonance >= 70) this.regenBars++;
        else this.regenBars = Math.max(0, this.regenBars - 1);
        if (this.regenBars >= 4) {
          this.regenBars = 0;
          if (this.player.lives < this.player.maxLives) {
            this.player.lives++;
            this.flash(t('flash.regen'), '#ff8aa0');
          }
        }
        // Re-evaluate the coach tip once per bar (not during the count-in)
        // A pixel monster in the next two bars has priority: how much resonance does the jump need?
        const monster = this.level.obstacles.find((o) => o.monster && !o.hit && o.beat > beat && o.beat - beat < bpb * 2);
        const block = this.level.blocks.find((b) => !b.bumped && b.beat > beat && b.beat - beat < bpb * 2);
        if (monster && this.mode !== 'tutorial') this.coachTip = monsterTip(monster.minResonance, this.resonance);
        else if (block && this.mode !== 'tutorial') this.coachTip = blockTip(block.minResonance, this.resonance);
        else this.coachTip = this.mode !== 'tutorial' && pos.bar >= 1 ? diagnose(this.judge.history, beat, bpb, this.resonance) : undefined;
      }

      if (this.mode === 'tutorial') {
        // You can't lose in the practice room
        this.player.lives = this.player.maxLives;
      } else if (this.mode === 'campaign' && beat >= this.song.endBeat) {
        this.completeLevel();
      } else if (this.player.lives <= 0) {
        this.gameOver();
      }
      this.level.prune(beat);
    }
    this.lastBeat = beat;

    if (this.mode === 'tutorial') {
      this.tutorial.onFrame({ resonance: this.resonance, obstaclesCleared: this.obstaclesCleared }, now);
      if (this.tutorial.reading) this.enterReadingPause();
    }

    const py = groundY(this.height) - this.player.y - PLAYER_H / 2;
    this.particles.update(dt, now, playerScreenX(this.width), py);
  }

  /** In the tutorial, obstacles only appear in the matching step, then keep coming. */
  private updateTutorialWorld(beat: number): void {
    if (!this.tutorial.step.obstacles || beat < 0) return;
    const ahead = this.level.obstacles.filter((o) => o.beat > beat);
    if (ahead.length >= 2) return;
    const last = this.level.obstacles[this.level.obstacles.length - 1];
    const start = Math.max(beat + 5, last ? last.beat + last.width + 5 : 0);
    this.level.addObstacleAt(Math.ceil(start), 10, 35);
  }

  /** A score number that floats up from a point in the world. */
  private popup(beat: number, height: number, text: string, color: string): void {
    this.popups.push({ beat, height, text, color, born: this.now });
    if (this.popups.length > 12) this.popups.shift();
  }

  private onPlayerEvent(ev: PlayerEvent): void {
    const chord = this.song.positionAt(this.currentBeat()).chord;
    switch (ev) {
      case 'jump':
        this.sfx?.jump(chord);
        break;
      case 'land':
        this.sfx?.land();
        break;
      case 'fall':
        this.sfx?.fall();
        break;
    }
    switch (ev) {
      case 'hurt':
        this.sfx?.hurt();
        this.livesLost++;
        this.flash(t(this.mode === 'tutorial' ? 'flash.hurtTutorial' : 'flash.hurt'), '#ff5a6e');
        this.shakeUntil = this.now + 0.3;
        break;
      case 'shieldBreak':
        this.sfx?.smash();
        this.flash(t('flash.shieldHolds'), '#78dcff');
        break;
      case 'doubleJump':
        this.sfx?.doubleJump(chord);
        this.flash(t('flash.doubleJump'), '#c8f0ff');
        break;
      case 'stomp':
        this.score += 50;
        this.sfx?.stomp(chord);
        this.popup(this.currentBeat(), this.player.y + PLAYER_H + 10, '+50', '#b0ffb0');
        break;
    }
  }

  private gameOver(): void {
    this.review = this.makeReview();
    this.state = 'gameover';
    this.gameOverAt = this.now;
    this.clock?.stop();
    this.synth?.allOff();
    this.input.releaseAll();
    // The high score belongs to the endless mode; campaign levels keep their own best
    if (this.mode === 'run' && this.score > this.best) {
      this.best = this.score;
      save('best', String(Math.floor(this.best)));
    }
  }

  // ---------- Rendering ----------

  private announcement(beat: number, section: Section): HudView['announcement'] {
    const melodyHint = (s: Section) => (s.melody && this.guideActive ? `  ${t('announce.melody')}` : '');
    if (beat < 0) {
      const title = section.melody ? `${t('announce.start')}: ${sectionName(section)}` : t('announce.start');
      return { title, detail: describeSection(section) + melodyHint(section), beatsLeft: -beat };
    }
    if (this.mode === 'tutorial') return undefined;
    const next = this.song.nextSection(section);
    if (next === section) return undefined; // last section of a campaign level
    const left = next.startBeat - beat;
    if (left > section.beatsPerBar * 2) return undefined;
    const changes: string[] = [];
    if (next.bpm > section.bpm) changes.push(t('announce.faster'));
    if (next.bpm < section.bpm) changes.push(t('announce.slower'));
    if (next.beatsPerBar !== section.beatsPerBar) changes.push(t('announce.meter', { n: next.beatsPerBar }));
    if (next.key.tonic !== section.key.tonic || next.key.mode !== section.key.mode) changes.push(t('announce.newKey'));
    return {
      title: t('announce.next', { name: sectionName(next) }),
      detail: describeSection(next) + (changes.length ? `  (${changes.join(', ')})` : '') + melodyHint(next),
      beatsLeft: left,
    };
  }

  /** For the "fits now" box: chord tones and the keys that currently play them. */
  private fitsNow(chord: Chord): { chord: string; notes: string; keys: string } {
    const keys: string[] = [];
    for (let m = 36; m <= 96; m++) {
      if (!chord.pcs.includes(pitchClass(m))) continue;
      const k = this.input.keyLabel(m);
      if (k) keys.push(`${k} (${pcName(pitchClass(m))})`);
    }
    return {
      chord: chord.name,
      notes: chord.pcs.map((pc) => pcName(pc)).join(' · '),
      keys: keys.length ? keys.join(', ') : t('hud.fitsNoKeys'),
    };
  }

  private render(): void {
    const ctx = this.ctx;
    const now = this.now;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (now < this.shakeUntil && !this.reducedMotion) {
      ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    }
    const beat = this.state === 'title' ? -0.001 : this.currentBeat();
    const pos = this.song.positionAt(beat);

    this.renderer.draw(ctx, {
      width: this.width,
      height: this.height,
      beat,
      now,
      resonance: this.resonance,
      gloom: this.gloom,
      pos,
      song: this.song,
      level: this.level,
      player: this.player,
      enemies: this.enemies,
      mouseX: this.state === 'playing' ? this.input.mouseX : -1,
      keyboardBase: this.input.octaveBase,
      scaleMode: this.input.scaleMode,
      guide: this.state === 'playing' && this.guideActive ? this.guide.targets : [],
      keyLabel: (m) => this.input.keyLabel(m),
      pressed: [...this.held.values()],
      popups: this.popups,
      goalBeat: this.mode === 'campaign' ? this.song.endBeat : undefined,
      markers:
        this.state === 'playing' && this.mode === 'tutorial' && !this.tutorial.complete && this.tutorial.step.markers
          ? this.tutorial.step.markers(pos.chord, pos.section.key)
          : [],
    });
    this.particles.draw(ctx, now, this.debug);

    if (this.state === 'map') {
      this.titleButtons = this.hud.drawMap(ctx, this.width, this.height, now, CHAPTERS, this.mapChapter, this.progress);
      return;
    }
    if (this.state === 'title') {
      this.hud.rotateHint(ctx, this.width, this.height);
      this.titleButtons = this.hud.drawTitle(ctx, this.width, this.height, now, this.best, this.tutorialDone, this.tempo, {
        mode: this.soundMode,
        state: this.sampleBank?.state ?? 'idle',
        progress: this.sampleBank?.progress ?? 0,
      });
      this.drawTitleFlashes(ctx, now);
      return;
    }
    if (this.state === 'styles') {
      this.titleButtons = this.hud.drawStyleSelect(ctx, this.width, this.height, now, ENDLESS_STYLES, this.endlessStyle);
      return;
    }
    const paused = this.state === 'paused';
    // While paused the HUD clock stands still, so texts stay on screen for reading
    const hudNow = paused ? this.pausedAt : now;
    if (paused) this.hud.dimForPause(ctx, this.width, this.height);
    this.hudButtons = this.hud.draw(ctx, {
      width: this.width,
      height: this.height,
      now: hudNow,
      beat,
      pos,
      resonance: this.resonance,
      player: this.player,
      score: this.score,
      regenProgress: this.regenBars / 4,
      announcement: this.state === 'playing' || paused ? this.announcement(beat, pos.section) : undefined,
      flashes: this.flashes,
      debug: this.debug,
      history: this.judge.history,
      latencyMs: Math.round((this.engine?.outputLatency ?? 0) * 1000),
      userOffsetMs: Math.round((this.engine?.userOffset ?? 0) * 1000),
      scaleMode: this.input.scaleMode,
      octaveBase: this.input.octaveBase,
      velocity: this.input.velocity,
      tutorial: this.mode === 'tutorial' ? { tutorial: this.tutorial, total: STEPS.length } : undefined,
      portrait: this.height > this.width,
      coach: this.coachActive
        ? { explanation: this.explanation, age: hudNow - this.explainedAt, tip: this.coachTip, fits: this.fitsNow(pos.chord) }
        : undefined,
      guideOn: this.guideActive,
      coachOn: this.coachActive,
      paused: this.state === 'playing' || paused ? paused : undefined,
    });
    if (paused) {
      const settings = this.pauseSettingsOpen
        ? {
            band: this.bandVolume,
            player: this.playerVolume,
            sfx: this.sfxVolume,
            tempo: this.mode === 'tutorial' ? undefined : this.tempo,
            sound: this.soundMode,
          }
        : undefined;
      this.hudButtons.push(...this.hud.drawPause(ctx, this.width, this.height, settings));
    }
    if (this.state === 'gameover') {
      this.titleButtons = this.hud.drawGameOver(
        ctx,
        this.width,
        this.height,
        now,
        this.score,
        Math.max(0, this.lastBar + 1),
        this.best,
        this.mode === 'campaign',
        this.review,
      );
    }
    if (this.state === 'levelComplete') {
      this.titleButtons = this.hud.drawLevelComplete(
        ctx,
        this.width,
        this.height,
        now,
        this.lastStars,
        this.score,
        this.averageResonance,
        !!this.nextLevelId(),
        this.review,
      );
    }
  }

  /** Short confirmation (e.g. language switch) at the bottom of the title screen. */
  private drawTitleFlashes(ctx: CanvasRenderingContext2D, now: number): void {
    const f = this.flashes[this.flashes.length - 1];
    if (!f || now - f.born > 1.5) return;
    ctx.globalAlpha = 1 - (now - f.born) / 1.5;
    ctx.textAlign = 'center';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, this.width / 2, this.height - 60);
    ctx.globalAlpha = 1;
  }
}
