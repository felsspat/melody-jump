import { afterEach, describe, expect, it } from 'vitest';
import { CHAPTERS, TWELVE_BAR_BLUES, findLevel } from '../src/campaign/chapters';
import { boostFor, loadProgress, recordResult, starsFor } from '../src/campaign/progress';
import { Guide } from '../src/game/Guide';
import { LOCALES, setLocale, t, tl } from '../src/i18n/i18n';
import { explainNote } from '../src/music/explain';
import { GUIDE_HIT_BONUS, HarmonyJudge, timingMultiplier } from '../src/music/HarmonyJudge';
import { melodyTimeline } from '../src/music/melodies';
import { Song, sectionName } from '../src/music/Song';
import { STYLES, swingBeat } from '../src/music/styles';
import { dominantSeventh, pcName, pitchClass } from '../src/music/theory';

const C_MAJOR = { tonic: 0, mode: 'major' as const };

describe('campaign data', () => {
  afterEach(() => setLocale('en'));

  it('chapters are in historical order and ska comes before reggae', () => {
    const ids = CHAPTERS.map((c) => c.id);
    expect(ids).toEqual(['folk', 'ragtime', 'blues', 'dixieland', 'swing', 'rocknroll', 'ska', 'reggae', 'funk', 'hiphop', 'electronic']);
  });

  it('every available chapter has levels; every chapter has localized texts and a Wikipedia link', () => {
    for (const locale of LOCALES) {
      setLocale(locale);
      for (const c of CHAPTERS) {
        if (c.available) expect(c.levels.length).toBeGreaterThan(0);
        expect(t(`campaign.chapters.${c.id}.name`)).not.toContain('campaign.');
        expect(tl(`campaign.chapters.${c.id}.intro`).length).toBeGreaterThan(0);
        expect(t(`campaign.chapters.${c.id}.wikiUrl`)).toMatch(new RegExp(`^https://${locale}\.wikipedia\.org/wiki/`));
        for (const l of c.levels) for (const s of l.sections) expect(sectionName(s)).not.toContain('sections.');
      }
    }
  });

  it('the blues chapter is playable without finishing chapter 1', () => {
    const blues = CHAPTERS.find((c) => c.id === 'blues')!;
    expect(blues.available).toBe(true);
    expect(findLevel('blues-1')?.chapter.id).toBe('blues');
  });

  it('a campaign level is a finite song that ends', () => {
    const level = findLevel('blues-1')!.chapter.levels[0];
    const song = new Song(level.sections);
    expect(song.endBeat).toBe(level.sections[0].bars * 4);
    song.positionAt(song.endBeat + 100);
    expect(song.sections).toHaveLength(1);
    expect(song.nextSection(song.sections[0])).toBe(song.sections[0]);
  });

  it('the guide does not hang at the end of a finite song', () => {
    const level = findLevel('blues-3')!.chapter.levels[2];
    const song = new Song(level.sections);
    const g = new Guide(() => 0);
    g.update(song.endBeat - 1, song, 60, 72);
    g.update(song.endBeat + 5, song, 60, 72);
    expect(g.targets.every((x) => x.beat < song.endBeat)).toBe(true);
  });
});

describe('progress', () => {
  it('works without storage and keeps the best result', () => {
    const p = loadProgress(); // no localStorage in tests -> empty, no crash
    recordResult(p, 'blues-1', 2, 500);
    recordResult(p, 'blues-1', 1, 900);
    expect(p.stars['blues-1']).toBe(2);
    expect(p.best['blues-1']).toBe(900);
  });

  it('remembers the fastest speed, and speeds up only finished levels', () => {
    const p = loadProgress();
    expect(boostFor(p, 'ska-1', 'faster')).toBe(1); // not finished yet: normal speed
    recordResult(p, 'ska-1', 2, 500, 1.15);
    recordResult(p, 'ska-1', 3, 400, 1);
    expect(p.speed['ska-1']).toBe(1.15);
    expect(boostFor(p, 'ska-1', 'faster')).toBe(1.3);
    expect(boostFor(p, 'ska-1', 'normal')).toBe(1);
  });

  it('awards stars by average resonance and lives lost', () => {
    expect(starsFor(20, 4)).toBe(1);
    expect(starsFor(50, 3)).toBe(2);
    expect(starsFor(70, 1)).toBe(3);
    expect(starsFor(70, 2)).toBe(2);
  });
});

