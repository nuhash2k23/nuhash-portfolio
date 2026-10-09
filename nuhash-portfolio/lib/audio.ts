'use client';

/**
 * Ambient sound. Off by default; the corner icon turns it on.
 * If /public/audio/ambient.mp3 exists it is used; otherwise a generated drone plays.
 * Mystery lines fire `cue(i)` — soft bells timed to the text.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: AudioNode | null = null;
  private built = false;
  on = false;

  private impulse(ctx: AudioContext, seconds = 3.2, decay = 2.6) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  private async build() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    const verb = ctx.createConvolver();
    verb.buffer = this.impulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    verb.connect(wet).connect(master);
    this.wet = verb;

    // Your own track wins if it exists.
    let usedFile = false;
    try {
      const res = await fetch('/audio/ambient.mp3');
      if (res.ok) {
        const data = await ctx.decodeAudioData(await res.arrayBuffer());
        const src = ctx.createBufferSource();
        src.buffer = data;
        src.loop = true;
        const g = ctx.createGain();
        g.gain.value = 0.8;
        src.connect(g).connect(master);
        src.start();
        usedFile = true;
      }
    } catch {
      /* fall back to the generated drone */
    }

    if (!usedFile) {
      const drone = ctx.createGain();
      drone.gain.value = 0.22;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 520;
      lp.Q.value = 0.6;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.045;
      const lfoAmt = ctx.createGain();
      lfoAmt.gain.value = 260;
      lfo.connect(lfoAmt).connect(lp.frequency);
      lfo.start();

      const tone = (f: number, type: OscillatorType, gain: number, detune = 0) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        o.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = gain;
        o.connect(g).connect(lp);
        o.start();
      };
      tone(55, 'sine', 0.5);
      tone(82.4, 'sine', 0.28, 5);
      tone(110, 'triangle', 0.05, -6);
      tone(164.8, 'sine', 0.03, 3);

      // air: filtered noise
      const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = nb;
      noise.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 380;
      bp.Q.value = 0.5;
      const ng = ctx.createGain();
      ng.gain.value = 0.05;
      noise.connect(bp).connect(ng).connect(lp);
      noise.start();

      lp.connect(drone);
      drone.connect(master);
      drone.connect(verb);
    }
    this.built = true;
  }

  async enable() {
    if (!this.built) await this.build();
    if (!this.ctx || !this.master) return;
    await this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0.6, t + 1.8);
    this.on = true;
  }

  disable() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.8);
    this.on = false;
    window.setTimeout(() => {
      if (!this.on) this.ctx?.suspend();
    }, 900);
  }

  /** Soft bell for mystery line i. */
  cue(i: number) {
    if (!this.on || !this.ctx || !this.master || !this.wet) return;
    const ctx = this.ctx;
    const base = [392, 493.88, 587.33, 659.25][i % 4];
    const t = ctx.currentTime;
    [
      [1, 0.16],
      [2.76, 0.05],
      [5.4, 0.018],
    ].forEach(([m, g]) => {
      const o = ctx.createOscillator();
      o.frequency.value = base * m;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(g, t + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
      o.connect(env);
      env.connect(this.master!);
      env.connect(this.wet!);
      o.start(t);
      o.stop(t + 3.5);
    });
  }

  /** Tiny tick for hovers. */
  tick() {
    if (!this.on || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.03);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource();
    s.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
  }
}

export const audio = new AudioEngine();
