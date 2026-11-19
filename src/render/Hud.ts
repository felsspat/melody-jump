// HUD and screens: chord, beat, resonance, lives, announcements, debug, menus.
// All user-facing text comes from texts.json via t()/tl().

import { ChapterDef } from '../campaign/chapters';
import { Progress } from '../campaign/progress';
import { Tutorial, stepLines, stepTask, stepTitle } from '../game/Tutorial';
import { LOCALES, Locale, getLocale, t, tl } from '../i18n/i18n';
import { NoteExplanation } from '../music/explain';
import { JudgedNote } from '../music/HarmonyJudge';
import { MusicPosition, sectionName } from '../music/Song';
import { keyName, noteName, pitchHue } from '../music/theory';
import { Player } from '../world/Player';

export interface Flash {
  text: string;
  color: string;
  born: number;
}

export interface HudView {
  width: number;
  height: number;
  now: number;
  beat: number;
  pos: MusicPosition;
  resonance: number;
  player: Player;
  score: number;
  regenProgress: number;
  announcement?: { title: string; detail: string; beatsLeft: number };
  flashes: Flash[];
  debug: boolean;
  history: JudgedNote[];
  latencyMs: number;
  userOffsetMs: number;
  scaleMode: boolean;
  octaveBase: number;
  velocity: number;
  tutorial?: { tutorial: Tutorial; total: number };
  coach?: {
    explanation?: NoteExplanation;
    /** Seconds since the last note */
    age: number;
    tip?: string;
    /** What fits right now? Chord, notes, keys */
    fits?: { chord: string; notes: string; keys: string };
  };
  guideOn: boolean;
  coachOn: boolean;
  /** Pause button: false = "pause", true = "resume", undefined = no button (game over, level end) */
  paused?: boolean;
  /** Phone held upright: show the hint to turn it */
  portrait?: boolean;
}

/** Columns of the style grid on the endless screen (12 styles = 3 rows). */
export const STYLE_GRID_COLS = 4;

export interface Button {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 'tutorial' | 'play' | 'lang:<locale>' */
  id: string;
}

const FONT = 'system-ui, -apple-system, Segoe UI, sans-serif';

/** Wraps text into lines that fit within maxWidth. */
/** What the settings part of the pause banner shows. */
export interface PauseSettings {
  /** Volume factors (1 = 100 %) */
  band: number;
  player: number;
  /** Selected game speed; undefined = not adjustable (tutorial) */
  tempo?: string;
  sound: string;
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, border: string): void {
  ctx.fillStyle = 'rgba(10,8,24,0.78)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.75, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.75, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  ctx.fill();
}

/** Draws a flag for a locale (emoji flags don't render on Windows). */
export function drawFlag(ctx: CanvasRenderingContext2D, locale: Locale, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.clip();
  if (locale === 'de') {
    const colors = ['#000000', '#dd0000', '#ffce00'];
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y + (h / 3) * i, w, h / 3 + 1);
    });
  } else {
    // Union Jack (simplified)
    ctx.fillStyle = '#012169';
    ctx.fillRect(x, y, w, h);
    const diag = (width: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      ctx.moveTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.stroke();
    };
    diag(h * 0.2, '#ffffff');
    diag(h * 0.08, '#c8102e');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w / 2 - h * 0.17, y, h * 0.34, h);
    ctx.fillRect(x, y + h / 2 - h * 0.17, w, h * 0.34);
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(x + w / 2 - h * 0.1, y, h * 0.2, h);
    ctx.fillRect(x, y + h / 2 - h * 0.1, w, h * 0.2);
  }
  ctx.restore();
}

export class Hud {
  /** Draws the in-game HUD and returns its clickable buttons (pause). */
  draw(ctx: CanvasRenderingContext2D, v: HudView): Button[] {
    this.lives(ctx, v);
    this.center(ctx, v);
    const scoreW = this.score(ctx, v);
    this.flashes(ctx, v);
    if (v.announcement) this.announce(ctx, v);
    if (v.tutorial) this.tutorialCard(ctx, v);
    if (v.tutorial?.tutorial.reading) this.readingBanner(ctx, v);
    if (v.coach) this.coachPanel(ctx, v);
    const toggles = this.toggles(ctx, v);
    if (v.debug) this.debugOverlay(ctx, v);
    if (v.portrait) this.rotateHint(ctx, v.width, v.height);
    return v.paused === undefined ? [] : [this.pauseButton(ctx, v, scoreW), ...toggles];
  }

