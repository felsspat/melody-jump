import { describe, expect, it } from 'vitest';
import { Guide } from '../src/game/Guide';
import { GUIDE_HIT_BONUS, HarmonyJudge } from '../src/music/HarmonyJudge';
import { CHAPTERS, notesPerSecond } from '../src/campaign/chapters';
import { MELODIES, melodyTimeline, pickupBeats } from '../src/music/melodies';
import { CHAPTER_TUNES } from '../src/music/songs';
import { Song } from '../src/music/Song';
import { pitchClass } from '../src/music/theory';
import { INTRO_SECTIONS, makeRng, makeSectionGenerator } from '../src/world/Level';

describe('melodies', () => {
  it('every melody fills its bars exactly and has one chord per bar', () => {
    for (const mel of Object.values(MELODIES)) {
      const beats = mel.notes.reduce((sum, [, d]) => sum + d, 0);
      expect(beats, mel.id).toBe(mel.bars * mel.beatsPerBar);
      expect(mel.chords, mel.id).toHaveLength(mel.bars);
    }
  });

  it('the game starts with well-known melodies', () => {
    expect(INTRO_SECTIONS[0].melody).toBe('twinkle');
    expect(INTRO_SECTIONS.filter((s) => s.melody).length).toBeGreaterThanOrEqual(3);
  });

  it('played perfectly along the rings, every melody sounds good (high resonance, no foreign notes)', () => {
    const song = new Song(INTRO_SECTIONS, makeSectionGenerator(makeRng(1)));
    for (const section of song.sections.filter((s) => s.melody)) {
      const judge = new HarmonyJudge();
      const tonic = 60 + section.key.tonic;
      let last = section.startBeat;
      for (const n of melodyTimeline(section)) {
        const pos = song.positionAt(n.beat);
        const r = judge.judge(
          { midi: tonic + n.offset, velocity: 0.7, beat: n.beat },
          { key: section.key, chord: pos.chord, beatInBar: pos.beatInBar, beatsPerBar: section.beatsPerBar, secPerBeat: 60 / section.bpm },
        );
        judge.addBonus(r.note, GUIDE_HIT_BONUS); // perfect play hits every ring
        expect(r.note.quality, `${section.name} @${n.beat}`).not.toBe('dissonant');
        last = n.beat;
      }
      expect(judge.resonance(last, section.beatsPerBar), section.name).toBeGreaterThan(70);
    }
  });

  it('the guide rings show the melody in melody sections', () => {
    const song = new Song(INTRO_SECTIONS, makeSectionGenerator(makeRng(1)));
    const g = new Guide(() => 0);
    for (let b = 0; b < 16; b += 0.25) g.update(b, song, 60, 76);
    const expected = melodyTimeline(song.sections[0]).filter((n) => n.beat < 20);
    const shown = g.targets.length ? g.targets : [];
    // Targets older than the current beat are pruned; compare the remaining ones
    for (const target of shown) {
      const n = expected.find((e) => e.beat === target.beat);
      expect(n).toBeDefined();
      expect(pitchClass(target.midi)).toBe(pitchClass(60 + n!.offset));
    }
    expect(shown.length).toBeGreaterThan(0);
  });
});

