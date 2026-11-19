import { afterEach, describe, expect, it } from 'vitest';
import { AudioEngine } from '../src/audio/AudioEngine';
import { Backing } from '../src/audio/Backing';
import { CHAPTERS } from '../src/campaign/chapters';
import { setLocale, t } from '../src/i18n/i18n';
import { explainNote, secondaryDominantTarget } from '../src/music/explain';
import { GUIDE_HIT_BONUS, HarmonyJudge, JudgeContext } from '../src/music/HarmonyJudge';
import { melodyTimeline } from '../src/music/melodies';
import { Song, sectionName } from '../src/music/Song';
import { STYLES, StyleId } from '../src/music/styles';
import { chordFromSpec, diatonicChord, pcName } from '../src/music/theory';
import { ENDLESS_STYLES, EndlessStyle, INTRO_SECTIONS, endlessIntro, makeRng, makeSectionGenerator } from '../src/world/Level';

const C_MAJOR = { tonic: 0, mode: 'major' as const };

/** Minimal fake of the Web Audio API that just counts started sound sources. */
function fakeEngine() {
  const started: number[] = [];
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    cancelScheduledValues() {},
  });
  const node = (): Record<string, unknown> => {
    const n: Record<string, unknown> = {
      gain: param(),
      frequency: param(),
      detune: param(),
      Q: param(),
      type: '',
      buffer: null,
      connect: (target: unknown) => target,
      disconnect() {},
      start: (t: number) => started.push(t),
      stop() {},
    };
    return n;
  };
  const ctx = {
    currentTime: 0,
    sampleRate: 44100,
    createGain: node,
    createOscillator: node,
    createBiquadFilter: node,
    createBufferSource: node,
  };
  const engine = { ctx, musicBus: node(), reverbSend: node(), noise: {} } as unknown as AudioEngine;
  return { engine, started };
}

describe('chord symbols', () => {
  afterEach(() => setLocale('en'));

  it('parses roman numerals and seventh chords', () => {
    expect(chordFromSpec(C_MAJOR, 'I').name).toBe('C');
    expect(chordFromSpec(C_MAJOR, 'ii').name).toBe('Dm');
    expect(chordFromSpec(C_MAJOR, 'V7').pcs).toEqual([7, 11, 2, 5]);
    expect(chordFromSpec(C_MAJOR, 'VI7').pcs.map(pcName)).toEqual(['A', 'C#', 'E', 'G']);
    expect(chordFromSpec({ tonic: 4, mode: 'minor' }, 'VII').name).toBe('D');
    expect(() => chordFromSpec(C_MAJOR, 'X9')).toThrow();
  });

  it('recognizes secondary dominants and explains them', () => {
    const a7 = chordFromSpec(C_MAJOR, 'VI7');
    expect(secondaryDominantTarget(a7, C_MAJOR, 'ragtime')?.name).toBe('Dm');
    expect(secondaryDominantTarget(chordFromSpec(C_MAJOR, 'V7'), C_MAJOR, 'ragtime')).toBeUndefined();
    // In the blues, I7 is simply the home chord
    expect(secondaryDominantTarget(chordFromSpec(C_MAJOR, 'I7'), C_MAJOR, 'blues')).toBeUndefined();

    setLocale('de');
    const ctx: JudgeContext = { key: C_MAJOR, chord: a7, beatInBar: 0, beatsPerBar: 4, secPerBeat: 0.8, style: STYLES.ragtime };
    const e = explainNote(new HarmonyJudge().judge({ midi: 61, velocity: 0.7, beat: 0 }, ctx).note); // C# over A7
    expect(e.verdict).toBe('good');
    expect(e.topic).toBe('secondaryDominants');
    expect(e.details.join(' ')).toContain('Zwischendominante');
  });
});

describe('groove accents', () => {
  const judgeAt = (style: StyleId, beat: number) => {
    const ctx: JudgeContext = {
      key: C_MAJOR,
      chord: diatonicChord(C_MAJOR, 1),
      beatInBar: beat % 4,
      beatsPerBar: 4,
      secPerBeat: 0.6,
      style: STYLES[style],
    };
    return new HarmonyJudge().judge({ midi: 60, velocity: 0.7, beat }, ctx).note.parts.timing;
  };

  it('ska rewards the offbeat more than the beat', () => {
    expect(judgeAt('ska', 1.5)).toBeGreaterThan(judgeAt('ska', 1));
    expect(judgeAt('classic', 1.5)).toBeLessThan(judgeAt('classic', 1));
  });

  it('rock rewards the backbeat, reggae beat 3, funk the One', () => {
    expect(judgeAt('rock', 1)).toBeGreaterThan(judgeAt('rock', 0));
    expect(judgeAt('reggae', 2)).toBeGreaterThan(judgeAt('reggae', 0));
    expect(judgeAt('funk', 0)).toBeGreaterThan(judgeAt('funk', 2));
  });

  it('funk values 16th notes', () => {
    expect(judgeAt('funk', 1.25)).toBeGreaterThan(judgeAt('classic', 1.25));
  });
});

