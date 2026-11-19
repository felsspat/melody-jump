// Flying notes: every played note becomes visible as a note symbol. Harmonic
// notes fly to the runner and orbit it as "energy"; dissonant ones fall down
// in grey. Consecutive notes of a phrase are connected by lines.

import { JudgedNote, NoteQuality } from '../music/HarmonyJudge';
import { noteName, pitchHue } from '../music/theory';

type Phase = 'pinned' | 'fly' | 'orbit' | 'fall';

interface Particle {
  noteId: number;
  midi: number;
  quality: NoteQuality;
  score: number;
  size: number;
  hue: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  released: number;
  held: boolean;
  phase: Phase;
  orbitAngle: number;
  orbitRadius: number;
  orbitSince: number;
  alpha: number;
  rot: number;
  link?: Particle;
  dead: boolean;
}

interface Ring {
  x: number;
  y: number;
  born: number;
  hue: number;
  good: boolean;
}

const ORBIT_LIFE = 4.5;
const MAX_ORBIT = 28;

export class NoteParticles {
  private list: Particle[] = [];
  private rings: Ring[] = [];
  private last?: Particle;

  get count(): number {
    return this.list.length;
  }

  /** Number of notes currently orbiting the runner (for effects). */
  get orbiting(): number {
    return this.list.filter((p) => p.phase === 'orbit').length;
  }

  spawn(noteId: number, judged: JudgedNote, x: number, y: number, now: number): void {
    const p: Particle = {
      noteId,
      midi: judged.midi,
      quality: judged.quality,
      score: judged.score,
      size: 0.8 + judged.velocity * 0.9,
      hue: pitchHue(judged.midi),
      x,
      y,
      vx: 0,
      vy: -40,
      born: now,
      released: Infinity,
      held: true,
      phase: 'pinned',
      orbitAngle: Math.random() * Math.PI * 2,
      orbitRadius: 46 + Math.random() * 46,
      orbitSince: 0,
      alpha: 1,
      rot: 0,
      dead: false,
    };
    if (this.last && !this.last.dead && now - this.last.born < 0.9 && judged.quality !== 'dissonant') {
      p.link = this.last;
    }
    this.last = p;
    this.list.push(p);
    this.rings.push({ x, y, born: now, hue: p.hue, good: judged.quality !== 'dissonant' });
  }

  /** Retroactive re-rating (e.g. a passing tone was resolved). */
  requalify(noteId: number, quality: NoteQuality): void {
    const p = this.list.find((q) => q.noteId === noteId);
    if (p && p.phase !== 'fall') p.quality = quality;
  }

  release(noteId: number, now: number): void {
    for (const p of this.list) {
      if (p.noteId === noteId && p.held) {
        p.held = false;
        p.released = now;
      }
    }
  }

  update(dt: number, now: number, px: number, py: number): void {
    let orbitCount = 0;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (p.phase === 'orbit') orbitCount++;
      if (p.phase === 'orbit' && orbitCount > MAX_ORBIT) p.orbitSince = Math.min(p.orbitSince, now - ORBIT_LIFE);
    }

