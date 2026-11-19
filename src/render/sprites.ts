// Pixel-art sprite of the player character: a girl with a ponytail, bow and
// pink dress, facing right. Each frame is a grid of palette characters
// ('.' = transparent). Frames share the same head/body; only legs differ.

export const SPRITE_PALETTE: Record<string, string> = {
  K: '#2b1d2e', // outline
  H: '#8a4b2a', // hair
  h: '#b86b3d', // hair highlight
  R: '#ff4f6d', // bow
  S: '#ffd8b8', // skin
  b: '#ff9aa8', // blush
  E: '#2b1d2e', // eyes
  x: '#ff4f6d', // hurt eyes
  m: '#c0506a', // mouth
  D: '#ff6fa5', // dress
  d: '#d94f86', // dress shade
  w: '#ffffff', // collar button
  L: '#ffd8b8', // legs
  O: '#5a3b8c', // shoes
};

const BODY = [
  '....KKKKK...',
  '...KHHHHHK..',
  '..KHHhhHHHK.',
  '.RKHHHHHHHHK',
  'RRKHHSSSHHHK',
  '.RKHSSSSSSHK',
  '..KHSSESSESK',
  '..KHSbSSSSbK',
  '...KSSSmSSK.',
  '....KKDDKK..',
  '...KDDDDDDK.',
  '..KSDDwDDDSK',
  '..KKDDDDDDKK',
  '..KdDDDDDDdK',
];

const LEGS = {
  runA: ['...KLK.KLK..', '...OO...OO..'],
  runB: ['..KLK...KLK.', '..OO.....OO.'],
  jump: ['....KLLK....', '....OOOO....'],
};

export type SpriteFrame = 'runA' | 'runB' | 'jump' | 'hurt';

export function spriteRows(frame: SpriteFrame): string[] {
  if (frame === 'hurt') return [...BODY.map((r) => r.replace(/E/g, 'x')), ...LEGS.jump];
  return [...BODY, ...LEGS[frame]];
}

export const SPRITE_W = 12;
export const SPRITE_H = BODY.length + 2;

// ---------- Pixel monsters ----------
// Two original designs (a horned blob and a spiky one-eyed creature), each in
// three colors. They hop on the beat; legs alternate between two frames.

export const MONSTER_W = 12;

const MONSTER_BODIES: string[][] = [
  // Horned blob
  [
    '.K........K.',
    '.KK......KK.',
    '..KKKKKKKK..',
    '.KBBBBBBBBK.',
    'KBWWBBBBWWBK',
    'KBWEBBBBWEBK',
    'KBBBBBBBBBBK',
    'KBMMMMMMMMBK',
    'KBMTMTTMTMBK',
    'KBBBBBBBBBBK',
    '.KddddddddK.',
  ],
  // Spiky one-eyed creature
  [
    '.K..K..K..K.',
    '.KK.KK.KK.KK',
    'KBBBBBBBBBBK',
    'KBBBWWWWBBBK',
    'KBBWWEEWWBBK',
    'KBBWWEEWWBBK',
    'KBBBWWWWBBBK',
    'KBBBBBBBBBBK',
    'KBBMMMMMMBBK',
    'KBBBTBBTBBBK',
    '.KddddddddK.',
  ],
];

const MONSTER_LEGS = [
  ['.KK......KK.'],
  ['..KK....KK..'],
];

/** Body / shade colors of the three monster variants: purple, green, orange. */
const MONSTER_COLORS: [string, string][] = [
  ['#9b5de5', '#6b3fa0'],
  ['#5fd068', '#3a8f45'],
  ['#ff8c42', '#c9622a'],
];

export const MONSTER_SHAPES = MONSTER_BODIES.length;
export const MONSTER_COLOR_COUNT = MONSTER_COLORS.length;
export const MONSTER_H = MONSTER_BODIES[0].length + 1;

export function monsterRows(shape: number, frame: number): string[] {
  return [...MONSTER_BODIES[shape % MONSTER_SHAPES], ...MONSTER_LEGS[frame % 2]];
}

export function monsterPalette(color: number): Record<string, string> {
  const [body, shade] = MONSTER_COLORS[color % MONSTER_COLOR_COUNT];
  return { K: '#1d1424', B: body, d: shade, W: '#ffffff', E: '#1d1424', M: '#3a0d1f', T: '#ffffff' };
}
