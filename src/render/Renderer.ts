// Draws the background, note lanes, world (ground, obstacles, enemies, collectibles) and the runner.

import { GuideTarget } from '../game/Guide';
import { Marker } from '../game/Tutorial';
import { HIGH_MIDI, LANES, LOW_MIDI, midiToLaneX } from '../input/InputMapper';
import { MusicPosition, Song } from '../music/Song';
import { t } from '../i18n/i18n';
import { noteName, pcName, pitchClass, pitchHue, scalePitchClasses } from '../music/theory';
import { ENEMY_SIZE, Enemies } from '../world/Enemies';
import { LevelGen } from '../world/Level';
import { Obstacle, PLAYER_H, PLAYER_W, PX_PER_BEAT } from '../world/physics';
import { Player } from '../world/Player';
import { MONSTER_W, SPRITE_H, SPRITE_PALETTE, SPRITE_W, SpriteFrame, monsterPalette, monsterRows, spriteRows } from './sprites';

export interface WorldView {
  width: number;
  height: number;
  beat: number;
  now: number;
  resonance: number;
  /** 0–1, how much dissonance darkens the world */
  gloom: number;
  pos: MusicPosition;
  song: Song;
  level: LevelGen;
  player: Player;
  enemies: Enemies;
  mouseX: number;
  keyboardBase: number;
  scaleMode: boolean;
  guide: GuideTarget[];
  keyLabel: (midi: number) => string | undefined;
  /** Tutorial arrows above specific note lanes */
  markers: Marker[];
  /** MIDI notes currently held down (drawn as pressed keys) */
  pressed: number[];
}

export const KEYSTRIP_H = 24;

export function groundY(height: number): number {
  return Math.round(height * 0.8);
}

export function playerScreenX(width: number): number {
  return Math.round(width * 0.28);
}

/** Pitch classes of the black piano keys. */
const BLACK_KEYS = [1, 3, 6, 8, 10];

/** Size of one sprite pixel on screen. */
const SPRITE_PIXEL = 3;

export class Renderer {
  private spriteCache = new Map<SpriteFrame, HTMLCanvasElement>();

