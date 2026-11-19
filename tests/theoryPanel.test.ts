import { afterEach, describe, expect, it } from 'vitest';
import { LOCALES, setLocale, t, tl } from '../src/i18n/i18n';
import { explainNote } from '../src/music/explain';
import { HarmonyJudge, JudgeContext } from '../src/music/HarmonyJudge';
import { diatonicChord } from '../src/music/theory';
import { THEORY_SECTIONS, parseLink } from '../src/ui/TheoryPanel';

const C_MAJOR = { tonic: 0, mode: 'major' as const };
const ctx = (degree: number): JudgeContext => ({
  key: C_MAJOR,
  chord: diatonicChord(C_MAJOR, degree),
  beatInBar: 0,
  beatsPerBar: 4,
  secPerBeat: 0.75,
});
const explain = (midi: number, degree = 1) => explainNote(new HarmonyJudge().judge({ midi, velocity: 0.7, beat: 0 }, ctx(degree)).note);

describe('note explanations', () => {
  afterEach(() => setLocale('en'));

  it('names the role of a chord tone and the vibration ratio behind it', () => {
    setLocale('de');
    expect(explain(60).why).toContain('Grundton');
    const third = explain(64).why; // E over C: major third
    expect(third).toContain('Terz');
    expect(third).toContain('5:4');
    expect(explain(67).why).toContain('3:2'); // G over C: fifth
    expect(explain(69, 6).why).toContain('Grundton'); // A over Am
    expect(explain(60, 6).why).toContain('6:5'); // C over Am: minor third
  });

  it('explains scale tones relative to the nearest band note', () => {
    setLocale('en');
    const e = explain(62); // D over C
    expect(e.topic).toBe('scale');
    expect(e.why).toContain('whole step');
  });

  it('explains foreign notes with beating and links to the matching theory topic', () => {
    setLocale('en');
    const e = explain(66); // F#
    expect(e.topic).toBe('dissonance');
    expect(e.why).toContain('16:15');
    expect(e.details[e.details.length - 1]).toContain('I');
  });
});

describe('theory panel content', () => {
  afterEach(() => setLocale('en'));

  it('has a title, text and working Wikipedia links for every section in every language', () => {
    for (const locale of LOCALES) {
      setLocale(locale);
      for (const id of THEORY_SECTIONS) {
        expect(t(`theory.sections.${id}.title`)).not.toContain('theory.sections');
        expect(tl(`theory.sections.${id}.body`).length).toBeGreaterThan(0);
        const links = tl(`theory.sections.${id}.links`).map(parseLink);
        expect(links.length).toBeGreaterThan(0);
        for (const l of links) expect(l.url).toMatch(new RegExp(`^https://${locale}\.wikipedia\.org/wiki/`));
      }
    }
  });

  it('every explanation topic exists as a panel section', () => {
    for (const topic of ['consonance', 'scale', 'passing', 'dissonance']) {
      expect(THEORY_SECTIONS).toContain(topic);
    }
  });
});
