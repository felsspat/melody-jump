// Turns mouse/touch and keyboard input into notes.
// Mouse: X = pitch (chromatic, quantized), Y = volume (top = loud).
// Keyboard: piano layout (A row = white keys, W row = black keys) or scale mode.

import { t } from '../i18n/i18n';
import { Key, SCALES } from '../music/theory';
import { MidiNoteEvent } from './MidiInput';

// Note lanes on screen: C3–C6 normally; on narrow screens (phones) only C4–C6,
// so every lane stays wide enough for a finger. Live bindings: set via setLaneRange().
export let LOW_MIDI = 48; // C3
export let HIGH_MIDI = 84; // C6
export let LANES = HIGH_MIDI - LOW_MIDI + 1;

/** Narrowest lane width (CSS px) before the range shrinks to two octaves. */
export const MIN_LANE_PX = 20;

/** Picks the lane range for a screen width; returns true if it changed. */
export function setLaneRange(width: number): boolean {
  const low = width / 37 >= MIN_LANE_PX ? 48 : 60;
  if (low === LOW_MIDI) return false;
  LOW_MIDI = low;
  HIGH_MIDI = 84;
  LANES = HIGH_MIDI - LOW_MIDI + 1;
  return true;
}

export type NoteSource = 'mouse' | 'keyboard' | 'midi';

export interface NoteRequest {
  midi: number;
  velocity: number;
  /** Screen position for the visualization (CSS pixels) */
  x: number;
  y: number;
  source: NoteSource;
  /** The pointer slid into this lane while pressed; the note only counts once the pointer rests on it */
  glide?: boolean;
}

export interface InputHandlers {
  noteOn(req: NoteRequest): number;
  /** `superseded` = the pointer slid on to another lane, so this was only a tone passed through */
  noteOff(id: number, superseded?: boolean): void;
  /** Other keys (start, pause, debug …). Returns true if consumed */
  command(code: string, e: KeyboardEvent): boolean;
  /** Pointer click while no notes can be played (e.g. menus) */
  canPlay(): boolean;
  click(x: number, y: number): void;
  /** On-screen buttons during play (e.g. pause). Returns true if the click hit one (then no note is played). */
  uiClick(x: number, y: number): boolean;
  currentKey(): Key;
}

// event.code -> semitone offset, independent of QWERTZ/QWERTY
const PIANO: Record<string, number> = {
  KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7,
  KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16,
};
// Scale mode: key row = scale degrees
const SCALE_ROW = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];
const VELOCITY_KEYS: Record<string, number> = { Digit1: 0.3, Digit2: 0.45, Digit3: 0.6, Digit4: 0.8, Digit5: 1.0 };

function codeLabel(code: string): string {
  if (code === 'KeyY') return t('keys.y');
  if (code === 'Semicolon') return t('keys.semicolon');
  return code.replace('Key', '');
}

export function laneToMidi(lane: number): number {
  return LOW_MIDI + Math.max(0, Math.min(LANES - 1, lane));
}

export function midiToLaneX(midi: number, width: number): number {
  const lane = Math.max(0, Math.min(LANES - 1, midi - LOW_MIDI));
  return ((lane + 0.5) / LANES) * width;
}

export class InputMapper {
  octaveBase = 60; // C4
  velocity = 0.7;
  scaleMode = false;
  /** For display: current mouse position */
  mouseX = -1;
  mouseY = -1;

  private pointerNotes = new Map<number, { id: number; midi: number }>();
  private keyNotes = new Map<string, number>();
  /** Notes held on a MIDI keyboard (MIDI note -> voice id) */
  private midiNotes = new Map<number, number>();

  constructor(
    private canvas: HTMLCanvasElement,
    private h: InputHandlers,
  ) {
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    canvas.addEventListener('pointerleave', () => {
      this.mouseX = -1;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => this.releaseAll());
  }

  private pointerToNote(e: PointerEvent): { midi: number; velocity: number; x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lane = Math.floor((x / rect.width) * LANES);
    const velocity = 0.2 + 0.8 * Math.max(0, Math.min(1, 1 - y / rect.height));
    return { midi: laneToMidi(lane), velocity, x, y };
  }

  private onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    if (this.h.uiClick(e.clientX - rect.left, e.clientY - rect.top)) return;
    if (!this.h.canPlay()) {
      this.h.click(e.clientX - rect.left, e.clientY - rect.top);
      return;
    }
    this.canvas.setPointerCapture(e.pointerId);
    const n = this.pointerToNote(e);
    const id = this.h.noteOn({ ...n, source: 'mouse' });
    this.pointerNotes.set(e.pointerId, { id, midi: n.midi });
  }