describe('style chapters', () => {
  const available = CHAPTERS.filter((c) => c.available);

  it('all fifteen chapters are playable, each with at least three levels', () => {
    expect(available).toHaveLength(15);
    for (const c of available) expect(c.levels.length, c.id).toBeGreaterThanOrEqual(3);
  });

  it('every melody level sounds good when played along with the rings', () => {
    const melodyLevels = available.flatMap((c) => c.levels.filter((l) => l.sections[0].melody).map((level) => ({ chapter: c, level })));
    expect(melodyLevels.length).toBeGreaterThan(20);
    for (const { level } of melodyLevels) {
      const song = new Song(level.sections);
      const section = song.sections[0];
      const style = STYLES[section.style ?? 'classic'];
      const judge = new HarmonyJudge();
      const tonic = 60 + section.key.tonic;
      let last = 0;
      for (const n of melodyTimeline(section)) {
        const pos = song.positionAt(n.beat);
        const chordPos = song.positionAt(n.beat + 0.12);
        const r = judge.judge(
          { midi: tonic + n.offset, velocity: 0.7, beat: n.beat },
          {
            key: section.key,
            chord: chordPos.chord,
            beatInBar: pos.beatInBar,
            beatsPerBar: section.beatsPerBar,
            secPerBeat: 60 / section.bpm,
            style,
          },
        );
        judge.addBonus(r.note, GUIDE_HIT_BONUS);
        last = n.beat;
      }
      // Foreign notes are only allowed as passing tones that resolve
      const bad = judge.history.filter((n) => n.quality === 'dissonant');
      expect(bad.map((n) => n.midi), `${level.id}: unresolved foreign notes`).toEqual([]);
      expect(judge.resonance(last, section.beatsPerBar), level.id).toBeGreaterThan(55);
    }
  });

  it('every style has a backing band that plays a whole level without errors', () => {
    for (const chapter of available) {
      for (const level of chapter.levels) {
        const { engine, started } = fakeEngine();
        const song = new Song(level.sections);
        const backing = new Backing(engine, song);
        for (let beat = -4; beat <= song.endBeat; beat += 0.5) backing.onStep(beat, beat, song.bpmAt(beat));
        expect(started.length, level.id).toBeGreaterThan(song.endBeat);
      }
    }
  });
});

describe('endless mode styles', () => {
  const songFor = (style: EndlessStyle, seed: number) => {
    const rnd = makeRng(seed);
    return new Song(endlessIntro(style, rnd), makeSectionGenerator(rnd, style));
  };

  it('every style has a name and a hint in every language', () => {
    for (const locale of ['de', 'en'] as const) {
      setLocale(locale);
      for (const style of ENDLESS_STYLES) {
        for (const field of ['name', 'hint']) {
          const key = `endless.styles.${style}.${field}`;
          expect(t(key), key).not.toBe(key);
        }
      }
    }
    setLocale('en');
  });

  it('generates valid sections in the chosen style', () => {
    for (const style of ENDLESS_STYLES) {
      for (const seed of [1, 2, 3]) {
        const song = songFor(style, seed);
        song.positionAt(3000);
        const generated = style === 'classic' || style === 'mixed' ? song.sections.slice(INTRO_SECTIONS.length) : song.sections;
        expect(generated.length, style).toBeGreaterThan(5);
        for (const s of generated) {
          if (style !== 'mixed') expect(s.style ?? 'classic', style).toBe(style);
          // Whole progressions only, so every section ends on its last chord
          expect(s.bars % s.progression.length, `${style}/${s.name}`).toBe(0);
          expect(s.bpm).toBeGreaterThanOrEqual(60);
          expect(s.bpm).toBeLessThanOrEqual(150);
          expect(sectionName(s), s.name).not.toContain('sections.');
        }
      }
    }
  });

  it('a single style starts slow and gets faster', () => {
    for (const style of ENDLESS_STYLES.filter((s) => s !== 'mixed' && s !== 'classic')) {
      const song = songFor(style, 4);
      song.positionAt(3000);
      const first = song.sections[0].bpm;
      const later = song.sections[song.sections.length - 1].bpm;
      expect(later, style).toBeGreaterThan(first);
    }
  });

  it('"mixed" starts with the known tunes and then plays several styles', () => {
    const song = songFor('mixed', 5);
    song.positionAt(4000);
    expect(song.sections[0].melody).toBe('twinkle');
    const styles = new Set(song.sections.slice(INTRO_SECTIONS.length).map((s) => s.style ?? 'classic'));
    expect(styles.size).toBeGreaterThanOrEqual(4);
  });

  it('the band plays every endless style without errors', () => {
    for (const style of ENDLESS_STYLES) {
      const { engine, started } = fakeEngine();
      const song = songFor(style, 6);
      const backing = new Backing(engine, song);
      for (let beat = -4; beat <= 800; beat += 0.5) backing.onStep(beat, beat, song.bpmAt(beat));
      expect(started.length, style).toBeGreaterThan(800);
    }
  });
});

