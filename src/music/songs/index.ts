// All extra campaign tunes, one file per chapter (so they can be written independently).
import type { ChapterTune } from '../notation';
import { TUNES as baroque } from './baroque';
import { TUNES as blues } from './blues';
import { TUNES as country } from './country';
import { TUNES as dixieland } from './dixieland';
import { TUNES as electronic } from './electronic';
import { TUNES as folk } from './folk';
import { TUNES as funk } from './funk';
import { TUNES as gospel } from './gospel';
import { TUNES as hiphop } from './hiphop';
import { TUNES as latin } from './latin';
import { TUNES as ragtime } from './ragtime';
import { TUNES as reggae } from './reggae';
import { TUNES as rocknroll } from './rocknroll';
import { TUNES as ska } from './ska';
import { TUNES as swing } from './swing';

export const CHAPTER_TUNES: ChapterTune[] = [
  ...baroque,
  ...folk,
  ...gospel,
  ...ragtime,
  ...blues,
  ...dixieland,
  ...swing,
  ...country,
  ...latin,
  ...rocknroll,
  ...ska,
  ...reggae,
  ...funk,
  ...hiphop,
  ...electronic,
];