  private onPointerMove(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    const held = this.pointerNotes.get(e.pointerId);
    if (!held) return;
    // Glide: moving into another lane while pressed = new note
    const n = this.pointerToNote(e);
    if (n.midi !== held.midi) {
      this.h.noteOff(held.id, true);
      const id = this.h.noteOn({ ...n, source: 'mouse', glide: true });
      this.pointerNotes.set(e.pointerId, { id, midi: n.midi });
    }
  }

  private onPointerUp(e: PointerEvent): void {
    const held = this.pointerNotes.get(e.pointerId);
    if (held) {
      this.h.noteOff(held.id);
      this.pointerNotes.delete(e.pointerId);
    }
  }

  /** MIDI note for a key, or undefined. */
  keyToMidi(code: string): number | undefined {
    if (this.scaleMode) {
      const idx = SCALE_ROW.indexOf(code);
      if (idx < 0) return undefined;
      const key = this.h.currentKey();
      const scale = SCALES[key.mode];
      const octave = Math.floor(idx / 7);
      const tonicMidi = this.octaveBase + key.tonic;
      return tonicMidi + scale[idx % 7] + 12 * octave;
    }
    const off = PIANO[code];
    return off === undefined ? undefined : this.octaveBase + off;
  }

  /** Label of the key that plays this note (for guide rings). */
  keyLabel(midi: number): string | undefined {
    if (this.scaleMode) {
      const code = SCALE_ROW.find((c) => this.keyToMidi(c) === midi);
      return code ? codeLabel(code) : undefined;
    }
    const off = midi - this.octaveBase;
    const code = Object.keys(PIANO).find((c) => PIANO[c] === off);
    return code ? codeLabel(code) : undefined;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (this.h.command(e.code, e)) {
      e.preventDefault();
      return;
    }
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      e.preventDefault();
      const d = e.code === 'ArrowUp' ? 12 : -12;
      this.octaveBase = Math.max(36, Math.min(72, this.octaveBase + d));
      return;
    }
    if (e.code === 'Tab') {
      e.preventDefault();
      this.scaleMode = !this.scaleMode;
      return;
    }
    if (VELOCITY_KEYS[e.code] !== undefined) {
      this.velocity = VELOCITY_KEYS[e.code];
      return;
    }
    if (e.repeat || this.keyNotes.has(e.code)) return;
    const midi = this.keyToMidi(e.code);
    if (midi === undefined || !this.h.canPlay()) return;
    e.preventDefault();
    const velocity = e.shiftKey ? 1 : this.velocity;
    const rect = this.canvas.getBoundingClientRect();
    const x = midiToLaneX(midi, rect.width);
    const y = (1 - (velocity - 0.2) / 0.8) * rect.height;
    const id = this.h.noteOn({ midi, velocity, x, y, source: 'keyboard' });
    this.keyNotes.set(e.code, id);
  }

  private onKeyUp(e: KeyboardEvent): void {
    const id = this.keyNotes.get(e.code);
    if (id !== undefined) {
      this.h.noteOff(id);
      this.keyNotes.delete(e.code);
    }
  }

  /** A key on a MIDI keyboard: plays exactly that note, with the keyboard's own velocity. */
  midiNote(e: MidiNoteEvent): void {
    if (e.type === 'off') {
      const id = this.midiNotes.get(e.midi);
      if (id !== undefined) {
        this.h.noteOff(id);
        this.midiNotes.delete(e.midi);
      }
      return;
    }
    if (this.midiNotes.has(e.midi) || !this.h.canPlay()) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = midiToLaneX(e.midi, rect.width);
    const y = (1 - (e.velocity - 0.2) / 0.8) * rect.height;
    const id = this.h.noteOn({ midi: e.midi, velocity: e.velocity, x, y, source: 'midi' });
    this.midiNotes.set(e.midi, id);
  }

  releaseAll(): void {
    for (const id of this.midiNotes.values()) this.h.noteOff(id);
    this.midiNotes.clear();
    for (const id of this.keyNotes.values()) this.h.noteOff(id);
    for (const p of this.pointerNotes.values()) this.h.noteOff(p.id);
    this.keyNotes.clear();
    this.pointerNotes.clear();
  }
}