describe('Dixieland', () => {
  it('has the two-beat feel: beats 1 and 3 count more than 2 and 4, eighths lightly swung', () => {
    const judgeAt = (beat: number) => {
      const ctx: JudgeContext = {
        key: C_MAJOR,
        chord: diatonicChord(C_MAJOR, 1),
        beatInBar: beat % 4,
        beatsPerBar: 4,
        secPerBeat: 0.6,
        style: STYLES.dixieland,
      };
      return new HarmonyJudge().judge({ midi: 60, velocity: 0.7, beat }, ctx).note.parts.timing;
    };
    expect(judgeAt(2)).toBeGreaterThan(judgeAt(1));
    expect(STYLES.dixieland.swing).toBeGreaterThan(STYLES.classic.swing);
    expect(STYLES.dixieland.swing).toBeLessThan(STYLES.swing.swing);
  });

  it('plays "When the Saints", while swing got its own tune', () => {
    const dixie = CHAPTERS.find((c) => c.id === 'dixieland')!;
    const swing = CHAPTERS.find((c) => c.id === 'swing')!;
    expect(dixie.levels[0].sections[0].melody).toBe('saints');
    expect(dixie.levels[0].sections[0].style).toBe('dixieland');
    expect(swing.levels[0].sections[0].melody).toBe('swingRiff');
  });

  it('the band plays tuba on 1 and 3 and a banjo on every beat', () => {
    const { engine, started } = fakeEngine();
    const song = new Song(CHAPTERS.find((c) => c.id === 'dixieland')!.levels[2].sections);
    const backing = new Backing(engine, song);
    backing.onStep(0, 0, 100);
    const onOne = started.length;
    backing.onStep(1, 1, 100);
    const onTwo = started.length - onOne;
    // Beat 1: tuba + banjo chord + kick; beat 2: banjo + snare + hi-hat, no tuba
    expect(onOne).toBeGreaterThanOrEqual(4);
    expect(onTwo).toBeGreaterThanOrEqual(4);
  });
});

describe('hip-hop and house', () => {
  const judgeAt = (style: StyleId, beat: number) => {
    const ctx: JudgeContext = {
      key: C_MAJOR,
      chord: diatonicChord(C_MAJOR, 1),
      beatInBar: beat % 4,
      beatsPerBar: 4,
      secPerBeat: 0.5,
      style: STYLES[style],
    };
    return new HarmonyJudge().judge({ midi: 60, velocity: 0.7, beat }, ctx).note.parts.timing;
  };

  it('hip-hop rewards the snare on 2 and 4 and accepts laid-back off-beats', () => {
    expect(judgeAt('hiphop', 1)).toBeGreaterThan(judgeAt('hiphop', 0));
    expect(judgeAt('hiphop', 0.58)).toBeGreaterThan(judgeAt('classic', 0.58));
  });

  it('house rewards the off-beat (between the kicks) most', () => {
    expect(judgeAt('electronic', 0.5)).toBeGreaterThan(judgeAt('electronic', 0));
    expect(STYLES.electronic.swing).toBe(0.5);
  });

  it('house has a kick on every beat (four-on-the-floor)', () => {
    const { engine, started } = fakeEngine();
    const song = new Song(CHAPTERS.find((c) => c.id === 'electronic')!.levels[2].sections);
    const backing = new Backing(engine, song);
    for (let beat = 0; beat < 4; beat++) {
      const before = started.length;
      backing.onStep(beat, beat, 124);
      expect(started.filter((t) => t === beat).length, `beat ${beat}`).toBeGreaterThanOrEqual(1);
      expect(started.length).toBeGreaterThan(before);
    }
  });
});
