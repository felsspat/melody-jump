import { describe, expect, it } from 'vitest';
import { Song } from '../src/music/Song';
import { BLOCK_HALF_BEATS, INTRO_SECTIONS, LevelGen, NoteBlock, makeRng, makeSectionGenerator } from '../src/world/Level';
import { Player } from '../src/world/Player';
import { chordTone } from '../src/audio/Sfx';
import { diatonicChord } from '../src/music/theory';
import { MONSTER_GRID, Obstacle, PLAYER_H, PLAYER_W, PX_PER_BEAT, canClear, jumpShape, minResonanceFor } from '../src/world/physics';
import { MONSTER_SHAPES, MONSTER_W, monsterPalette, monsterRows } from '../src/render/sprites';

describe('Jump physics', () => {
  it('higher resonance = higher, longer jump', () => {
    expect(jumpShape(100).height).toBeGreaterThan(jumpShape(0).height);
    expect(jumpShape(100).duration).toBeGreaterThan(jumpShape(0).duration);
  });

  it('wide gaps need more resonance', () => {
    const narrow: Obstacle = { kind: 'gap', beat: 10, width: 0.5, height: 0, minResonance: 0 };
    const wide: Obstacle = { kind: 'gap', beat: 10, width: 2, height: 0, minResonance: 0 };
    expect(minResonanceFor(wide)).toBeGreaterThan(minResonanceFor(narrow));
    expect(canClear(wide, minResonanceFor(wide))).toBe(true);
  });

  it('tall walls need more resonance', () => {
    const low: Obstacle = { kind: 'wall', beat: 10, width: 0.5, height: 40, minResonance: 0 };
    const high: Obstacle = { kind: 'wall', beat: 10, width: 0.5, height: 200, minResonance: 0 };
    expect(minResonanceFor(high)).toBeGreaterThan(minResonanceFor(low));
  });
});

describe('Song & Level', () => {
  it('returns chords and bars correctly', () => {
    const song = new Song(INTRO_SECTIONS, makeSectionGenerator(makeRng(1)));
    const p0 = song.positionAt(0);
    expect(p0.chord.name).toBe('C');
    expect(song.positionAt(4).chord.name).toBe('F'); // Twinkle: C – F – F – C …
    expect(song.positionAt(5.5).beatInBar).toBeCloseTo(1.5);
    // The waltz section is in 3/4 time
    const waltz = song.sections.find((s) => s.name === 'waltz')!;
    expect(song.positionAt(waltz.startBeat + 3).barInSection).toBe(1);
    expect(song.bpmAt(waltz.startBeat)).toBe(waltz.bpm);
  });

  it('generates sections endlessly', () => {
    const song = new Song(INTRO_SECTIONS, makeSectionGenerator(makeRng(2)));
    song.positionAt(2000);
    expect(song.sections.length).toBeGreaterThan(INTRO_SECTIONS.length);
  });

  it('obstacles are clearable with reachable resonance and do not overlap', () => {
    const rnd = makeRng(3);
    const song = new Song(INTRO_SECTIONS, makeSectionGenerator(rnd));
    const level = new LevelGen(rnd);
    song.onAdd((s) => level.addSection(s));
    song.positionAt(1000);
    expect(level.obstacles.length).toBeGreaterThan(10);
    for (const o of level.obstacles) expect(o.minResonance).toBeLessThanOrEqual(100);
    for (let i = 1; i < level.obstacles.length; i++) {
      const a = level.obstacles[i - 1];
      expect(level.obstacles[i].beat).toBeGreaterThan(a.beat + a.width);
    }
  });
});

