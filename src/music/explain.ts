// Explains in plain language why a note fits or not, and gives tips on what
// is currently going wrong. Pure functions (apart from the text lookup) so
// they stay testable. All text comes from texts.json via t().

import { t, tl } from '../i18n/i18n';
import { JudgedNote } from './HarmonyJudge';
import { Chord, Key, diatonicChord, keyName, noteName, pcName, pitchClass } from './theory';

export type Verdict = 'good' | 'ok' | 'bad';

/** Section of the "understanding music" panel that explains this kind of note. */
export type TheoryTopic = 'consonance' | 'blues' | 'secondaryDominants' | 'scale' | 'passing' | 'dissonance';

export interface NoteExplanation {
  verdict: Verdict;
  topic: TheoryTopic;
  /** e.g. "E4 – chord tone" */
  headline: string;
  /** Why does the note fit (or not)? */
  why: string;
  /** Rhythm / interval / tip */
  details: string[];
}

export function intervalName(semitones: number): string {
  const s = Math.abs(semitones);
  if (s <= 12) return tl('explain.intervals')[s];
  if (s % 12 === 0) return t('explain.intervalOctaves', { n: s / 12 });
  return t('explain.intervalBigLeap', { n: s });
}

export function chordToneNames(pcs: number[]): string {
  return pcs.map((pc) => pcName(pc)).join(' · ');
}

/** Nearest chord tone (MIDI) to a note. */
export function nearestChordTone(midi: number, pcs: number[]): number {
  let best = midi;
  let bestD = Infinity;
  for (let d = -6; d <= 6; d++) {
    if (d === 0) continue;
    if (pcs.includes(pitchClass(midi + d)) && Math.abs(d) < bestD) {
      bestD = Math.abs(d);
      best = midi + d;
    }
  }
  return best;
}

function timingText(n: JudgedNote): string {
  const style = n.styleId;
  switch (n.parts.grid) {
    case 'beat':
      return t('explain.timing.onBeat');
    case 'offbeat':
      if (style === 'ska' || style === 'reggae' || style === 'electronic') return t('explain.timing.offbeatGroove');
      if (style === 'latin') return t('explain.timing.clave');
      if (style === 'baroque') return t('explain.timing.motor');
      if (style === 'gospel') return t('explain.timing.swungEighth');
      if (style === 'hiphop') return t('explain.timing.layBack');
      if (style === 'blues' || style === 'swing') return t('explain.timing.swungEighth');
      if (style === 'ragtime') return t('explain.timing.syncopation');
      if (style === 'dixieland') return t('explain.timing.lightSwing');
      return t('explain.timing.eighth');
    case 'sixteenth':
      return t(style === 'funk' ? 'explain.timing.funkSixteenth' : 'explain.timing.sixteenth');
  }
  return t('explain.timing.off', {
    ms: Math.abs(n.timingErrorMs),
    dir: t(n.timingErrorMs < 0 ? 'explain.timing.early' : 'explain.timing.late'),
  });
}

function intervalText(n: JudgedNote): string | undefined {
  if (n.prevMidi === undefined) return undefined;
  const d = n.midi - n.prevMidi;
  const s = Math.abs(d);
  const params = { name: intervalName(d), dir: d > 0 ? t('explain.up') : d < 0 ? t('explain.down') : '' };
  if (s === 0) return t('explain.interval.repeat');
  if (s === 6) return t('explain.interval.tritone', params);
  if (s > 12 && s % 12 !== 0) return t('explain.interval.hugeLeap', params);
  if (s === 10 || s === 11) return t('explain.interval.seventh', params);
  if (s <= 2) return t('explain.interval.step', params);
  return t('explain.interval.leap', params);
}

