// Extra campaign tunes of the chapter "gospel" (see ChapterTune in ../notation.ts and docs/kampagnen-plan.md).
import type { ChapterTune } from '../notation';
import { type MelodyNote, dh, dq, e, h, q, rest } from '../notation';

// "Go Down, Moses" (traditional African-American spiritual, first printed 1872 by the Fisk Jubilee
// Singers; minor key). From Jack Campin's Nine-Note Tunebook (X:250, in G minor, no chords):
// https://abcnotation.com/tunePage?a=www.campin.me.uk/Music/Chalumeau/0278
// (checked against the Digital Tradition ABC GOMOSES, same melody). Notes and rhythm as in the
// source ("B<B" = eighth + dotted quarter); the chords are the usual i / V7 / iv of the spiritual.
const mosesPickup: MelodyNote[] = [q(-5)]; // "When"
const mosesLine: MelodyNote[] = [
  q(3), q(3), q(2), q(2), // Is-rael was in
  e(3), dq(3), h(0), // E-gypt land,
  q(-5), q(-5), e(-1), dq(-1), // let my peo-ple
];
const moses: MelodyNote[] = [
  ...mosesLine,
  dh(0), q(-5), // go. Op-
  ...mosesLine,
  dh(0), rest(1), // go.
  e(0), [0, 3.5], // Go down,
  e(5), [5, 3.5], // Mo-ses,
  q(7), h(7), q(5), // way down in
  e(7), dq(7), e(5), e(3), q(0), // E-gypt land,
  e(3), e(0), h(0), q(3), // tell old Pha-
  e(0), e(-2), [-5, 2.5], e(-5), // raoh to
  e(-5), dq(-5), e(-1), dq(-1), // let my peo-ple
  dh(0), rest(1), // go. (room for the pickup)
];

// "Amazing Grace" (tune "New Britain", anonymous American folk hymn, first printed 1829;
// words John Newton, † 1807). 3/4. From the Musica Viva ABC (Frank Nordberg, X:2850, in G,
// "C:anon."), mirrored by John Chambers:
// https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/amazing-grace.abc
// Notes and rhythm as in the source (the final "Z" read as a two-beat rest). The source has no
// chords; these are the standard hymn harmony, with the "Amen" step IV → I in bars 11–12.
const gracePickup: MelodyNote[] = [q(-5)]; // "A-"
const grace: MelodyNote[] = [
  h(0), e(4), e(0), // ma-zing
  h(4), q(2), // grace, how
  h(0), q(-3), // sweet the
  h(-5), q(-5), // sound that
  h(0), e(4), e(0), // saved a
  h(4), q(2), // wretch like
  [7, 4], rest(1), q(4), // me. I
  dq(7), e(4), e(7), e(4), // once was lost, but
  h(0), q(-5), // now am
  dq(-3), e(0), e(0), e(-3), // found, was blind, but
  h(-5), q(-5), // now I
  h(0), e(4), e(0), // see.
  h(4), q(2),
  [0, 4], rest(2), // (room for the pickup)
];

// "Go Tell It on the Mountain" (traditional African-American spiritual, first printed 1907 by
// John W. Work Jr., † 1925). From the Musica Viva ABC (Frank Nordberg, X:413, in D, "C:anon."), mirrored by John Chambers:
// https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/go-tell-it-on-the.abc
// Refrain and verse with the chords of the source (Em7 → ii, E7 → II7). Simplified: the dotted
// eighth + sixteenth pairs become two eighths (the church shuffle swings them anyway).
const mountainCall: MelodyNote[] = [h(4), e(4), e(2), e(0), e(-3)]; // Go tell it on the
const mountainVerse: MelodyNote[] = [
  q(4), q(7), q(7), q(9), // shep-herds kept their
  q(7), h(4), q(0), // watch-ing o'er
];
const mountain: MelodyNote[] = [
  ...mountainCall,
  h(-5), h(0), // moun-tain,
  e(2), q(2), e(0), q(2), q(0), // o-ver the hills and
  q(4), q(7), q(9), q(7), // ev'-ry-where.
  ...mountainCall,
  h(-5), dq(0), e(2), // moun-tain, that
  q(4), q(4), e(2), e(0), q(2), // Je-sus Christ is
  dh(0), q(0), // born. While
  ...mountainVerse,
  q(2), q(2), q(0), q(2), // wand'-ring flocks by
  dh(4), q(0), // night, be-
  ...mountainVerse, // hold from out of hea-ven
  q(2), q(2), q(0), q(-3), // there shone a ho-ly
  h(-5), h(5), // light.
];

