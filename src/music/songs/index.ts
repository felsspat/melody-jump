// All extra campaign tunes, one file per chapter (so they can be written independently).
import type { ChapterTune } from '../notation';
import { TUNES as blues } from './blues';
import { TUNES as dixieland } from './dixieland';
import { TUNES as electronic } from './electronic';
import { TUNES as folk } from './folk';
import { TUNES as funk } from './funk';
import { TUNES as hiphop } from './hiphop';
import { TUNES as ragtime } from './ragtime';
import { TUNES as reggae } from './reggae';
import { TUNES as rocknroll } from './rocknroll';
import { TUNES as ska } from './ska';
import { TUNES as swing } from './swing';

export const CHAPTER_TUNES: ChapterTune[] = [
  ...folk,
  ...ragtime,
  ...blues,
  ...dixieland,
  ...swing,
  ...rocknroll,
  ...ska,
  ...reggae,
  ...funk,
  ...hiphop,
  ...electronic,
];