  /** Renders a sprite frame once into a small offscreen canvas (1 px per sprite pixel). */
  private sprite(frame: SpriteFrame): HTMLCanvasElement {
    let c = this.spriteCache.get(frame);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = SPRITE_W;
    c.height = SPRITE_H;
    const g = c.getContext('2d')!;
    spriteRows(frame).forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = SPRITE_PALETTE[row[x]];
        if (!color) continue;
        g.fillStyle = color;
        g.fillRect(x, y, 1, 1);
      }
    });
    this.spriteCache.set(frame, c);
    return c;
  }

  draw(ctx: CanvasRenderingContext2D, v: WorldView): void {
    this.background(ctx, v);
    this.lanes(ctx, v);
    this.beatGrid(ctx, v);
    this.world(ctx, v);
    this.drawPlayer(ctx, v);
    this.keyStrip(ctx, v);
    this.drawMarkers(ctx, v);
    this.drawGuide(ctx, v);
  }

  /** Tutorial arrows: highlight a whole lane and show note + key. */
  private drawMarkers(ctx: CanvasRenderingContext2D, v: WorldView): void {
    if (v.markers.length === 0) return;
    const laneW = v.width / LANES;
    const gy = groundY(v.height);
    const baseY = Math.round(v.height * 0.6);
    const bob = Math.sin(v.now * 5) * 6;
    // Stagger labels when arrows are close together
    const sorted = [...v.markers].sort((a, b) => a.midi - b.midi);
    sorted.forEach((m, i) => {
      const lane = m.midi - LOW_MIDI;
      if (lane < 0 || lane >= LANES) return;
      const x = (lane + 0.5) * laneW;
      const hue = pitchHue(m.midi);
      const crowded = i > 0 && m.midi - sorted[i - 1].midi < 3;
      const y = baseY + bob - (crowded && i % 2 === 1 ? 70 : 0);

      // highlight the whole lane
      ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${0.16 + 0.06 * Math.sin(v.now * 5)})`;
      ctx.fillRect(lane * laneW, 0, laneW, gy);
      ctx.strokeStyle = `hsla(${hue}, 90%, 75%, 0.9)`;
      ctx.lineWidth = 2;
      ctx.strokeRect(lane * laneW + 1, 0, laneW - 2, gy);

      // Label
      const key = v.keyLabel(m.midi);
      const title = noteName(m.midi);
      ctx.font = '800 15px system-ui, sans-serif';
      const lines = [m.label, title, key ? t('tutorial.markers.key', { key }) : t('tutorial.markers.mouseOnly')];
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 18;
      const h = 62;
      const bx = Math.max(4, Math.min(v.width - w - 4, x - w / 2));
      const by = y - h - 22;
      ctx.fillStyle = 'rgba(10,8,24,0.85)';
      ctx.beginPath();
      ctx.roundRect(bx, by, w, h, 8);
      ctx.fill();
      ctx.strokeStyle = `hsl(${hue}, 90%, 70%)`;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,230,160,0.95)';
      ctx.fillText(lines[0], bx + w / 2, by + 15);
      ctx.font = '800 17px system-ui, sans-serif';
      ctx.fillStyle = `hsl(${hue}, 90%, 78%)`;
      ctx.fillText(lines[1], bx + w / 2, by + 35);
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(lines[2], bx + w / 2, by + 53);

      // Arrow pointing down into the lane
      ctx.fillStyle = `hsl(${hue}, 90%, 70%)`;
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 18);
      ctx.lineTo(x + 10, y - 18);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fill();
    });
  }

  /** Guide rings: shrink until the beat, with note + key below. */
  private drawGuide(ctx: CanvasRenderingContext2D, v: WorldView): void {
    if (v.guide.length === 0) return;
    const y = Math.round(v.height * 0.42);
    const visible = v.guide.filter((t) => t.beat - v.beat < 2.2);
    // Melody path
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    visible
      .filter((t) => !t.hit && t.beat >= v.beat - 0.2)
      .forEach((t, i) => {
        const x = midiToLaneX(t.midi, v.width);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    for (const t of visible) {
      const x = midiToLaneX(t.midi, v.width);
      const hue = pitchHue(t.midi);
      const dt = t.beat - v.beat;
      if (t.hit) {
        const k = Math.min(1, (v.now - t.hitAt) / 0.5);
        ctx.strokeStyle = `rgba(140,255,170,${1 - k})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, 14 + k * 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(140,255,170,${1 - k})`;
        ctx.font = '800 20px system-ui, sans-serif';
        ctx.fillText('✓', x, y + 7);
        continue;
      }
      if (dt < -0.3) continue;
      const alpha = Math.max(0, Math.min(1, (2.2 - dt) / 0.6)) * (dt < 0 ? 1 + dt / 0.3 : 1);
      // Target circle
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.25 * alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 85%, 75%, ${0.9 * alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Approach ring
      if (dt > 0) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(255,255,255,${0.75 * alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 14 + dt * 36, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillText(pcName(pitchClass(t.midi)), x, y + 4);
      const key = v.keyLabel(t.midi);
      if (key) {
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillStyle = `rgba(255,230,160,${alpha * 0.9})`;
        ctx.fillText(`[${key}]`, x, y + 32);
      }
    }
  }

  private sx(v: WorldView, beat: number): number {
    return playerScreenX(v.width) + (beat - v.beat) * PX_PER_BEAT;
  }

  private background(ctx: CanvasRenderingContext2D, v: WorldView): void {
    const r = v.resonance / 100;
    const g = v.gloom;
    const hueTop = 255 - 60 * r;
    const sat = 25 + 35 * r - 20 * g;
    const grad = ctx.createLinearGradient(0, 0, 0, v.height);
    grad.addColorStop(0, `hsl(${hueTop}, ${sat}%, ${8 + 8 * r - 4 * g}%)`);
    grad.addColorStop(1, `hsl(${hueTop - 40 + 60 * r}, ${sat + 10}%, ${16 + 14 * r - 8 * g}%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, v.width, v.height);

    // Stars
    ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.4 * r})`;
    for (let i = 0; i < 60; i++) {
      const x = (((i * 977) % 1000) / 1000) * v.width - ((v.beat * 6) % v.width);
      const xx = ((x % v.width) + v.width) % v.width;
      const y = (((i * 613) % 1000) / 1000) * v.height * 0.55;
      const tw = 0.5 + 0.5 * Math.sin(v.now * 2 + i);
      ctx.fillRect(xx, y, 1.5 * tw + 0.5, 1.5 * tw + 0.5);
    }

    // Parallax hills
    const gy = groundY(v.height);
    const layers = [
      { speed: 0.15, amp: 60, base: gy - 120, light: 18, freq: 0.004 },
      { speed: 0.35, amp: 40, base: gy - 50, light: 24, freq: 0.007 },
    ];
    for (const L of layers) {
      ctx.fillStyle = `hsl(${hueTop - 20}, ${sat}%, ${L.light + 10 * r - 6 * g}%)`;
      ctx.beginPath();
      ctx.moveTo(0, v.height);
      const off = v.beat * PX_PER_BEAT * L.speed;
      for (let x = 0; x <= v.width + 20; x += 20) {
        const wx = x + off;
        const y = L.base - L.amp * (0.5 + 0.5 * Math.sin(wx * L.freq) * Math.cos(wx * L.freq * 0.37));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(v.width, v.height);
      ctx.fill();
    }
  }

  /**
   * The note lanes, drawn as a giant upright piano keyboard: ivory lanes are
   * The note lanes, drawn as a giant upright piano keyboard: ivory lanes are
   * the white keys, glossy dark lanes the black keys (with shadows on their
   * neighbors), a wooden fallboard with red felt on top and key fronts at the
   * bottom. Chord tones glow in color, out-of-key notes are dimmed, held notes
   * look pressed down. Every lane is equally wide (one semitone each), so the
   * mouse position maps linearly to the pitch.
   */
  private lanes(ctx: CanvasRenderingContext2D, v: WorldView): void {
    const laneW = v.width / LANES;
    const scale = scalePitchClasses(v.pos.section.key);
    const chord = v.pos.chord.pcs;
    const pulse = 1 - (((v.pos.beatInBar % 1) + 1) % 1);
    const gy = groundY(v.height);
    const top = 26; // below the fallboard
    const frontH = 18; // visible thickness of the key fronts
    const hoverLane = v.mouseX >= 0 ? Math.floor(v.mouseX / laneW) : -1;
    const isBlack = (midi: number) => BLACK_KEYS.includes(pitchClass(midi));

    // Key bodies (still slightly transparent so the scenery shows through)
    const ivory = ctx.createLinearGradient(0, top, 0, gy);
    ivory.addColorStop(0, 'rgba(250,244,228,0.34)');
    ivory.addColorStop(1, 'rgba(252,248,236,0.60)');
    const ebony = ctx.createLinearGradient(0, top, 0, gy);
    ebony.addColorStop(0, 'rgba(10,8,14,0.80)');
    ebony.addColorStop(1, 'rgba(18,16,24,0.92)');

    for (let i = 0; i < LANES; i++) {
      const midi = LOW_MIDI + i;
      const pc = pitchClass(midi);
      const black = isBlack(midi);
      const x = i * laneW;
      const pressed = v.pressed.includes(midi);

      ctx.fillStyle = black ? ebony : ivory;
      ctx.fillRect(x, top, laneW, gy - top);

      if (black) {
        // Glossy lacquer: a soft highlight stripe on the left of each black key
        const gloss = ctx.createLinearGradient(x, 0, x + laneW, 0);
        gloss.addColorStop(0, 'rgba(255,255,255,0)');
        gloss.addColorStop(0.22, 'rgba(255,255,255,0.13)');
        gloss.addColorStop(0.45, 'rgba(255,255,255,0)');
        ctx.fillStyle = gloss;
        ctx.fillRect(x + 2, top, laneW - 4, gy - top - frontH);
      }

      // Out-of-key notes are slightly dimmed
      if (!scale.includes(pc)) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x, top, laneW, gy - top);
      }

      // Chord tones glow in their note color
      if (chord.includes(pc)) {
        const hue = pitchHue(pc);
        const grad = ctx.createLinearGradient(0, top, 0, gy);
        grad.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.10)`);
        grad.addColorStop(1, `hsla(${hue}, 90%, 62%, ${0.42 + 0.12 * pulse})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, top, laneW, gy - top);
      }

      // Hover and pressed state
      if (pressed) {
        ctx.fillStyle = black ? 'rgba(170,170,220,0.45)' : 'rgba(255,255,255,0.45)';
        ctx.fillRect(x, top, laneW, gy - top);
        // inner shadow at the top: the key is pushed down
        const sh = ctx.createLinearGradient(0, top, 0, top + 40);
        sh.addColorStop(0, 'rgba(0,0,0,0.45)');
        sh.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sh;
        ctx.fillRect(x, top, laneW, 40);
      } else if (i === hoverLane) {
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fillRect(x, top, laneW, gy - top);
      }

      // Bevel: light left edge on white keys
      if (!black) {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(x + 1, top, 1, gy - top);
      }
    }

    // Second pass: shadows of the black keys on their white neighbors and the joints
    for (let i = 0; i < LANES; i++) {
      const midi = LOW_MIDI + i;
      const x = i * laneW;
      if (isBlack(midi)) {
        const sw = Math.min(8, laneW * 0.3);
        const right = ctx.createLinearGradient(x + laneW, 0, x + laneW + sw, 0);
        right.addColorStop(0, 'rgba(0,0,0,0.35)');
        right.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = right;
        ctx.fillRect(x + laneW, top, sw, gy - top - frontH);
        const left = ctx.createLinearGradient(x, 0, x - sw, 0);
        left.addColorStop(0, 'rgba(0,0,0,0.25)');
        left.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = left;
        ctx.fillRect(x - sw, top, sw, gy - top - frontH);
      }
      // Joint between two keys; between two white keys (E–F, B–C) it is a clear dark line
      const nextWhite = !isBlack(midi + 1) && !isBlack(midi);
      ctx.fillStyle = nextWhite ? 'rgba(40,30,20,0.85)' : 'rgba(0,0,0,0.55)';
      ctx.fillRect(Math.round(x + laneW) - 1, top, nextWhite ? 2 : 1, gy - top);
    }

    // Key fronts just above the ground (key thickness), with rounded corners
    ctx.textAlign = 'center';
    for (let i = 0; i < LANES; i++) {
      const midi = LOW_MIDI + i;
      const black = isBlack(midi);
      const x = i * laneW;
      const pressed = v.pressed.includes(midi);
      const h = pressed ? frontH * 0.4 : frontH;
      const front = ctx.createLinearGradient(0, gy - h, 0, gy);
      if (black) {
        front.addColorStop(0, 'rgba(70,66,80,0.95)');
        front.addColorStop(1, 'rgba(8,6,12,0.95)');
      } else {
        front.addColorStop(0, 'rgba(255,252,240,0.85)');
        front.addColorStop(1, 'rgba(200,190,170,0.85)');
      }
      ctx.fillStyle = front;
      ctx.beginPath();
      ctx.roundRect(x + 1.5, gy - h, laneW - 3, h, [0, 0, 4, 4]);
      ctx.fill();
      // Note name on every C, like the stickers on a beginner's piano
      if (pitchClass(midi) === 0 && laneW >= 14) {
        ctx.font = `700 ${Math.min(13, Math.floor(laneW * 0.5))}px system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(60,45,30,0.85)';
        ctx.fillText(noteName(midi), x + laneW / 2, gy - frontH - 6);
      }
    }

    // Fallboard at the top: dark polished wood with a few grain lines and a red felt strip
    const wood = ctx.createLinearGradient(0, 0, 0, top);
    wood.addColorStop(0, '#3a2214');
    wood.addColorStop(0.6, '#24140b');
    wood.addColorStop(1, '#140a05');
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, v.width, top);
    ctx.fillStyle = 'rgba(255,200,140,0.07)';
    for (let k = 0; k < 4; k++) ctx.fillRect(0, 4 + k * 5, v.width, 1);
    ctx.fillStyle = 'rgba(255,220,170,0.25)';
    ctx.fillRect(0, 0, v.width, 1);
    ctx.fillStyle = 'rgba(170,30,50,0.9)';
    ctx.fillRect(0, top - 4, v.width, 4);
  }

  private beatGrid(ctx: CanvasRenderingContext2D, v: WorldView): void {
    const gy = groundY(v.height);
    const first = Math.floor(v.beat - playerScreenX(v.width) / PX_PER_BEAT);
    const last = Math.ceil(v.beat + (v.width - playerScreenX(v.width)) / PX_PER_BEAT);
    for (let b = first; b <= last; b++) {
      const x = this.sx(v, b);
      const p = v.song.positionAt(b);
      const isBar = Math.abs(p.beatInBar) < 0.01;
      ctx.fillStyle = isBar ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.035)';
      ctx.fillRect(Math.round(x), isBar ? gy - 140 : gy - 60, isBar ? 2 : 1, isBar ? 140 : 60);
      if (isBar && p.barInSection === 0 && b >= 0) {
        // Section boundary
        ctx.fillStyle = 'rgba(255,220,120,0.25)';
        ctx.fillRect(Math.round(x) - 1, 0, 3, gy);
      }
    }
  }

  private world(ctx: CanvasRenderingContext2D, v: WorldView): void {
    const gy = groundY(v.height);
    const r = v.resonance / 100;
    const beatPulse = Math.max(0, 1 - (((v.beat % 1) + 1) % 1) * 3);

    // Ground with gaps
    const gaps = v.level.obstacles
      .filter((o) => o.kind === 'gap')
      .map((o) => [this.sx(v, o.beat), this.sx(v, o.beat + o.width)] as const)
      .filter(([a, b]) => b > 0 && a < v.width);
    const segs: [number, number][] = [];
    let cur = 0;
    for (const [a, b] of gaps) {
      if (a > cur) segs.push([cur, a]);
      cur = Math.max(cur, b);
    }
    if (cur < v.width) segs.push([cur, v.width]);
    const hue = pitchHue(v.pos.chord.root);
    for (const [a, b] of segs) {
      ctx.fillStyle = `hsl(${hue}, ${20 + 30 * r}%, ${14 + 6 * r}%)`;
      ctx.fillRect(a, gy, b - a, v.height - gy);
      ctx.fillStyle = `hsla(${hue}, 80%, ${50 + 20 * beatPulse}%, ${0.6 + 0.4 * beatPulse})`;
      ctx.fillRect(a, gy, b - a, 4 + 3 * beatPulse);
    }

    // Walls
    for (const o of v.level.obstacles) {
      if (o.kind !== 'wall') continue;
      const x = this.sx(v, o.beat);
      const w = o.width * PX_PER_BEAT;
      if (x > v.width || x + w < 0) continue;
      if (o.broken) continue;
      if (o.monster) {
        this.drawMonster(ctx, v, o, x, gy);
        continue;
      }
      ctx.globalAlpha = o.hit ? 0.35 : 1;
      ctx.fillStyle = '#3a2f4f';
      ctx.fillRect(x, gy - o.height, w, o.height);
      ctx.fillStyle = '#6f5c96';
      ctx.fillRect(x, gy - o.height, w, 5);
      // "Staff lines" on the wall
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let yy = gy - o.height + 14; yy < gy; yy += 14) ctx.fillRect(x + 3, yy, w - 6, 1);
      ctx.globalAlpha = 1;
    }

    // Collectible notes
    ctx.font = '26px serif';
    ctx.textAlign = 'center';
    for (const c of v.level.coins) {
      if (c.taken) continue;
      const x = this.sx(v, c.beat);
      if (x < -30 || x > v.width + 30) continue;
      const y = gy - c.height - PLAYER_H / 2 + Math.sin(v.now * 4 + c.beat) * 4;
      ctx.shadowColor = 'rgba(255,215,90,0.9)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffd75a';
      ctx.fillText('♫', x, y + 9);
      ctx.shadowBlur = 0;
    }

    // Sour notes (enemies)
    for (const e of v.enemies.list) {
      const x = this.sx(v, e.beat);
      if (x < -40 || x > v.width + 40) continue;
      const dead = !e.alive;
      const t = dead ? Math.min(1, (v.now - e.diedAt) / 0.4) : 0;
      const s = ENEMY_SIZE;
      const wob = Math.sin(v.now * 14 + e.wobble) * 2;
      ctx.save();
      ctx.translate(x, gy - (s / 2) * (1 - t * 0.7));
      ctx.scale(1 + t * 0.6, 1 - t * 0.7);
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#222';
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const rr = s / 2 + (i % 2 ? 4 : -1) + (i % 2 ? wob : 0);
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ff5a6e';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ff5a6e';
      ctx.fillRect(-7, -4, 4, 3);
      ctx.fillRect(3, -4, 4, 3);
      ctx.restore();
    }
  }

  /**
   * A pixel monster standing in the way. It hops on every beat (legs switch on the
   * off-beat), so it moves with the music. After biting the runner it fades out.
   */
  private drawMonster(ctx: CanvasRenderingContext2D, v: WorldView, o: Obstacle, x: number, gy: number): void {
    const m = o.monster!;
    const phase = ((v.beat % 1) + 1) % 1;
    const frame = phase < 0.5 ? 0 : 1;
    const hop = Math.round(Math.max(0, Math.sin(phase * Math.PI)) * m.scale * 1.5);
    const img = this.monsterSprite(m.shape, m.color, frame);
    const size = MONSTER_W * m.scale;
    ctx.globalAlpha = o.hit ? 0.4 : 1;
    // Shadow on the ground, smaller while hopping
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, gy + 2, size * (0.45 - hop / (size * 4)), 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x), Math.round(gy - size - hop), size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 1;
  }

  private monsterCache = new Map<string, HTMLCanvasElement>();

  /** Renders a monster frame once into a small offscreen canvas (1 px per sprite pixel). */
  private monsterSprite(shape: number, color: number, frame: number): HTMLCanvasElement {
    const id = `${shape}-${color}-${frame}`;
    let c = this.monsterCache.get(id);
    if (c) return c;
    const rows = monsterRows(shape, frame);
    const palette = monsterPalette(color);
    c = document.createElement('canvas');
    c.width = MONSTER_W;
    c.height = rows.length;
    const g = c.getContext('2d')!;
    rows.forEach((row, y) => {
      for (let px = 0; px < row.length; px++) {
        const col = palette[row[px]];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(px, y, 1, 1);
      }
    });
    this.monsterCache.set(id, c);
    return c;
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, v: WorldView): void {
    const p = v.player;
    const gy = groundY(v.height);
    const x = playerScreenX(v.width);
    const r = v.resonance / 100;
    if (p.invulnerable(v.now) && Math.floor(v.now * 12) % 2 === 0) return;

    // Squash & Stretch
    const sinceLand = v.now - p.landedAt;
    let sx = 1;
    let sy = 1;
    if (p.state === 'ground' && sinceLand < 0.15) {
      const k = 1 - sinceLand / 0.15;
      sx = 1 + 0.25 * k;
      sy = 1 - 0.2 * k;
    } else if (p.state === 'jump') {
      const k = Math.max(-1, Math.min(1, p.vyVisual / 8));
      sx = 1 - 0.1 * Math.abs(k);
      sy = 1 + 0.12 * Math.abs(k);
    }
    const bob = p.state === 'ground' ? Math.abs(Math.sin(v.beat * Math.PI)) * 3 : 0;
    const baseY = gy - p.y - bob;

    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(sx, sy);

    // Wings = double jump ready
    if (p.doubleJump) {
      ctx.fillStyle = 'rgba(200,240,255,0.85)';
      const flap = Math.sin(v.now * 14) * 0.4;
      for (const dir of [-1, 1]) {
        ctx.save();
        ctx.translate(dir * (PLAYER_W / 2 - 2), -PLAYER_H * 0.65);
        ctx.rotate(dir * (0.6 + flap));
        ctx.beginPath();
        ctx.ellipse(dir * 10, 0, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Golden glow behind the character, stronger with higher resonance
    if (r > 0.05) {
      const glow = ctx.createRadialGradient(0, -PLAYER_H / 2, 4, 0, -PLAYER_H / 2, PLAYER_H * 1.3);
      glow.addColorStop(0, `hsla(45, 100%, 65%, ${0.55 * r})`);
      glow.addColorStop(1, 'hsla(45, 100%, 65%, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -PLAYER_H / 2, PLAYER_H * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pixel-art girl (pre-rendered frames, scaled without smoothing)
    let frame: SpriteFrame;
    if (v.now - p.hurtAt < 0.5) frame = 'hurt';
    else if (p.state !== 'ground') frame = 'jump';
    else frame = Math.floor(v.beat * 2) % 2 === 0 ? 'runA' : 'runB';
    const img = this.sprite(frame);
    const scale = SPRITE_PIXEL;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round((-SPRITE_W * scale) / 2), -SPRITE_H * scale, SPRITE_W * scale, SPRITE_H * scale);
    ctx.imageSmoothingEnabled = true;

    // Shield
    if (p.shield) {
      ctx.strokeStyle = `rgba(120,220,255,${0.6 + 0.3 * Math.sin(v.now * 6)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -PLAYER_H / 2, PLAYER_H * 0.95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,220,255,0.10)';
      ctx.fill();
    }
    ctx.restore();
  }

  /** Mini keyboard at the bottom: shows lanes, chord tones and the keyboard range. */
  private keyStrip(ctx: CanvasRenderingContext2D, v: WorldView): void {
    const laneW = v.width / LANES;
    const y = v.height - KEYSTRIP_H;
    const scale = scalePitchClasses(v.pos.section.key);
    const chord = v.pos.chord.pcs;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, y - 16, v.width, KEYSTRIP_H + 16);
    ctx.textAlign = 'center';
    ctx.font = '600 10px system-ui, sans-serif';
    for (let i = 0; i < LANES; i++) {
      const midi = LOW_MIDI + i;
      const pc = pitchClass(midi);
      const black = BLACK_KEYS.includes(pc);
      const x = i * laneW;
      let fill = black ? '#2a2a33' : '#d9d9e0';
      if (scale.includes(pc)) fill = black ? '#4a4a60' : '#f2f2f7';
      if (chord.includes(pc)) fill = `hsl(${pitchHue(pc)}, 80%, ${black ? 45 : 65}%)`;
      ctx.fillStyle = fill;
      ctx.fillRect(x + 1, y, laneW - 2, KEYSTRIP_H - 2);
      if (pc === 0 || chord.includes(pc)) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(pcName(pc) + (pc === 0 ? String(Math.floor(midi / 12) - 1) : ''), x + laneW / 2, y - 4);
      }
      // Keyboard letter printed on the key
      const key = v.keyLabel(midi);
      if (key) {
        ctx.font = '700 10px system-ui, sans-serif';
        ctx.fillStyle = black || chord.includes(pc) ? '#fff' : '#222';
        ctx.fillText(key.length > 2 ? key.slice(0, 1) : key, x + laneW / 2, y + 15);
        ctx.font = '600 10px system-ui, sans-serif';
      }
    }
    // Keyboard range (A … ;)
    const kbLow = v.scaleMode ? v.keyboardBase + v.pos.section.key.tonic : v.keyboardBase;
    const kbHigh = kbLow + 16;
    const a = Math.max(LOW_MIDI, kbLow) - LOW_MIDI;
    const b = Math.min(HIGH_MIDI, kbHigh) - LOW_MIDI + 1;
    if (b > a) {
      ctx.strokeStyle = 'rgba(255,215,90,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(a * laneW + 1, y - 1, (b - a) * laneW - 2, KEYSTRIP_H);
    }
  }
}