/** Role of a chord tone (root/third/fifth) and why it sounds good, based on its vibration ratio to the root. */
function chordToneReason(pcNum: number, rootPc: number, pcs: number[]): { role: string; ratio: string } {
  const idx = pcs.indexOf(pcNum);
  const fromRoot = (pcNum - rootPc + 12) % 12;
  const root = pcName(rootPc);
  if (idx <= 0) return { role: t('explain.roles.root'), ratio: t('explain.ratios.root') };
  if (idx === 3) return { role: t('explain.roles.seventh'), ratio: t('explain.ratios.seventh', { root }) };
  if (idx === 1) {
    return {
      role: t('explain.roles.third'),
      ratio: t(fromRoot === 3 ? 'explain.ratios.minorThird' : 'explain.ratios.majorThird', { root }),
    };
  }
  return {
    role: t('explain.roles.fifth'),
    ratio: t(fromRoot === 6 ? 'explain.ratios.tritone' : 'explain.ratios.fifth', { root }),
  };
}

export function explainNote(n: JudgedNote): NoteExplanation {
  const note = noteName(n.midi);
  const pcNum = pitchClass(n.midi);
  const pc = pcName(pcNum);
  const tones = chordToneNames(n.chord.pcs);
  const base = { note, pc, tones, chord: n.chord.name, key: keyName(n.key) };
  const details: string[] = [];
  let verdict: Verdict;
  let topic: TheoryTopic;
  let section: string;
  let extra: Record<string, string> = {};

  switch (n.quality) {
    case 'chord':
      verdict = 'good';
      topic = 'consonance';
      section = 'chord';
      extra = chordToneReason(pcNum, n.chord.root, n.chord.pcs);
      break;
    case 'blue':
      verdict = 'good';
      topic = 'blues';
      section = 'blue';
      break;
    case 'scale': {
      verdict = 'ok';
      topic = 'scale';
      section = 'scale';
      const near = nearestChordTone(n.midi, n.chord.pcs);
      extra = { near: pcName(pitchClass(near)), interval: intervalName(near - n.midi) };
      break;
    }
    case 'passing':
      verdict = 'ok';
      topic = 'passing';
      section = 'passing';
      break;
    case 'dissonant': {
      verdict = 'bad';
      topic = 'dissonance';
      section = 'dissonant';
      const target = nearestChordTone(n.midi, n.chord.pcs);
      const dist = Math.abs(target - n.midi);
      extra = {
        dist: dist === 1 ? t('explain.dissonant.oneSemitone') : t('explain.dissonant.semitones', { n: dist }),
        target: pcName(pitchClass(target)),
      };
      details.push(t('explain.dissonant.tip', { target: noteName(target), pc }));
      break;
    }
  }

  const params = { ...base, ...extra };
  // Secondary dominants (e.g. A7 in C major) get their own explanation
  const secondary = secondaryDominantTarget(n.chord, n.key, n.styleId);
  if (secondary) {
    details.push(t('explain.secondaryDominant', { chord: n.chord.name, target: secondary.name }));
    if (topic === 'consonance') topic = 'secondaryDominants';
  }
  details.unshift(timingText(n));
  const iv = intervalText(n);
  if (iv) details.splice(1, 0, iv);
  if (n.parts.spam < 0.75) details.push(t('explain.spam'));
  details.push(t('explain.more'));
  return {
    verdict,
    topic,
    headline: t(`explain.${section}.headline`, params),
    why: t(`explain.${section}.why`, params),
    details,
  };
}

/**
 * Coach tip when a pixel monster is coming: how much resonance the jump over it
 * needs, and how to get there if the current resonance is too low.
 */
export function monsterTip(needed: number, resonance: number): string {
  const params = { need: Math.ceil(needed), now: Math.round(resonance) };
  return t(resonance >= needed ? 'explain.monster.enough' : 'explain.monster.tooLow', params);
}

/**
 * A constant delay in the playing: if most notes are early (or late) by a similar amount,
 * returns that amount in ms (negative = early), rounded to 10 ms. That pattern usually comes
 * from the device (latency, e.g. Bluetooth headphones), not from the player's sense of rhythm.
 */
export function timingBias(notes: JudgedNote[]): number | undefined {
  if (notes.length < 8) return undefined;
  const sorted = notes.map((n) => n.offsetMs).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (Math.abs(median) < 30) return undefined;
  const sameSide = notes.filter((n) => Math.sign(n.offsetMs) === Math.sign(median)).length / notes.length;
  return sameSide >= 0.75 ? Math.round(median / 10) * 10 : undefined;
}