describe('extra chapter tunes (songs/*.ts)', () => {
  it('have unique ids, a known chapter, a source and a sensible tempo', () => {
    const ids = new Set<string>();
    for (const tune of CHAPTER_TUNES) {
      expect(ids.has(tune.melody.id), tune.melody.id).toBe(false);
      ids.add(tune.melody.id);
      expect(CHAPTERS.some((c) => c.id === tune.chapter), tune.melody.id).toBe(true);
      expect(tune.source.length, tune.melody.id).toBeGreaterThan(20);
      expect(tune.bpm, tune.melody.id).toBeGreaterThanOrEqual(56);
      expect(tune.bpm, tune.melody.id).toBeLessThanOrEqual(150);
    }
  });

  it('the newer eras start with a slow, easy level and get harder from there', () => {
    for (const id of ['baroque', 'gospel', 'country', 'latin']) {
      const chapter = CHAPTERS.find((c) => c.id === id)!;
      const first = chapter.levels[0];
      expect(first.id, id).toMatch(/-slow$/);
      const tune = CHAPTER_TUNES.find((t) => t.melody.id === first.sections[0].melody)!;
      const slowRate = notesPerSecond({ ...tune, bpm: first.sections[0].bpm });
      // About as gentle as the first level of the older chapters (Twinkle 1.05, Saints 0.68 notes/s)
      expect(slowRate, id).toBeLessThanOrEqual(1.3);
      expect(first.sections[0].difficulty, id).toBe(0);
      const rates = CHAPTER_TUNES.filter((t) => t.chapter === id).map(notesPerSecond);
      const order = chapter.levels.slice(1, -1).map((l) => notesPerSecond(CHAPTER_TUNES.find((t) => t.melody.id === l.sections[0].melody)!));
      expect(order, id).toEqual([...rates].sort((x, y) => x - y));
    }
  });

  it('each becomes a campaign level of its chapter', () => {
    for (const tune of CHAPTER_TUNES) {
      const chapter = CHAPTERS.find((c) => c.id === tune.chapter)!;
      expect(chapter.levels.some((l) => l.sections[0].melody === tune.melody.id), tune.melody.id).toBe(true);
    }
    const ids = CHAPTERS.flatMap((c) => c.levels.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('pickups and several chords per bar', () => {
  it('a pickup always fits into the rest at the end of its melody (so passes can loop)', () => {
    for (const mel of Object.values(MELODIES)) {
      if (!mel.pickup) continue;
      const pickup = mel.pickup.reduce((sum, [, d]) => sum + d, 0);
      let trailingRest = 0;
      for (let i = mel.notes.length - 1; i >= 0 && mel.notes[i][0] === null; i--) trailingRest += mel.notes[i][1];
      expect(trailingRest, mel.id).toBeGreaterThanOrEqual(pickup);
    }
  });

  it('"When the Saints" starts with "Oh when the" in the count-in, "saints" on beat 1', () => {
    const song = new Song([{ name: 'saints', key: { tonic: 0, mode: 'major' }, bpm: 90, beatsPerBar: 4, progression: MELODIES.saints.chords, bars: 16, difficulty: 0, melody: 'saints' }]);
    const notes = melodyTimeline(song.sections[0]);
    expect(notes.slice(0, 4).map((n) => n.beat)).toEqual([-3, -2, -1, 0]);
    expect(notes[3].offset).toBe(7);
    expect(pickupBeats(song.sections[0])).toBe(3);
  });

  it('the guide shows the pickup during the count-in', () => {
    const song = new Song([{ name: 'saints', key: { tonic: 0, mode: 'major' }, bpm: 90, beatsPerBar: 4, progression: MELODIES.saints.chords, bars: 16, difficulty: 0, melody: 'saints' }]);
    const g = new Guide(() => 0);
    g.update(-4, song, 60, 76);
    expect(g.targets.map((t) => t.beat)).toContain(-3);
  });

  it('a bar can hold several chords that split it evenly', () => {
    const song = new Song([{ name: 'test', key: { tonic: 0, mode: 'major' }, bpm: 90, beatsPerBar: 4, progression: [['I', 'V7'], 'IV'], bars: 2, difficulty: 0 }]);
    expect(song.positionAt(0).chord.name).toBe('C');
    expect(song.positionAt(0).nextChord.name).toBe('G7');
    expect(song.positionAt(1.9).chord.name).toBe('C');
    expect(song.positionAt(2).chord.name).toBe('G7');
    expect(song.positionAt(3.5).nextChord.name).toBe('F');
    expect(song.positionAt(4).chord.name).toBe('F');
  });
});