describe('blues rules', () => {
  afterEach(() => setLocale('en'));

  it('builds dominant seventh chords', () => {
    expect(dominantSeventh(C_MAJOR, 1).pcs).toEqual([0, 4, 7, 10]);
    expect(dominantSeventh(C_MAJOR, 5).name).toBe('G7');
    setLocale('de');
    expect(dominantSeventh(C_MAJOR, 5).pcs.map(pcName)).toEqual(['G', 'H', 'D', 'F']);
  });

  it('blue notes count as good in the blues but as foreign in classic style', () => {
    const chord = dominantSeventh(C_MAJOR, 1);
    const base = { key: C_MAJOR, chord, beatInBar: 0, beatsPerBar: 4, secPerBeat: 0.75 };
    const eb = { midi: 63, velocity: 0.7, beat: 0 };
    expect(new HarmonyJudge().judge(eb, { ...base, style: STYLES.blues }).note.quality).toBe('blue');
    expect(new HarmonyJudge().judge(eb, { ...base, style: STYLES.classic }).note.quality).toBe('dissonant');
    // The b7 is part of the seventh chord itself
    expect(new HarmonyJudge().judge({ ...eb, midi: 70 }, { ...base, style: STYLES.blues }).note.quality).toBe('chord');
  });

  it('a swung off-beat gets full eighth-note timing in the blues', () => {
    const spb = 0.8;
    expect(timingMultiplier(2 + 2 / 3, spb, 0.07, STYLES.blues.swing).mult).toBe(1.0);
    expect(timingMultiplier(2 + 2 / 3, spb, 0.07, STYLES.classic.swing).mult).toBeLessThan(1.0);
    expect(swingBeat(3.5, STYLES.blues)).toBeCloseTo(3 + 2 / 3);
    expect(swingBeat(3.5, STYLES.classic)).toBe(3.5);
  });

  it('explains blue notes', () => {
    setLocale('de');
    const chord = dominantSeventh(C_MAJOR, 1);
    const n = new HarmonyJudge().judge(
      { midi: 63, velocity: 0.7, beat: 0 },
      { key: C_MAJOR, chord, beatInBar: 0, beatsPerBar: 4, secPerBeat: 0.75, style: STYLES.blues },
    ).note;
    const e = explainNote(n);
    expect(e.verdict).toBe('good');
    expect(e.topic).toBe('blues');
    expect(e.headline).toContain('Blue Note');
  });

  it('the blues tune follows the 12-bar form and sounds good when played along', () => {
    const level = findLevel('blues-1')!.chapter.levels[0];
    const song = new Song(level.sections);
    const section = song.sections[0];
    expect(section.progression).toEqual(TWELVE_BAR_BLUES);
    const judge = new HarmonyJudge();
    let last = 0;
    for (const n of melodyTimeline(section)) {
      const pos = song.positionAt(n.beat);
      const r = judge.judge(
        { midi: 60 + n.offset, velocity: 0.7, beat: n.beat },
        { key: section.key, chord: pos.chord, beatInBar: pos.beatInBar, beatsPerBar: 4, secPerBeat: 60 / section.bpm, style: STYLES.blues },
      );
      judge.addBonus(r.note, GUIDE_HIT_BONUS);
      expect(r.note.quality, `beat ${n.beat} ${pitchClass(60 + n.offset)}`).not.toBe('dissonant');
      last = n.beat;
    }
    expect(judge.resonance(last, 4)).toBeGreaterThan(60);
  });
});
