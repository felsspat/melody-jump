// Central AudioContext with mixer: music bus, player bus, reverb, compressor.

const MUSIC_GAIN = 0.55;
const PLAYER_GAIN = 0.9;
const SFX_GAIN = 0.8;

export class AudioEngine {
  readonly ctx: AudioContext;
  readonly master: GainNode;
  readonly musicBus: GainNode;
  readonly playerBus: GainNode;
  /** Reverb send of the band */
  readonly reverbSend: GainNode;
  /** Reverb send of the player's instrument (separate, so both volumes can be set on their own) */
  readonly playerReverb: GainNode;
  /** Game sounds (jump, coin …) */
  readonly sfxBus: GainNode;
  readonly noise: AudioBuffer;
  /** Additional player-adjustable latency correction in seconds. */
  userOffset = 0;

  constructor() {
    this.ctx = new AudioContext({ latencyHint: 'interactive' });
    const ctx = this.ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    comp.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(comp);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = MUSIC_GAIN;
    this.musicBus.connect(this.master);

    this.playerBus = ctx.createGain();
    this.playerBus.gain.value = PLAYER_GAIN;
    this.playerBus.connect(this.master);

    const reverb = ctx.createConvolver();
    reverb.buffer = this.makeImpulse(2.4, 2.5);
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = 0.35;
    reverb.connect(reverbOut).connect(this.master);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 1;
    this.reverbSend.connect(reverb);
    this.playerReverb = ctx.createGain();
    this.playerReverb.gain.value = 1;
    this.playerReverb.connect(reverb);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = SFX_GAIN;
    this.sfxBus.connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  private makeImpulse(seconds: number, decay: number): AudioBuffer {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  /** Volume of the band and of the player's instrument (1 = the default mix), including their reverb. */
  setVolumes(band: number, player: number, sfx = 1): void {
    this.sfxBus.gain.value = SFX_GAIN * sfx;
    this.musicBus.gain.value = MUSIC_GAIN * band;
    this.reverbSend.gain.value = band;
    this.playerBus.gain.value = PLAYER_GAIN * player;
    this.playerReverb.gain.value = player;
  }

  async resume(): Promise<void> {
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }

  get now(): number {
    return this.ctx.currentTime;
  }

  /** Estimated time between scheduling a sound and it becoming audible. */
  get outputLatency(): number {
    const c = this.ctx as AudioContext & { outputLatency?: number };
    return (c.outputLatency ?? 0) + (c.baseLatency ?? 0);
  }

  /** The point in time the player is currently hearing (for visuals and judging). */
  get audibleTime(): number {
    return this.ctx.currentTime - this.outputLatency - this.userOffset;
  }
}