  /** Pause / resume button left of the score, so mouse players can stop and read. */
  private pauseButton(ctx: CanvasRenderingContext2D, v: HudView, scoreW: number): Button {
    ctx.font = `700 14px ${FONT}`;
    const label = t(v.paused ? 'hud.resume' : 'hud.pause');
    const bw = ctx.measureText(label).width + 26;
    const b: Button = { id: 'pause', x: v.width - 24 - scoreW - 20 - bw, y: 14, w: bw, h: 34 };
    ctx.fillStyle = v.paused ? 'rgba(255,215,90,0.28)' : 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 8);
    ctx.fill();
    ctx.strokeStyle = v.paused ? '#ffd75a' : 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(label, b.x + b.w / 2, b.y + 22);
    return b;
  }

  /**
   * Small switches for guide rings and coach (also for touch screens, where V and C are missing).
   * In the tutorial they only show the state: the tutorial decides itself.
   */
  private toggles(ctx: CanvasRenderingContext2D, v: HudView): Button[] {
    const on = (b: boolean) => t(b ? 'hud.on' : 'hud.off');
    const items = [
      { id: 'toggle:coach', label: t('hud.toggleCoach', { state: on(v.coachOn) }), active: v.coachOn },
      { id: 'toggle:guide', label: t('hud.toggleGuide', { state: on(v.guideOn) }), active: v.guideOn },
    ];
    ctx.font = `600 12px ${FONT}`;
    ctx.textAlign = 'center';
    const buttons: Button[] = [];
    let x = v.width - 16;
    for (const it of items) {
      const bw = ctx.measureText(it.label).width + 20;
      x -= bw;
      const b: Button = { id: it.id, x, y: 80, w: bw, h: 22 };
      ctx.fillStyle = it.active ? 'rgba(140,220,255,0.18)' : 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 11);
      ctx.fill();
      ctx.strokeStyle = it.active ? 'rgba(140,220,255,0.6)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = it.active ? '#e6f7ff' : 'rgba(255,255,255,0.55)';
      ctx.fillText(it.label, b.x + b.w / 2, b.y + 15);
      if (!v.tutorial) buttons.push(b);
      x -= 8;
    }
    return buttons;
  }

  /** On a phone held upright the lanes get very narrow: ask to turn it. */
  rotateHint(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (h <= w) return;
    ctx.font = `700 14px ${FONT}`;
    const text = t('hud.rotate');
    const lines = wrapText(ctx, text, w - 48);
    const bh = 16 + lines.length * 20;
    const y = h - bh - 40;
    ctx.fillStyle = 'rgba(20,16,40,0.92)';
    ctx.beginPath();
    ctx.roundRect(16, y, w - 32, bh, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,90,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd75a';
    lines.forEach((l, i) => ctx.fillText(l, w / 2, y + 24 + i * 20));
  }

  private tutorialCard(ctx: CanvasRenderingContext2D, v: HudView): void {
    const tut = v.tutorial!.tutorial;
    const total = v.tutorial!.total;
    const step = tut.step;
    const x = 16;
    const y = 84;
    const w = Math.min(540, v.width * 0.42);
    const pad = 16;
    ctx.font = `500 14px ${FONT}`;
    const body = stepLines(step).flatMap((l) => wrapText(ctx, l, w - pad * 2));
    ctx.font = `700 14px ${FONT}`;
    const task = wrapText(ctx, '▶ ' + stepTask(step), w - pad * 2);
    const hasGoal = Number.isFinite(step.goal);
    const h = pad * 2 + 26 + body.length * 20 + 10 + task.length * 20 + (hasGoal || tut.reading ? 22 : 0) + 18;
    panel(ctx, x, y, w, h, tut.complete ? 'rgba(140,255,170,0.8)' : 'rgba(255,215,90,0.6)');

    let yy = y + pad + 16;
    ctx.textAlign = 'left';
    ctx.font = `600 12px ${FONT}`;
    ctx.fillStyle = 'rgba(255,215,90,0.85)';
    ctx.fillText(t('tutorial.header', { n: tut.index + 1, total }), x + pad, yy - 12);
    ctx.font = `800 18px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(stepTitle(step), x + pad, yy + 8);
    yy += 30;
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const l of body) {
      ctx.fillText(l, x + pad, yy);
      yy += 20;
    }
    yy += 10;
    ctx.font = `700 14px ${FONT}`;
    ctx.fillStyle = tut.complete ? '#8cffaa' : '#ffd75a';
    for (const l of task) {
      ctx.fillText(l, x + pad, yy);
      yy += 20;
    }
    if (tut.reading) {
      // Reading phase: nothing moves until the player is ready
      const pulse = 0.65 + 0.35 * Math.sin(v.now * 4);
      ctx.font = `800 16px ${FONT}`;
      ctx.fillStyle = `rgba(255,215,90,${pulse})`;
      ctx.fillText(t('tutorial.readyButton'), x + pad, yy + 6);
      yy += 22;
    } else if (hasGoal) {
      if (tut.complete) {
        ctx.fillStyle = '#8cffaa';
        ctx.font = `800 15px ${FONT}`;
        ctx.fillText(t('tutorial.stepDone'), x + pad, yy + 4);
      } else {
        for (let i = 0; i < step.goal; i++) {
          ctx.fillStyle = i < tut.state.progress ? '#8cffaa' : 'rgba(255,255,255,0.2)';
          ctx.beginPath();
          ctx.arc(x + pad + 7 + i * 20, yy, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      yy += 22;
    }
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(t(tut.isLast ? 'tutorial.footerLast' : 'tutorial.footer'), x + pad, yy + 2);
  }

  /** Banner during the tutorial reading phase. */
  private readingBanner(ctx: CanvasRenderingContext2D, v: HudView): void {
    const y = v.height * 0.8 - 70;
    ctx.fillStyle = 'rgba(10,8,24,0.75)';
    ctx.fillRect(0, y - 26, v.width, 40);
    ctx.textAlign = 'center';
    ctx.font = `700 17px ${FONT}`;
    ctx.fillStyle = `rgba(255,215,90,${0.7 + 0.3 * Math.sin(v.now * 4)})`;
    ctx.fillText(t('tutorial.readyHint'), v.width / 2, y);
  }

  private coachPanel(ctx: CanvasRenderingContext2D, v: HudView): void {
    const c = v.coach!;
    const show = c.explanation && c.age < 10;
    if (!show && !c.tip && !c.fits) return;
    const w = Math.min(440, v.width * 0.34);
    const x = v.width - w - 16;
    const y = 104;
    const pad = 14;

    const lines: { text: string; color: string; font: string }[] = [];
    const add = (text: string, color: string, font: string) => {
      ctx.font = font;
      for (const l of wrapText(ctx, text, w - pad * 2)) lines.push({ text: l, color, font });
    };
    const small = `500 13px ${FONT}`;
    if (c.fits) {
      const f = c.fits;
      add(t('hud.fitsTitle', { chord: f.chord, notes: f.notes }), '#ffd75a', `800 14px ${FONT}`);
      add(t('hud.fitsKeys', { keys: f.keys }), 'rgba(255,255,255,0.85)', small);
      add(t('hud.fitsWhy', { chord: f.chord }), 'rgba(255,255,255,0.55)', small);
    }
    if (c.tip) {
      if (lines.length) lines.push({ text: '', color: '#fff', font: small });
      add('💡 ' + c.tip, '#ffd75a', `700 13px ${FONT}`);
    }
    if (show) {
      const e = c.explanation!;
      const color = e.verdict === 'good' ? '#8cffaa' : e.verdict === 'ok' ? '#9fd8ff' : '#ff8a8a';
      if (lines.length) lines.push({ text: '', color, font: small });
      add(e.headline, color, `800 15px ${FONT}`);
      add(e.why, 'rgba(255,255,255,0.85)', small);
      for (const d of e.details) add('• ' + d, 'rgba(255,255,255,0.6)', small);
    }
    const h = pad * 2 + lines.length * 18;
    panel(ctx, x, y, w, h, 'rgba(160,200,255,0.35)');
    ctx.textAlign = 'left';
    let yy = y + pad + 13;
    for (const l of lines) {
      ctx.font = l.font;
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, x + pad, yy);
      yy += 18;
    }
  }

  private lives(ctx: CanvasRenderingContext2D, v: HudView): void {
    const p = v.player;
    for (let i = 0; i < p.maxLives; i++) {
      heart(ctx, 28 + i * 30, 18, 22, i < p.lives ? '#ff5a7a' : 'rgba(255,255,255,0.15)');
    }
    let x = 24;
    const y = 58;
    ctx.font = `600 13px ${FONT}`;
    ctx.textAlign = 'left';
    if (p.shield) {
      ctx.fillStyle = '#78dcff';
      const label = t('hud.shield');
      ctx.fillText(label, x, y);
      x += ctx.measureText(label).width + 14;
    }
    if (p.doubleJump) {
      ctx.fillStyle = '#c8f0ff';
      ctx.fillText(t('hud.doubleJump'), x, y);
    }
    // Regeneration progress
    if (p.lives < p.maxLives && v.regenProgress > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(24, 68, 140, 4);
      ctx.fillStyle = '#ff5a7a';
      ctx.fillRect(24, 68, 140 * v.regenProgress, 4);
    }
  }

  private center(ctx: CanvasRenderingContext2D, v: HudView): void {
    const cx = v.width / 2;
    const { pos } = v;
    const hue = pitchHue(pos.chord.root);
    ctx.textAlign = 'center';

    ctx.font = `800 40px ${FONT}`;
    ctx.fillStyle = `hsl(${hue}, 85%, 72%)`;
    ctx.fillText(pos.chord.name, cx, 48);
    const w = ctx.measureText(pos.chord.name).width;
    ctx.textAlign = 'left';
    ctx.font = `600 14px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(pos.chord.roman, cx + w / 2 + 8, 30);
    ctx.fillText(`→ ${pos.nextChord.name}`, cx + w / 2 + 8, 48);

    ctx.textAlign = 'center';
    ctx.font = `500 13px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const s = pos.section;
    ctx.fillText(
      `${sectionName(s)} · ${t('music.sectionInfo', { key: keyName(s.key), bpm: s.bpm, beats: s.beatsPerBar })}`,
      cx,
      70,
    );

    // Beat dots
    const bpb = s.beatsPerBar;
    const cur = Math.floor(pos.beatInBar + 1e-6);
    const frac = pos.beatInBar - cur;
    for (let i = 0; i < bpb; i++) {
      const x = cx + (i - (bpb - 1) / 2) * 22;
      const active = i === cur;
      const r = active ? 7 - 3 * frac : 4;
      ctx.fillStyle = active ? (i === 0 ? '#ffd75a' : '#ffffff') : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(x, 88, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Resonance bar
    const bw = Math.min(360, v.width * 0.5);
    const bx = cx - bw / 2;
    const by = 104;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, 10, 5);
    ctx.fill();
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#6a5acd');
    grad.addColorStop(0.5, '#3fd0c9');
    grad.addColorStop(1, '#ffd75a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(10, (bw * v.resonance) / 100), 10, 5);
    ctx.fill();
    ctx.font = `600 11px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(t('hud.resonance', { n: Math.round(v.resonance) }), cx, by + 26);
  }

  /** Score and info at the top right; returns the width of the score number. */
  private score(ctx: CanvasRenderingContext2D, v: HudView): number {
    ctx.textAlign = 'right';
    ctx.font = `800 24px ${FONT}`;
    ctx.fillStyle = '#fff';
    const scoreText = String(Math.floor(v.score));
    ctx.fillText(scoreText, v.width - 24, 40);
    const scoreW = ctx.measureText(scoreText).width;
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(t('hud.bar', { n: Math.max(0, v.pos.bar + 1) }), v.width - 24, 58);
    ctx.fillText(
      t('hud.keyboard', {
        mode: t(v.scaleMode ? 'hud.modeScale' : 'hud.modePiano'),
        octave: Math.floor(v.octaveBase / 12) - 1,
        velocity: v.velocity.toFixed(2),
      }),
      v.width - 24,
      74,
    );
    return scoreW;
  }

  private flashes(ctx: CanvasRenderingContext2D, v: HudView): void {
    ctx.textAlign = 'center';
    let i = 0;
    for (const f of v.flashes) {
      const k = (v.now - f.born) / 1.2;
      if (k > 1) continue;
      ctx.globalAlpha = 1 - k;
      ctx.font = `800 22px ${FONT}`;
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, v.width * 0.28, v.height * 0.8 - 120 - k * 40 - i * 26);
      i++;
    }
    ctx.globalAlpha = 1;
  }

  private announce(ctx: CanvasRenderingContext2D, v: HudView): void {
    const a = v.announcement!;
    const cx = v.width / 2;
    const y = v.height * 0.32;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, y - 40, v.width, 74);
    ctx.textAlign = 'center';
    ctx.font = `800 26px ${FONT}`;
    ctx.fillStyle = '#ffd75a';
    const n = Math.ceil(a.beatsLeft);
    ctx.fillText(`${a.title}${n <= 4 ? '  ' + n : ''}`, cx, y - 6);
    ctx.font = `500 15px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(a.detail, cx, y + 20);
  }

  /** Developer overlay (F3); intentionally not localized. */
  private debugOverlay(ctx: CanvasRenderingContext2D, v: HudView): void {
    const x = 16;
    let y = 100;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 8, y - 16, 330, 250);
    ctx.textAlign = 'left';
    ctx.font = `12px ui-monospace, Consolas, monospace`;
    ctx.fillStyle = '#9f9';
    ctx.fillText(`beat ${v.beat.toFixed(2)}  latency ${v.latencyMs}ms  offset ${v.userOffsetMs}ms ([ ])`, x, y);
    y += 18;
    ctx.fillStyle = '#ccc';
    ctx.fillText('Note  Q     Harm Int  Bon  Tim  Spam  =Score  Δms', x, y);
    y += 14;
    for (const n of v.history.slice(-12).reverse()) {
      const p = n.parts;
      ctx.fillStyle = n.score >= 0 ? '#cfc' : '#fcc';
      ctx.fillText(
        `${noteName(n.midi).padEnd(5)} ${n.quality.slice(0, 5).padEnd(5)} ${p.harmony.toFixed(0).padStart(3)} ${p.interval
          .toFixed(1)
          .padStart(4)} ${p.bonus.toFixed(1).padStart(4)} ${p.timing.toFixed(2)} ${p.spam.toFixed(2)} ${n.score
          .toFixed(1)
          .padStart(6)} ${String(n.timingErrorMs).padStart(5)}`,
        x,
        y,
      );
      y += 15;
    }
  }

  /** Title screen; returns the clickable buttons (language flags, tutorial, play). */
  drawTitle(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    now: number,
    best: number,
    tutorialDone: boolean,
    tempo: string,
    sound: { mode: string; state: string; progress: number },
  ): Button[] {
    ctx.fillStyle = 'rgba(8,6,20,0.72)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.font = `900 64px ${FONT}`;
    ctx.fillStyle = `hsl(${(now * 40) % 360}, 80%, 72%)`;
    const titleY = h * 0.17;
    ctx.fillText(t('title.name'), w / 2, titleY);
    ctx.font = `500 18px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    tl('title.tagline').forEach((l, i) => ctx.fillText(l, w / 2, titleY + 44 + i * 26));

    const buttons: Button[] = [];

    // "Understanding music" button (top right)
    ctx.font = `700 15px ${FONT}`;
    const theoryLabel = `${t('theory.title')}  (I)`;
    const thw = ctx.measureText(theoryLabel).width + 28;
    const theoryBtn: Button = { id: 'theory', x: w - thw - 20, y: 20, w: thw, h: 40 };
    ctx.fillStyle = 'rgba(140,220,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(theoryBtn.x, theoryBtn.y, theoryBtn.w, theoryBtn.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,220,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#cfefff';
    ctx.fillText(theoryLabel, theoryBtn.x + theoryBtn.w / 2, theoryBtn.y + 26);
    buttons.push(theoryBtn);

    // "Licenses & sources" button (top left): attribution for the CC BY samples
    const creditsLabel = t('credits.button');
    const crw = ctx.measureText(creditsLabel).width + 28;
    const creditsBtn: Button = { id: 'credits', x: 20, y: 20, w: crw, h: 40 };
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(creditsBtn.x, creditsBtn.y, creditsBtn.w, creditsBtn.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText(creditsLabel, creditsBtn.x + creditsBtn.w / 2, creditsBtn.y + 26);
    buttons.push(creditsBtn);

    // Language selection: big, obvious flags
    const fw = 84;
    const fh = 54;
    const fgap = 28;
    const fy = titleY + 112;
    ctx.font = `700 13px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(LOCALES.map((l) => t('language', undefined, l)).join(' / ') + ' 🌐', w / 2, fy - 10);
    const totalW = LOCALES.length * fw + (LOCALES.length - 1) * fgap;
    LOCALES.forEach((loc, i) => {
      const x = w / 2 - totalW / 2 + i * (fw + fgap);
      const active = loc === getLocale();
      if (active) {
        ctx.fillStyle = 'rgba(255,215,90,0.25)';
        ctx.beginPath();
        ctx.roundRect(x - 8, fy - 6, fw + 16, fh + 34, 10);
        ctx.fill();
      }
      ctx.globalAlpha = active ? 1 : 0.55;
      drawFlag(ctx, loc, x, fy, fw, fh);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = active ? '#ffd75a' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(x, fy, fw, fh, 4);
      ctx.stroke();
      ctx.font = `${active ? 800 : 500} 13px ${FONT}`;
      ctx.fillStyle = active ? '#ffd75a' : 'rgba(255,255,255,0.7)';
      ctx.fillText(t('language', undefined, loc), x + fw / 2, fy + fh + 19);
      buttons.push({ id: `lang:${loc}`, x: x - 8, y: fy - 6, w: fw + 16, h: fh + 34 });
    });

    // Main buttons
    const gap = 20;
    const bw = Math.min(280, (w - 40 - gap * 2) / 3);
    const bh = 64;
    const by = fy + fh + 60;
    const ids = ['tutorial', 'campaign', 'play'];
    const main: Button[] = ids.map((id, i) => ({
      id,
      x: w / 2 - (bw * 3 + gap * 2) / 2 + i * (bw + gap),
      y: by,
      w: bw,
      h: bh,
    }));
    const labels: Record<string, [string, string]> = {
      tutorial: [t('title.tutorial'), t(tutorialDone ? 'title.tutorialHintDone' : 'title.tutorialHintNew')],
      campaign: [t('title.campaign'), t('title.campaignHint')],
      play: [t('title.play'), t('title.playHint')],
    };
    const recommended = tutorialDone ? 'campaign' : 'tutorial';
    for (const b of main) {
      const rec = b.id === recommended;
      const pulse = rec ? 0.5 + 0.5 * Math.sin(now * 4) : 0;
      ctx.fillStyle = rec ? `rgba(255,215,90,${0.18 + 0.1 * pulse})` : 'rgba(255,255,255,0.07)';
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 14);
      ctx.fill();
      ctx.strokeStyle = rec ? '#ffd75a' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = `800 24px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.fillText(labels[b.id][0], b.x + b.w / 2, b.y + 30);
      ctx.font = `500 13px ${FONT}`;
      ctx.fillStyle = rec ? '#ffd75a' : 'rgba(255,255,255,0.6)';
      ctx.fillText(labels[b.id][1], b.x + b.w / 2, b.y + 50);
    }
    buttons.push(...main);

    // Game speed selection
    const tempos = ['slow', 'medium', 'original'];
    const tw = 130;
    const th = 34;
    const tgap = 10;
    const ty = by + bh + 22;
    ctx.font = `700 14px ${FONT}`;
    const tLabel = t('title.tempo');
    const labelW = ctx.measureText(tLabel).width + 14;
    const rowW = labelW + tempos.length * tw + (tempos.length - 1) * tgap;
    const rowX = w / 2 - rowW / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(tLabel, rowX, ty + 22);
    ctx.textAlign = 'center';
    tempos.forEach((id, i) => {
      const x = rowX + labelW + i * (tw + tgap);
      const active = id === tempo;
      ctx.fillStyle = active ? 'rgba(140,220,255,0.25)' : 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(x, ty, tw, th, 8);
      ctx.fill();
      ctx.strokeStyle = active ? '#8cdcff' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = active ? 2 : 1;
      ctx.stroke();
      ctx.font = `${active ? 800 : 500} 14px ${FONT}`;
      ctx.fillStyle = active ? '#fff' : 'rgba(255,255,255,0.7)';
      ctx.fillText(t(`title.tempos.${id}`), x + tw / 2, ty + 22);
      buttons.push({ id: `tempo:${id}`, x, y: ty, w: tw, h: th });
    });

    // Sound selection: synthesizer (default) or recorded samples
    const sy = ty + th + 12;
    ctx.font = `700 14px ${FONT}`;
    const sLabel = t('title.sound');
    const sLabelW = ctx.measureText(sLabel).width + 14;
    const sounds = ['synth', 'samples'];
    const sw = 170;
    const sRowW = sLabelW + sounds.length * sw + tgap;
    const sRowX = w / 2 - sRowW / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(sLabel, sRowX, sy + 22);
    ctx.textAlign = 'center';
    sounds.forEach((id, i) => {
      const x = sRowX + sLabelW + i * (sw + tgap);
      const active = id === sound.mode;
      ctx.fillStyle = active ? 'rgba(140,220,255,0.25)' : 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(x, sy, sw, th, 8);
      ctx.fill();
      ctx.strokeStyle = active ? '#8cdcff' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = active ? 2 : 1;
      ctx.stroke();
      ctx.font = `${active ? 800 : 500} 14px ${FONT}`;
      ctx.fillStyle = active ? '#fff' : 'rgba(255,255,255,0.7)';
      ctx.fillText(t(`title.sounds.${id}`), x + sw / 2, sy + 22);
      buttons.push({ id: `sound:${id}`, x, y: sy, w: sw, h: th });
    });
    if (sound.mode === 'samples') {
      ctx.font = `500 12px ${FONT}`;
      const status =
        sound.state === 'ready'
          ? t('title.soundReady')
          : sound.state === 'failed'
            ? t('title.soundFailed')
            : t('title.soundLoading', { percent: Math.round(sound.progress * 100) });
      ctx.fillStyle = sound.state === 'failed' ? '#ff8a8a' : sound.state === 'ready' ? '#8cffaa' : 'rgba(255,255,255,0.6)';
      ctx.fillText(status, w / 2, sy + th + 16);
    }

    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const help = tl('title.help');
    const helpY = sy + th + 44;
    help.forEach((l, i) => ctx.fillText(l, w / 2, helpY + i * 24));
    if (best > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(t('title.best', { n: Math.floor(best) }), w / 2, helpY + help.length * 24 + 16);
    }
    // Attribution for the CC BY samples (required by the license)
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const creditsLine = t('title.credits');
    ctx.fillText(creditsLine, w / 2, h - 14);
    const clw = ctx.measureText(creditsLine).width;
    // The line itself is clickable too
    buttons.push({ id: 'credits', x: w / 2 - clw / 2, y: h - 30, w: clw, h: 24 });
    return buttons;
  }

  /**
   * Style selection for the endless mode: a grid of cards ("mixed" + every style),
   * each with the style's name and what its groove is about.
   */
  drawStyleSelect(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    now: number,
    styles: readonly string[],
    selected: string,
  ): Button[] {
    const buttons: Button[] = [];
    ctx.fillStyle = 'rgba(8,6,20,0.82)';
    ctx.fillRect(0, 0, w, h);

    // Back button
    ctx.textAlign = 'left';
    ctx.font = `600 15px ${FONT}`;
    const backLabel = t('endless.back');
    const backW = ctx.measureText(backLabel).width + 24;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(20, 20, backW, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(backLabel, 32, 43);
    buttons.push({ id: 'back', x: 20, y: 20, w: backW, h: 36 });

    ctx.textAlign = 'center';
    ctx.font = `900 30px ${FONT}`;
    ctx.fillStyle = '#ffd75a';
    ctx.fillText(t('endless.title'), w / 2, 48);
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(t('endless.hint'), w / 2, 74);

    const cols = STYLE_GRID_COLS;
    const gap = 14;
    const cw = Math.min(280, (w - 40 - gap * (cols - 1)) / cols);
    const ch = 104;
    const rows = Math.ceil(styles.length / cols);
    const gridW = cols * cw + (cols - 1) * gap;
    const top = Math.max(96, Math.min(120, (h - rows * (ch + gap) - 60) / 2));
    styles.forEach((id, i) => {
      const x = w / 2 - gridW / 2 + (i % cols) * (cw + gap);
      const y = top + Math.floor(i / cols) * (ch + gap);
      const active = id === selected;
      const pulse = active ? 0.5 + 0.5 * Math.sin(now * 4) : 0;
      ctx.fillStyle = active ? `rgba(255,215,90,${0.16 + 0.08 * pulse})` : 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(x, y, cw, ch, 12);
      ctx.fill();
      ctx.strokeStyle = active ? '#ffd75a' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = active ? 2.5 : 1;
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.font = `800 19px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.fillText(t(`endless.styles.${id}.name`), x + 14, y + 30);
      ctx.textAlign = 'right';
      ctx.font = `600 13px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      // Number keys 1–9 and 0 select the first ten cards
      if (i < 10) ctx.fillText(String((i + 1) % 10), x + cw - 12, y + 26);
      ctx.textAlign = 'left';
      ctx.font = `500 13px ${FONT}`;
      ctx.fillStyle = active ? '#ffe9a8' : 'rgba(255,255,255,0.68)';
      wrapText(ctx, t(`endless.styles.${id}.hint`), cw - 28)
        .slice(0, 3)
        .forEach((l, j) => ctx.fillText(l, x + 14, y + 52 + j * 17));
      buttons.push({ id: `style:${id}`, x, y, w: cw, h: ch });
    });

    ctx.textAlign = 'center';
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(t('endless.keys'), w / 2, top + rows * (ch + gap) + 20);
    return buttons;
  }

  /**
   * Campaign map: a timeline of chapters (historical order), details of the
   * selected chapter with history text, Wikipedia link and level buttons.
   */
  drawMap(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    now: number,
    chapters: ChapterDef[],
    selected: number,
    progress: Progress,
  ): Button[] {
    const buttons: Button[] = [];
    ctx.fillStyle = 'rgba(8,6,20,0.82)';
    ctx.fillRect(0, 0, w, h);

    // Back button
    ctx.textAlign = 'left';
    ctx.font = `600 15px ${FONT}`;
    const backLabel = t('campaign.back');
    const backW = ctx.measureText(backLabel).width + 24;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(20, 20, backW, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(backLabel, 32, 43);
    buttons.push({ id: 'back', x: 20, y: 20, w: backW, h: 36 });

    ctx.textAlign = 'center';
    ctx.font = `900 30px ${FONT}`;
    ctx.fillStyle = '#ffd75a';
    ctx.fillText(t('campaign.title'), w / 2, 48);
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(t('campaign.hint'), w / 2, 72);

    // Timeline of chapter cards
    const n = chapters.length;
    const gap = 10;
    const cw = Math.min(150, (w - 40 - gap * (n - 1)) / n);
    const ch = 92;
    const cy = 96;
    const startX = w / 2 - (cw * n + gap * (n - 1)) / 2;
    ctx.strokeStyle = 'rgba(255,215,90,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, cy + ch / 2);
    ctx.lineTo(startX + cw * n + gap * (n - 1), cy + ch / 2);
    ctx.stroke();
    chapters.forEach((c, i) => {
      const x = startX + i * (cw + gap);
      const active = i === selected;
      const stars = c.levels.reduce((sum, l) => sum + (progress.stars[l.id] ?? 0), 0);
      ctx.globalAlpha = c.available ? 1 : 0.5;
      ctx.fillStyle = active ? 'rgba(255,215,90,0.22)' : 'rgba(30,24,60,0.95)';
      ctx.beginPath();
      ctx.roundRect(x, cy, cw, ch, 10);
      ctx.fill();
      ctx.strokeStyle = active ? '#ffd75a' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = active ? 2.5 : 1;
      ctx.stroke();
      ctx.font = `600 11px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(t(`campaign.chapters.${c.id}.years`), x + cw / 2, cy + 18);
      ctx.font = `800 13px ${FONT}`;
      ctx.fillStyle = '#fff';
      wrapText(ctx, t(`campaign.chapters.${c.id}.name`), cw - 10).forEach((l, li) => ctx.fillText(l, x + cw / 2, cy + 40 + li * 16));
      ctx.font = `600 12px ${FONT}`;
      if (c.available) {
        ctx.fillStyle = '#ffd75a';
        ctx.fillText(`★ ${stars}/${c.levels.length * 3}`, x + cw / 2, cy + ch - 10);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(`🔒 ${t('campaign.soon')}`, x + cw / 2, cy + ch - 10);
      }
      ctx.globalAlpha = 1;
      buttons.push({ id: `chapter:${i}`, x, y: cy, w: cw, h: ch });
    });

    // Details of the selected chapter
    const c = chapters[selected];
    const px = Math.max(20, w / 2 - 380);
    const pw = Math.min(760, w - 40);
    let y = cy + ch + 40;
    ctx.textAlign = 'left';
    ctx.font = `900 26px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(`${t(`campaign.chapters.${c.id}.name`)}  `, px, y);
    const nameW = ctx.measureText(`${t(`campaign.chapters.${c.id}.name`)}  `).width;
    ctx.font = `600 15px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(t(`campaign.chapters.${c.id}.years`), px + nameW, y);
    y += 28;
    ctx.font = `500 15px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const para of tl(`campaign.chapters.${c.id}.intro`)) {
      for (const l of wrapText(ctx, para, pw)) {
        ctx.fillText(l, px, y);
        y += 21;
      }
    }
    y += 8;
    ctx.font = `700 14px ${FONT}`;
    ctx.fillStyle = '#9fd8ff';
    ctx.fillText(t('campaign.whatsNew'), px, y);
    y += 21;
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const para of tl(`campaign.chapters.${c.id}.play`)) {
      for (const l of wrapText(ctx, '• ' + para, pw)) {
        ctx.fillText(l, px, y);
        y += 20;
      }
    }
    y += 12;

    // Wikipedia link
    ctx.font = `600 14px ${FONT}`;
    const wikiLabel = t('campaign.wiki');
    const ww = ctx.measureText(wikiLabel).width + 24;
    ctx.fillStyle = 'rgba(140,220,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(px, y, ww, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#8cdcff';
    ctx.fillText(wikiLabel, px + 12, y + 21);
    buttons.push({ id: 'wiki', x: px, y, w: ww, h: 32 });
    y += 52;

    // Level buttons
    if (!c.available) {
      ctx.font = `600 16px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(t('campaign.soonLong'), px, y + 10);
      return buttons;
    }
    const lw = Math.min(230, (pw - 20 * (c.levels.length - 1)) / c.levels.length);
    c.levels.forEach((level, i) => {
      const x = px + i * (lw + 20);
      const stars = progress.stars[level.id] ?? 0;
      const pulse = stars === 0 && i === c.levels.findIndex((l) => !progress.stars[l.id]) ? 0.1 * Math.sin(now * 4) : 0;
      ctx.fillStyle = `rgba(255,215,90,${0.14 + pulse})`;
      ctx.beginPath();
      ctx.roundRect(x, y, lw, 74, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,90,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = `800 16px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.fillText(t('campaign.level', { n: i + 1 }), x + lw / 2, y + 22);
      ctx.font = `500 12px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      const name = sectionName(level.sections[0]);
      ctx.fillText(wrapText(ctx, name, lw - 12)[0], x + lw / 2, y + 42);
      ctx.font = `700 16px ${FONT}`;
      ctx.fillStyle = '#ffd75a';
      ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), x + lw / 2, y + 64);
      buttons.push({ id: `level:${level.id}`, x, y, w: lw, h: 74 });
    });
    return buttons;
  }

  /** Shown when a campaign level is finished; returns its buttons. */
  drawLevelComplete(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    now: number,
    stars: number,
    score: number,
    avgResonance: number,
    hasNext: boolean,
    review: string[] = [],
  ): Button[] {
    ctx.fillStyle = 'rgba(8,6,20,0.78)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.font = `900 48px ${FONT}`;
    ctx.fillStyle = '#8cffaa';
    ctx.fillText(t('levelComplete.title'), w / 2, h * 0.28);
    // Stars pop in one after another
    ctx.font = `900 64px ${FONT}`;
    for (let i = 0; i < 3; i++) {
      const shown = i < stars;
      const s = shown ? 1 + 0.08 * Math.sin(now * 5 + i) : 1;
      ctx.save();
      ctx.translate(w / 2 + (i - 1) * 80, h * 0.28 + 80);
      ctx.scale(s, s);
      ctx.fillStyle = shown ? '#ffd75a' : 'rgba(255,255,255,0.2)';
      ctx.fillText('★', 0, 0);
      ctx.restore();
    }
    ctx.font = `600 20px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(t('levelComplete.stats', { score: Math.floor(score), resonance: Math.round(avgResonance) }), w / 2, h * 0.28 + 130);
    ctx.font = `500 13px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(t('levelComplete.starsHint'), w / 2, h * 0.28 + 158);
    const reviewH = this.drawReview(ctx, review, w, h * 0.28 + 190);

    const ids = hasNext ? ['next', 'retry', 'map'] : ['retry', 'map'];
    const bw = 220;
    const gap = 16;
    const by = h * 0.28 + 190 + reviewH;
    const startX = w / 2 - (ids.length * bw + (ids.length - 1) * gap) / 2;
    return ids.map((id, i) => {
      const x = startX + i * (bw + gap);
      const primary = i === 0;
      ctx.fillStyle = primary ? 'rgba(255,215,90,0.22)' : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(x, by, bw, 50, 12);
      ctx.fill();
      ctx.strokeStyle = primary ? '#ffd75a' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `700 16px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.fillText(t(`levelComplete.${id}`), x + bw / 2, by + 31);
      return { id, x, y: by, w: bw, h: 50 };
    });
  }

  drawGameOver(ctx: CanvasRenderingContext2D, w: number, h: number, now: number, score: number, bars: number, best: number, campaign = false, review: string[] = []): Button[] {
    ctx.fillStyle = 'rgba(8,6,20,0.75)';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.font = `900 54px ${FONT}`;
    ctx.fillStyle = '#ff7a8a';
    ctx.fillText(t('gameOver.title'), w / 2, h * 0.35);
    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(t('gameOver.stats', { score: Math.floor(score), bars }), w / 2, h * 0.35 + 50);
    ctx.font = `500 16px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(t('gameOver.best', { n: Math.floor(best) }), w / 2, h * 0.35 + 80);
    const reviewH = this.drawReview(ctx, review, w, h * 0.35 + 116);
    // Buttons (with their keys in the label), so touch players can go on as well
    const ids = campaign ? ['retry', 'map', 'menu'] : ['retry', 'menu'];
    const gap = 12;
    const bw = Math.min(200, (w - 32 - gap * (ids.length - 1)) / ids.length);
    const by = h * 0.35 + 104 + reviewH;
    const startX = w / 2 - (ids.length * bw + (ids.length - 1) * gap) / 2;
    return ids.map((id, i) => {
      const x = startX + i * (bw + gap);
      const primary = i === 0;
      const pulse = primary ? 0.22 + 0.1 * Math.sin(now * 4) : 0.08;
      ctx.fillStyle = primary ? `rgba(255,215,90,${pulse})` : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(x, by, bw, 48, 12);
      ctx.fill();
      ctx.strokeStyle = primary ? '#ffd75a' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `700 15px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(t(`gameOver.buttons.${id}`), x + bw / 2, by + 30);
      return { id, x, y: by, w: bw, h: 48 };
    });
  }

  /**
   * Review of the finished run (numbers, then a tip), centered and wrapped, with its first
   * baseline at `y`. Returns the height it used, so whatever follows can move down.
   */
  private drawReview(ctx: CanvasRenderingContext2D, review: string[], w: number, y: number): number {
    if (review.length === 0) return 0;
    ctx.textAlign = 'center';
    let used = 0;
    review.forEach((text, i) => {
      const tip = i === review.length - 1;
      ctx.font = `${tip ? 500 : 700} 15px ${FONT}`;
      ctx.fillStyle = tip ? '#ffd75a' : '#cfefff';
      for (const l of wrapText(ctx, text, Math.min(680, w - 40))) {
        ctx.fillText(l, w / 2, y + used);
        used += 22;
      }
    });
    return used + 14;
  }

  /** Dims the world while paused. Drawn *before* the HUD, so coach and tutorial texts stay readable. */
  dimForPause(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = 'rgba(8,6,20,0.45)';
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Small pause banner with buttons (low on the screen, so it does not cover the texts).
   * With `settings` it also shows the controls for volume, speed and sound.
   */
  drawPause(ctx: CanvasRenderingContext2D, w: number, h: number, settings?: PauseSettings): Button[] {
    const ids = ['resume', 'settings', 'theory', 'menu'];
    const bh = 38;
    const gap = 12;
    ctx.font = `700 15px ${FONT}`;
    const widths = ids.map((id) => ctx.measureText(t(`pause.buttons.${id}`)).width + 32);
    const rowW = widths.reduce((a, b) => a + b, 0) + gap * (ids.length - 1);
    const pw = Math.min(w - 32, Math.max(rowW + 40, settings ? 560 : 460));
    // The hint wraps onto several lines if the panel is too narrow for it
    ctx.font = `500 13px ${FONT}`;
    const hint = wrapText(ctx, t('pause.hint'), pw - 32);
    const lineH = 18;
    const rowH = 42;
    const optH = 34;
    const rows = settings ? (settings.tempo ? 4 : 3) : 0;
    const settingsH = rows ? rows * rowH + 6 : 0;
    const ph = 44 + hint.length * lineH + 12 + settingsH + bh + 14;
    const px = w / 2 - pw / 2;
    const py = Math.max(8, Math.round(h * 0.8) - ph - 24);
    panel(ctx, px, py, pw, ph, 'rgba(255,215,90,0.6)');
    ctx.textAlign = 'center';
    ctx.font = `900 24px ${FONT}`;
    ctx.fillStyle = '#ffd75a';
    ctx.fillText(t('pause.title'), w / 2, py + 34);
    ctx.font = `500 13px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    hint.forEach((l, i) => ctx.fillText(l, w / 2, py + 56 + i * lineH));

    const buttons: Button[] = [];

    if (settings) {
      const labelW = 150;
      const cx = px + 20 + labelW;
      const cw = pw - 40 - labelW;
      const og = 8;
      const label = (text: string, y: number) => {
        ctx.textAlign = 'left';
        ctx.font = `700 14px ${FONT}`;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText(text, px + 20, y + 22);
        ctx.textAlign = 'center';
      };
      const option = (id: string, text: string, x: number, y: number, bw: number, active: boolean) => {
        ctx.fillStyle = active ? 'rgba(140,220,255,0.25)' : 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(x, y, bw, optH, 8);
        ctx.fill();
        ctx.strokeStyle = active ? '#8cdcff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = active ? 2 : 1;
        ctx.stroke();
        ctx.font = `${active ? 800 : 500} 14px ${FONT}`;
        ctx.fillStyle = active ? '#fff' : 'rgba(255,255,255,0.7)';
        ctx.fillText(text, x + bw / 2, y + 22);
        buttons.push({ id, x, y, w: bw, h: optH });
      };
      let ry = py + 44 + hint.length * lineH + 8;
      for (const which of ['band', 'player'] as const) {
        label(t(`pause.settings.${which}`), ry);
        option(`pause:vol:${which}:-`, '−', cx, ry, 48, false);
        ctx.font = `800 15px ${FONT}`;
        ctx.fillStyle = '#fff';
        ctx.fillText(t('pause.settings.percent', { n: Math.round(settings[which] * 100) }), cx + 48 + 45, ry + 22);
        option(`pause:vol:${which}:+`, '+', cx + 48 + 90, ry, 48, false);
        ry += rowH;
      }
      if (settings.tempo) {
        label(t('title.tempo'), ry);
        const tempos = ['slow', 'medium', 'original'];
        const bw = (cw - og * (tempos.length - 1)) / tempos.length;
        tempos.forEach((id, i) => option(`pause:tempo:${id}`, t(`title.tempos.${id}`), cx + i * (bw + og), ry, bw, id === settings.tempo));
        ry += rowH;
      }
      label(t('title.sound'), ry);
      const sounds = ['synth', 'samples'];
      const sw = (cw - og) / 2;
      sounds.forEach((id, i) => option(`pause:sound:${id}`, t(`title.sounds.${id}`), cx + i * (sw + og), ry, sw, id === settings.sound));
    }

    let x = w / 2 - rowW / 2;
    const y = py + ph - bh - 12;
    ctx.textAlign = 'center';
    ids.forEach((id, i) => {
      const b: Button = { id: `pause:${id}`, x, y, w: widths[i], h: bh };
      const main = id === 'resume';
      const open = id === 'settings' && !!settings;
      ctx.fillStyle = main ? 'rgba(255,215,90,0.28)' : open ? 'rgba(140,220,255,0.25)' : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 8);
      ctx.fill();
      ctx.strokeStyle = main ? '#ffd75a' : open ? '#8cdcff' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `700 15px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.fillText(t(`pause.buttons.${id}`), b.x + b.w / 2, b.y + 25);
      buttons.push(b);
      x += widths[i] + gap;
    });
    return buttons;
  }
}