/** Coach tip for a constant delay: what latency is and which key corrects it. */
export function latencyTip(biasMs: number, short = false): string {
  const base = short ? 'explain.latencyShort' : 'explain.latency';
  return t(`${base}.${biasMs > 0 ? 'late' : 'early'}`, { ms: Math.abs(biasMs) });
}

export interface RunSummary {
  notes: number;
  /** Share of notes that were chord tones or blue notes (0–100) */
  chordPct: number;
  /** Share of notes that landed on the beat grid (0–100) */
  onGridPct: number;
  /** The one thing that would help most next time */
  tip: string;
}

/** Looks back at a whole run (level finished or game over): how did it go, and what to work on? */
export function summarize(notes: JudgedNote[], beats: number): RunSummary {
  const share = (pred: (n: JudgedNote) => boolean) => (notes.length ? notes.filter(pred).length / notes.length : 0);
  const chord = share((n) => n.quality === 'chord' || n.quality === 'blue');
  const onGrid = share((n) => n.parts.grid !== 'off');
  const bias = timingBias(notes.slice(-32));
  let tip: string;
  if (notes.length === 0) tip = t('explain.diagnose.silence');
  else if (notes.length < beats * 0.5) tip = t('explain.diagnose.fewNotes');
  else if (bias !== undefined) tip = latencyTip(bias, true);
  else if (share((n) => n.quality === 'dissonant') > 0.25) tip = t('explain.diagnose.dissonant');
  else if (onGrid < 0.65) tip = t('explain.diagnose.offBeat');
  else if (share((n) => n.parts.spam < 0.75) > 0.3) tip = t('explain.diagnose.spam');
  else if (chord < 0.5) tip = t('explain.diagnose.fewChordTones');
  else tip = t('explain.diagnose.good');
  return { notes: notes.length, chordPct: Math.round(chord * 100), onGridPct: Math.round(onGrid * 100), tip };
}

/** Coach tip when a note block is coming: how much resonance the jump needs to bump it with the head. */
export function blockTip(needed: number, resonance: number): string {
  const params = { need: Math.ceil(needed), now: Math.round(resonance) };
  return t(resonance >= needed ? 'explain.block.enough' : 'explain.block.tooLow', params);
}

/** What is the biggest problem right now? Returns a tip or undefined. */
export function diagnose(history: JudgedNote[], nowBeat: number, beatsPerBar: number, resonance: number): string | undefined {
  if (resonance >= 55) return undefined;
  const recent = history.filter((n) => nowBeat - n.beat <= beatsPerBar * 2 && n.beat <= nowBeat);
  if (recent.length === 0) return t('explain.diagnose.silence');
  if (recent.length < beatsPerBar) return t('explain.diagnose.fewNotes');
  const share = (pred: (n: JudgedNote) => boolean) => recent.filter(pred).length / recent.length;
  if (share((n) => n.quality === 'dissonant') > 0.3) return t('explain.diagnose.dissonant');
  // Always off by the same amount in the same direction? Then it is probably the device, not the player.
  // (Checked on its own: a constant delay can also make notes look like sixteenths.)
  const bias = timingBias(history.slice(-16));
  if (bias !== undefined) return latencyTip(bias);
  if (share((n) => n.parts.timing < 0.8) > 0.4) return t('explain.diagnose.offBeat');
  if (share((n) => n.parts.spam < 0.75) > 0.3) return t('explain.diagnose.spam');
  if (share((n) => n.quality === 'chord') < 0.5) return t('explain.diagnose.fewChordTones');
  return t('explain.diagnose.good');
}

/**
 * If a chord acts as a secondary dominant (a seventh chord other than V7 that
 * resolves a fifth down, e.g. A7 → Dm in C major), returns the chord it leads to.
 * In blues-based styles I7 and IV7 are just the normal chords, so they don't count.
 */
export function secondaryDominantTarget(chord: Chord, key: Key, styleId: string): Chord | undefined {
  if (chord.quality !== 'dom7' || chord.degree === 5) return undefined;
  if (styleId === 'blues' || styleId === 'rock' || styleId === 'funk') return undefined;
  // A fifth down = four scale degrees up
  return diatonicChord(key, ((chord.degree - 1 + 3) % 7) + 1);
}
