// Optional MIDI keyboard via the Web MIDI API (Chrome, Edge, Opera; Firefox asks for a permission;
// Safari has none). Only note-on/note-off are used; everything else (pedal, knobs) is ignored.
// NOTE: never tried with a real keyboard so far – only parseMidiMessage() is covered by tests.

export type MidiNoteEvent = { type: 'on'; midi: number; velocity: number } | { type: 'off'; midi: number };

/**
 * Turns a raw MIDI message into a note event. Note-on with velocity 0 means note-off
 * (many keyboards send it that way). Velocity 1–127 becomes 0.2–1, like the mouse's volume range.
 */
export function parseMidiMessage(data: ArrayLike<number>): MidiNoteEvent | undefined {
  if (data.length < 3) return undefined;
  const kind = data[0] & 0xf0;
  const midi = data[1] & 0x7f;
  const vel = data[2] & 0x7f;
  if (kind === 0x90 && vel > 0) return { type: 'on', midi, velocity: 0.2 + 0.8 * (vel / 127) };
  if (kind === 0x80 || kind === 0x90) return { type: 'off', midi };
  return undefined;
}

export interface MidiHandlers {
  note(e: MidiNoteEvent): void;
  /** A keyboard was plugged in (or was there at the start) */
  connected(name: string): void;
}

/** Listens to every MIDI input, including ones plugged in later. */
export class MidiInput {
  private requested = false;
  private known = new Set<string>();

  constructor(private h: MidiHandlers) {}

  /** Asks the browser for MIDI access once; quietly does nothing where Web MIDI is missing or denied. */
  async start(): Promise<void> {
    if (this.requested) return;
    this.requested = true;
    const nav = navigator as Navigator & { requestMIDIAccess?: (o?: { sysex?: boolean }) => Promise<MIDIAccess> };
    if (typeof nav.requestMIDIAccess !== 'function') return;
    let access: MIDIAccess;
    try {
      access = await nav.requestMIDIAccess({ sysex: false });
    } catch {
      return; // no permission or no MIDI subsystem
    }
    const attach = () => {
      access.inputs.forEach((input) => {
        input.onmidimessage = (ev) => {
          if (!ev.data) return;
          const e = parseMidiMessage(ev.data);
          if (e) this.h.note(e);
        };
        if (input.state === 'disconnected') this.known.delete(input.id);
        else if (!this.known.has(input.id)) {
          this.known.add(input.id);
          this.h.connected(input.name ?? 'MIDI');
        }
      });
    };
    attach();
    access.onstatechange = () => attach();
  }
}