describe('Pixel monsters', () => {
  it('sometimes replace obstacles, and every monster can be jumped over', () => {
    const rnd = makeRng(7);
    const song = new Song(INTRO_SECTIONS, makeSectionGenerator(rnd));
    const level = new LevelGen(rnd);
    song.onAdd((s) => level.addSection(s));
    song.positionAt(1500);
    const monsters = level.obstacles.filter((o) => o.monster);
    expect(monsters.length).toBeGreaterThan(level.obstacles.length * 0.3);
    expect(monsters.length).toBeLessThan(level.obstacles.length * 0.7);
    for (const m of monsters) {
      expect(m.kind).toBe('wall');
      expect(m.height).toBe(MONSTER_GRID * m.monster!.scale);
      // Small: 24–60 px
      expect(m.height).toBeGreaterThanOrEqual(24);
      expect(m.height).toBeLessThanOrEqual(60);
      expect(m.width).toBeCloseTo(m.height / PX_PER_BEAT);
      expect(m.minResonance).toBeLessThanOrEqual(100);
    }
  });

  it('are stomped from above with a little resonance, and never cost a life then', () => {
    for (const seed of [3, 4, 5]) {
      const rnd = makeRng(seed);
      const level = new LevelGen(rnd);
      const song = new Song(INTRO_SECTIONS, makeSectionGenerator(rnd));
      song.onAdd((s) => level.addSection(s));
      song.positionAt(300);
      const monsters = level.obstacles.filter((o) => o.monster && o.beat < 270);
      const player = new Player();
      let stomps = 0;
      for (let beat = 0; beat < 280; beat += 1 / 60) {
        if (player.update(beat, beat * 0.5, 30, level).includes('stomp')) stomps++;
        player.lives = 5;
      }
      expect(monsters.length).toBeGreaterThan(5);
      for (const m of monsters) {
        expect(m.hit, `monster at beat ${m.beat}`).toBeFalsy();
        expect(m.stomped, `monster at beat ${m.beat}`).toBe(true);
        expect(m.minResonance).toBeLessThanOrEqual(30);
      }
      expect(stomps).toBeGreaterThanOrEqual(monsters.length);
    }
  });

  it('are run into when there is no music at all', () => {
    const rnd = makeRng(3);
    const level = new LevelGen(rnd);
    const song = new Song(INTRO_SECTIONS, makeSectionGenerator(rnd));
    song.onAdd((s) => level.addSection(s));
    song.positionAt(300);
    const player = new Player();
    for (let beat = 0; beat < 280; beat += 1 / 60) {
      player.update(beat, beat * 0.5, 0, level);
      player.lives = 5;
    }
    expect(level.obstacles.filter((o) => o.monster && o.hit).length).toBeGreaterThan(0);
  });

  it('never appear in the tutorial', () => {
    const level = new LevelGen(makeRng(8));
    for (let i = 0; i < 50; i++) level.addObstacleAt(i * 8, 10, 30);
    expect(level.obstacles.some((o) => o.monster)).toBe(false);
  });

  it('sprites are 12×12 and use only known colors', () => {
    for (let shape = 0; shape < MONSTER_SHAPES; shape++) {
      for (const frame of [0, 1]) {
        const rows = monsterRows(shape, frame);
        expect(rows.length).toBe(MONSTER_GRID);
        const palette = monsterPalette(0);
        for (const row of rows) {
          expect(row.length).toBe(MONSTER_W);
          for (const ch of row) if (ch !== '.') expect(palette[ch], `${shape}/${ch}`).toBeDefined();
        }
      }
    }
  });
});

describe('Note blocks', () => {
  /** Runs the runner through a generated level at a constant resonance; returns the blocks it bumped. */
  function run(resonance: number, seed: number) {
    const rnd = makeRng(seed);
    const level = new LevelGen(rnd);
    const song = new Song(INTRO_SECTIONS, makeSectionGenerator(rnd));
    song.onAdd((s) => level.addSection(s));
    song.positionAt(300);
    const player = new Player();
    const bumped = new Set<NoteBlock>();
    for (let beat = 0; beat < 280; beat += 0.01) {
      player.update(beat, beat, resonance, level);
      player.lives = 5;
      for (const b of level.blocks) {
        if (Math.abs(b.beat - beat) > BLOCK_HALF_BEATS + PLAYER_W / 2 / PX_PER_BEAT) continue;
        if (player.state === 'jump' && player.y + PLAYER_H >= b.bottom) bumped.add(b);
      }
    }
    return { blocks: level.blocks.filter((b) => b.beat < 270), bumped };
  }

  it('are placed above obstacles and can be reached with the resonance they ask for', () => {
    let total = 0;
    for (const seed of [3, 4, 5]) {
      const { blocks, bumped } = run(100, seed);
      total += blocks.length;
      for (const b of blocks) {
        expect(b.minResonance).toBeLessThanOrEqual(100);
        expect(b.bottom).toBeLessThanOrEqual(jumpShape(100).height + PLAYER_H);
        expect(bumped.has(b)).toBe(true);
      }
    }
    expect(total).toBeGreaterThan(5);
  });

  it('stay out of reach for weak jumps', () => {
    const { blocks, bumped } = run(5, 3);
    const hard = blocks.filter((b) => b.minResonance > 30);
    expect(hard.length).toBeGreaterThan(0);
    for (const b of hard) expect(bumped.has(b)).toBe(false);
  });
});

describe('Game sounds', () => {
  it('play chord tones, so they fit the music', () => {
    const c = diatonicChord({ tonic: 0, mode: 'major' }, 5); // G major: G B D
    expect(chordTone(c, 0, 60)).toBe(67);
    expect(chordTone(c, 1, 60)).toBe(71);
    expect(chordTone(c, 2, 60)).toBe(62);
    expect(chordTone(c, 3, 60)).toBe(79);
  });
});
