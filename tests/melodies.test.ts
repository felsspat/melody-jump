import { describe, expect, it } from 'vitest';
import { Guide } from '../src/game/Guide';
import { GUIDE_HIT_BONUS, HarmonyJudge } from '../src/music/HarmonyJudge';
import { MELODIES, melodyTimeline, pickupBeats } from '../src/music/melodies';
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