// "Nobody Knows the Trouble I've Seen" (traditional African-American spiritual, printed 1867 in
// "Slave Songs of the United States"; almost pentatonic). From the Musica Viva ABC (Frank
// Nordberg, X:3106, in F, "C:anon."), mirrored by John Chambers:
// https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/nobody-knows.abc
// Notes, rhythm and chords as in the source; Bb → C7 → F at "hal-le-lu-yah" is the "Amen" IV → I,
// "Oh, yes, Lord" is the answer in the call and response.
const nobodyCall: MelodyNote[] = [e(4), q(-5), e(-3), dq(0), e(2)]; // No-bo-dy knows the troub-le
const nobodyUp: MelodyNote[] = [q(7), q(7), q(7), q(4), q(7), q(7), q(4), rest(1)]; // some-times I'm up …
const nobody: MelodyNote[] = [
  ...nobodyCall,
  e(4), e(4), e(4), [4, 1.5], rest(1), // I see.
  e(4), q(-5), e(-3), q(0), q(0), // No-bo-dy knows my
  e(-3), [-5, 2.5], rest(1), // sor-row.
  ...nobodyCall,
  e(4), e(4), e(4), [4, 1.5], rest(1), // I see.
  dq(7), e(4), q(2), q(4), // Glo-ry, hal-le-
  h(0), q(0), q(0), // lu-yah. Some-
  ...nobodyUp, // times I'm up, some-times I'm down.
  h(7), h(4), // Oh, yes,
  h(2), rest(1), q(4), // Lord, some-
  ...nobodyUp, // times I'm al-most to the ground.
  h(4), h(2), // Oh, yes,
  dh(0), rest(1), // Lord.
];

export const TUNES: ChapterTune[] = [
  {
    chapter: 'gospel',
    melody: {
      id: 'nobodyKnows',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        ['I', 'IV'], 'I', ['I', 'IV'], 'V7',
        ['I', 'IV'], 'I', ['I', 'V7'], ['IV', 'I'],
        'I', 'I', 'I', 'V7',
        'I', 'I', ['I', 'V7'], 'I',
      ],
      notes: nobody,
    },
    key: { tonic: 5, mode: 'major' }, // F major, as in the source
    bpm: 72,
    source:
      'Traditional African-American spiritual ("Nobody Knows the Trouble I\'ve Seen", anonymous, printed 1867) → public domain. ABC: Musica Viva (Frank Nordberg), https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/nobody-knows.abc; notes and chords as in the source.',
  },
  {
    chapter: 'gospel',
    melody: {
      id: 'amazingGrace',
      beatsPerBar: 3,
      bars: 16,
      chords: [
        'I', 'I', 'IV', 'I',
        'I', 'I', 'V', 'V',
        'I', 'I7', 'IV', 'I',
        'I', 'V7', 'I', 'I',
      ],
      pickup: gracePickup,
      notes: grace,
    },
    key: { tonic: 7, mode: 'major' }, // G major, as in the source
    bpm: 72,
    source:
      'Hymn tune "New Britain" (anonymous American folk hymn, printed 1829; words John Newton, † 1807) → public domain. ABC: Musica Viva (Frank Nordberg), https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/amazing-grace.abc; notes as in the source, standard hymn chords added.',
  },
  {
    chapter: 'gospel',
    melody: {
      id: 'goDownMoses',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        'i', 'i', 'V7', 'i',
        'i', 'i', 'V7', 'i',
        'i', 'iv', 'i', 'i',
        'i', 'i', 'V7', 'i',
      ],
      pickup: mosesPickup,
      notes: moses,
    },
    key: { tonic: 7, mode: 'minor' }, // G minor, as in the source
    bpm: 76,
    source:
      'Traditional African-American spiritual ("Go Down, Moses", anonymous, printed 1872) → public domain. ABC: Jack Campin, Nine-Note Tunebook, https://abcnotation.com/tunePage?a=www.campin.me.uk/Music/Chalumeau/0278 (cross-checked with the Digital Tradition ABC); notes as in the source, i / iv / V7 chords added.',
  },
  {
    chapter: 'gospel',
    melody: {
      id: 'goTellItOnTheMountain',
      beatsPerBar: 4,
      bars: 16,
      chords: [
        ['I', 'IV'], 'I', ['ii', 'V'], ['I', 'I', 'IV', 'V7'],
        ['I', 'IV'], 'I', ['I', 'V7'], 'I',
        'I', 'I', 'V7', 'I',
        'I', 'I', 'II7', ['V', 'V7'],
      ],
      notes: mountain,
    },
    key: { tonic: 2, mode: 'major' }, // D major, as in the source
    bpm: 100,
    source:
      'Traditional African-American spiritual ("Go Tell It on the Mountain", anonymous; first printed by John W. Work Jr., † 1925) → public domain. ABC: Musica Viva (Frank Nordberg), https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/go-tell-it-on-the.abc; dotted eighth + sixteenth pairs simplified to eighths.',
  },
];
