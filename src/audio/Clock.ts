// Musical clock: Web Audio time is the master clock. A lookahead scheduler
// plans eighth-note steps in advance; tempo changes are stored as segments
// so time <-> beat can be converted exactly at any moment.

interface TempoSegment {
  beat: number;
  time: number;
  bpm: number;
}

export const STEP = 0.5; // eighth note

export class Clock {
  private segs: TempoSegment[] = [];
  private nextStepBeat = 0;
  private nextStepTime = 0;
  private timer: number | undefined;

  constructor(
    private ctx: AudioContext,
    private bpmAt: (beat: number) => number,
    private onStep: (beat: number, time: number, bpm: number) => void,
  ) {}

  start(startBeat: number, delay = 0.15): void {
    const t = this.ctx.currentTime + delay;
    this.segs = [{ beat: startBeat, time: t, bpm: this.bpmAt(startBeat) }];
    this.nextStepBeat = startBeat;
    this.nextStepTime = t;
    this.stop();
    this.timer = window.setInterval(() => this.tick(), 25);
    this.tick();
  }

  stop(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
  }

  get running(): boolean {
    return this.timer !== undefined;
  }

  private tick(): void {
    const horizon = this.ctx.currentTime + 0.15;
    while (this.nextStepTime < horizon) {
      const bpm = this.bpmAt(this.nextStepBeat);
      const last = this.segs[this.segs.length - 1];
      if (bpm !== last.bpm) {
        this.segs.push({ beat: this.nextStepBeat, time: this.nextStepTime, bpm });
        if (this.segs.length > 32) this.segs.shift();
      }
      this.onStep(this.nextStepBeat, this.nextStepTime, bpm);
      this.nextStepTime += (60 / bpm) * STEP;
      this.nextStepBeat += STEP;
    }
  }

  private segmentForTime(t: number): TempoSegment {
    let s = this.segs[0];
    for (const seg of this.segs) if (seg.time <= t) s = seg;
    return s;
  }

  beatAt(time: number): number {
    if (this.segs.length === 0) return 0;
    const s = this.segmentForTime(time);
    return s.beat + ((time - s.time) * s.bpm) / 60;
  }

  secPerBeatAt(time: number): number {
    if (this.segs.length === 0) return 0.5;
    return 60 / this.segmentForTime(time).bpm;
  }
}