    for (const p of this.list) {
      const age = now - p.born;
      switch (p.phase) {
        case 'pinned': {
          p.y += Math.sin(age * 12) * 0.3;
          if (!p.held && age > 0.12) p.phase = p.quality === 'dissonant' ? 'fall' : 'fly';
          else if (p.held && age > 0.12 && p.quality === 'dissonant') p.rot = Math.sin(age * 30) * 0.3;
          break;
        }
        case 'fly': {
          const tx = px + Math.cos(p.orbitAngle) * p.orbitRadius;
          const ty = py + Math.sin(p.orbitAngle) * p.orbitRadius * 0.6;
          const dx = tx - p.x;
          const dy = ty - p.y;
          const d = Math.hypot(dx, dy);
          const speed = 600 + 400 * Math.min(1, now - p.released);
          p.vx += ((dx / (d || 1)) * speed - p.vx) * Math.min(1, dt * 5);
          p.vy += ((dy / (d || 1)) * speed - p.vy) * Math.min(1, dt * 5);
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot = Math.atan2(p.vy, p.vx) * 0.15;
          if (d < 18) {
            p.phase = 'orbit';
            p.orbitSince = now;
          }
          break;
        }
        case 'orbit': {
          p.orbitAngle += dt * (1.6 + (p.midi % 5) * 0.15);
          const tx = px + Math.cos(p.orbitAngle) * p.orbitRadius;
          const ty = py + Math.sin(p.orbitAngle) * p.orbitRadius * 0.6;
          p.x += (tx - p.x) * Math.min(1, dt * 10);
          p.y += (ty - p.y) * Math.min(1, dt * 10);
          p.rot = Math.sin(now * 3 + p.orbitAngle) * 0.2;
          const life = now - p.orbitSince;
          if (life > ORBIT_LIFE) {
            p.alpha -= dt;
            p.orbitRadius += dt * 80;
          }
          break;
        }
        case 'fall': {
          p.vy += 900 * dt;
          if (p.vx === 0) p.vx = (Math.random() - 0.5) * 120;
          p.x += p.vx * dt + Math.sin(age * 25) * 1.5;
          p.y += p.vy * dt;
          p.rot += dt * 4;
          p.alpha -= dt * 0.8;
          break;
        }
      }
      if (p.alpha <= 0 || p.y > 4000) p.dead = true;
    }
    this.list = this.list.filter((p) => !p.dead);
    this.rings = this.rings.filter((r) => now - r.born < 0.6);
  }

  draw(ctx: CanvasRenderingContext2D, now: number, showLabels: boolean): void {
    // Rings at the point where the note was struck
    for (const r of this.rings) {
      const t = (now - r.born) / 0.6;
      ctx.strokeStyle = r.good ? `hsla(${r.hue}, 90%, 70%, ${1 - t})` : `rgba(160,160,170,${1 - t})`;
      ctx.lineWidth = 3 * (1 - t) + 0.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 8 + t * 46, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Phrase lines
    ctx.lineCap = 'round';
    for (const p of this.list) {
      const q = p.link;
      if (!q || q.dead || q.phase === 'fall' || p.phase === 'fall') continue;
      const a = Math.min(p.alpha, q.alpha) * 0.55;
      const grad = ctx.createLinearGradient(q.x, q.y, p.x, p.y);
      grad.addColorStop(0, `hsla(${q.hue}, 90%, 70%, ${a})`);
      grad.addColorStop(1, `hsla(${p.hue}, 90%, 70%, ${a})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      const mx = (q.x + p.x) / 2;
      const my = (q.y + p.y) / 2 - 18;
      ctx.quadraticCurveTo(mx, my, p.x, p.y);
      ctx.stroke();
    }

    for (const p of this.list) this.drawNote(ctx, p, now, showLabels);
  }

  private drawNote(ctx: CanvasRenderingContext2D, p: Particle, now: number, showLabels: boolean): void {
    const grey = p.quality === 'dissonant' && (p.phase === 'fall' || now - p.born > 0.12);
    const color = grey ? `rgba(150,150,160,${p.alpha})` : `hsla(${p.hue}, 85%, ${p.quality === 'chord' ? 68 : 60}%, ${p.alpha})`;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    const s = p.size * (p.held ? 1.15 + Math.sin(now * 10) * 0.05 : 1);
    ctx.scale(s, s);
    if (p.quality === 'chord' && !grey) {
      ctx.shadowColor = `rgba(255, 215, 90, ${p.alpha})`;
      ctx.shadowBlur = 16;
    } else if (p.quality === 'blue') {
      // Blue notes get a deep blue glow
      ctx.shadowColor = `rgba(80, 140, 255, ${p.alpha})`;
      ctx.shadowBlur = 16;
    } else if (p.quality === 'scale' || p.quality === 'passing') {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    // Note head
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 5.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Stem
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6.5, -2);
    ctx.lineTo(6.5, -24);
    // Flag
    ctx.quadraticCurveTo(9, -16, 15, -13);
    ctx.stroke();
    ctx.restore();

    if (showLabels || p.phase === 'pinned') {
      ctx.fillStyle = grey ? `rgba(170,170,180,${p.alpha})` : `rgba(255,255,255,${p.alpha * 0.85})`;
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(noteName(p.midi), p.x, p.y + 20);
      if (showLabels) {
        ctx.fillStyle = p.score >= 0 ? `rgba(140,255,170,${p.alpha})` : `rgba(255,120,120,${p.alpha})`;
        ctx.fillText((p.score >= 0 ? '+' : '') + p.score.toFixed(1), p.x, p.y + 33);
      }
    }
  }
}
