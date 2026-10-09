'use client';

/**
 * Sound design. Off by default; the corner icon turns it on.
 *
 * Ambience (when /public/audio/ambient.mp3 is missing): a soft, slowly changing
 * chord made only of sine tones (no saws, no sub-bass → no buzz), low wind,
 * and an occasional distant glass chime. Everything sits in a long, dark reverb.
 *
 * One-shots: cue (river lines), boom (stone breaks), whoosh, riser (door), tick (hover).
 */

type Bus = { out: AudioNode; verb: AudioNode; noise: AudioBuffer };

/* -------------------------------------------------------------------------- */
/* Shared helpers (work with AudioContext and OfflineAudioContext)            */
/* -------------------------------------------------------------------------- */

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** Dark, smooth reverb tail: noise passed through a one-pole low-pass, decaying. */
export function makeImpulse(ctx: BaseAudioContext, seconds = 6, decay = 2.8) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // the tail gets darker as it decays, like a real hall
      const k = 0.55 - t * 0.45;
      lp += ((Math.random() * 2 - 1) - lp) * k;
      d[i] = lp * Math.pow(1 - t, decay);
    }
  }
  return buf;
}

export function makeNoise(ctx: BaseAudioContext, seconds = 4) {
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/** Output chain: gentle high-pass (no speaker rumble), soft low-pass, light glue compression. */
export function makeMaster(ctx: BaseAudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 180; // laptop/phone speakers rattle below this
  hp.Q.value = 0.5;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 9000;
  lp.Q.value = 0.5;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -24;
  comp.knee.value = 30;
  comp.ratio.value = 2;
  comp.attack.value = 0.05;
  comp.release.value = 0.6;
  master.connect(hp).connect(lp).connect(comp).connect(ctx.destination);

  const verb = ctx.createConvolver();
  verb.buffer = makeImpulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  verb.connect(wet).connect(master);
  return { master, verb };
}

// A minor, slow and open: Am9 → Fmaj7 → Cmaj9 → Em7  (MIDI notes, mid register only)
const CHORDS = [
  [69, 76, 79, 83, 84], // A4 E5 G5 B5 C6
  [65, 72, 76, 81, 84], // F4 C5 E5 A5 C6
  [60, 67, 76, 79, 83], // C4 G4 E5 G5 B5
  [64, 71, 74, 79, 83], // E4 B4 D5 G5 B5
];
const CHORD_LEN = 14; // seconds per chord
const CHIMES = [81, 84, 86, 88, 91, 93]; // A5 C6 D6 E6 G6 A6 — A minor pentatonic

/** One soft voice: a sine plus a whisper of its octave, slow attack/release, gentle vibrato. */
function voice(ctx: BaseAudioContext, bus: Bus, freq: number, start: number, length: number, level: number) {
  const g = ctx.createGain();
  const attack = 5;
  const release = 7;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(level, start + attack);
  g.gain.setValueAtTime(level, start + length);
  g.gain.linearRampToValueAtTime(0, start + length + release);

  const vib = ctx.createOscillator();
  vib.frequency.value = 0.12 + Math.random() * 0.1;
  const vibAmt = ctx.createGain();
  vibAmt.gain.value = 3; // cents — enough to breathe, not enough to beat

  [[1, 1]].forEach(([mult, amp]) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * mult;
    vibAmt.connect(o.detune);
    const a = ctx.createGain();
    a.gain.value = amp;
    o.connect(a).connect(g);
    o.start(start);
    o.stop(start + length + release + 0.1);
  });
  vib.connect(vibAmt);
  vib.start(start);
  vib.stop(start + length + release + 0.1);

  g.connect(bus.out);
  g.connect(bus.verb);
}

function chime(ctx: BaseAudioContext, bus: Bus, freq: number, start: number, level = 0.018) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(level, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + 4);
  [
    [1, 1],
    [2.76, 0.18],
  ].forEach(([m, a]) => {
    const o = ctx.createOscillator();
    o.frequency.value = freq * m;
    const ag = ctx.createGain();
    ag.gain.value = a;
    o.connect(ag).connect(g);
    o.start(start);
    o.stop(start + 4.1);
  });
  // mostly reverb: it should sound far away
  const dry = ctx.createGain();
  dry.gain.value = 0.25;
  g.connect(dry).connect(bus.out);
  g.connect(bus.verb);
}

/** Low wind: band-limited noise with a slowly moving filter. Runs until stopped. */
function wind(ctx: BaseAudioContext, bus: Bus, start: number) {
  const n = ctx.createBufferSource();
  n.buffer = bus.noise;
  n.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'bandpass';
  lp.frequency.value = 1400;
  lp.Q.value = 0.6;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoAmt = ctx.createGain();
  lfoAmt.gain.value = 500;
  lfo.connect(lfoAmt).connect(lp.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.02, start + 6);
  n.connect(lp).connect(g);
  g.connect(bus.out);
  g.connect(bus.verb);
  n.start(start);
  lfo.start(start);
  return () => {
    try {
      n.stop();
      lfo.stop();
    } catch {
      /* already stopped */
    }
  };
}

/** Schedules every chord and chime that starts inside [from, to). Same code for live and preview. */
export function scheduleAmbient(ctx: BaseAudioContext, bus: Bus, origin: number, from: number, to: number, rnd = Math.random) {
  // chords overlap by their release, so changes are seamless
  const first = Math.max(0, Math.floor((from - origin) / CHORD_LEN));
  for (let k = first; origin + k * CHORD_LEN < to; k++) {
    const at = origin + k * CHORD_LEN;
    if (at < from) continue;
    const chord = CHORDS[k % CHORDS.length];
    chord.forEach((m, i) => voice(ctx, bus, hz(m), at + i * 0.4, CHORD_LEN - 4, i === 0 ? 0.03 : 0.022));
  }
  // a chime now and then (roughly every 4–8 s)
  let t = from + 1 + rnd() * 3;
  while (t < to) {
    chime(ctx, bus, hz(CHIMES[Math.floor(rnd() * CHIMES.length)]), t);
    t += 4 + rnd() * 4;
  }
}

/* -------------------------------------------------------------------------- */
/* Live engine                                                                */
/* -------------------------------------------------------------------------- */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private fx: GainNode | null = null;
  private bus: Bus | null = null;
  private building: Promise<void> | null = null;
  private timer = 0;
  private scheduledTo = 0;
  private origin = 0;
  private stopWind: (() => void) | null = null;
  private usingFile = false;
  private lastTick = 0;
  on = false;

  private async build() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;
    const { master, verb } = makeMaster(ctx);
    this.master = master;
    const fx = ctx.createGain();
    fx.gain.value = 0.8;
    fx.connect(master);
    fx.connect(verb);
    this.fx = fx;
    this.bus = { out: master, verb, noise: makeNoise(ctx) };

    // your own track wins if it exists
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
        this.usingFile = true;
      }
    } catch {
      /* use the generated ambience */
    }
  }

  /** Keeps ~6 s of ambience scheduled ahead; nothing piles up while the tab is hidden. */
  private startAmbient() {
    if (this.usingFile || !this.ctx || !this.bus) return;
    const ctx = this.ctx;
    const bus = this.bus;
    this.origin = ctx.currentTime + 0.1;
    this.scheduledTo = this.origin;
    this.stopWind = wind(ctx, bus, this.origin);
    const tick = () => {
      const ahead = ctx.currentTime + 6;
      if (ahead > this.scheduledTo) {
        scheduleAmbient(ctx, bus, this.origin, this.scheduledTo, ahead);
        this.scheduledTo = ahead;
      }
    };
    tick();
    this.timer = window.setInterval(tick, 1000);
  }

  private stopAmbient() {
    window.clearInterval(this.timer);
    this.stopWind?.();
    this.stopWind = null;
  }

  async enable() {
    if (!this.building) this.building = this.build();
    await this.building;
    if (!this.ctx || !this.master) return;
    await this.ctx.resume();
    this.startAmbient();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0.9, t + 3);
    this.on = true;
  }

  disable() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 1);
    this.on = false;
    window.setTimeout(() => {
      if (this.on) return;
      this.stopAmbient();
      this.ctx?.suspend();
    }, 1100);
  }

  private ready() {
    return this.on && this.ctx && this.fx && this.bus ? this.ctx : null;
  }

  /** Soft glass bell for river line i. */
  cue(i: number) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const base = hz([76, 79, 81, 84][i % 4]); // E5 G5 A5 C6 — inside the A minor ambience
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
    [
      [1, 1],
      [2, 0.2],
      [2.76, 0.08],
    ].forEach(([m, a]) => {
      const o = ctx.createOscillator();
      o.frequency.value = base * m;
      const ag = ctx.createGain();
      ag.gain.value = a;
      o.connect(ag).connect(g);
      o.start(t);
      o.stop(t + 5.1);
    });
    g.connect(this.fx!);
  }

  /** Deep, round impact when the stone breaks (felt more than heard — no rattle). */
  boom() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(190, t + 0.9);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    o.connect(lp).connect(g).connect(this.fx!);
    o.start(t);
    o.stop(t + 1.9);
    // shattering glass: short, bright, mostly in the reverb
    const n = ctx.createBufferSource();
    n.buffer = this.bus!.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3500;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.06, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    n.connect(hp).connect(ng).connect(this.fx!);
    n.start(t);
    n.stop(t + 0.7);
  }

  /** Airy noise sweep. */
  whoosh(duration = 0.8) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const n = ctx.createBufferSource();
    n.buffer = this.bus!.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(250, t);
    bp.frequency.exponentialRampToValueAtTime(1800, t + duration * 0.6);
    bp.frequency.exponentialRampToValueAtTime(500, t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + duration * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    n.connect(bp).connect(g).connect(this.fx!);
    n.start(t);
    n.stop(t + duration + 0.05);
  }

  /** Swell toward the door: a rising sine chord and air, no harsh partials. */
  riser(duration = 5) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + duration * 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration + 1.2);
    [69, 76, 81].forEach((m) => {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(hz(m), t);
      o.frequency.exponentialRampToValueAtTime(hz(m + 12), t + duration);
      o.connect(g);
      o.start(t);
      o.stop(t + duration + 1.3);
    });
    const n = ctx.createBufferSource();
    n.buffer = this.bus!.noise;
    n.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(3000, t + duration);
    const ng = ctx.createGain();
    ng.gain.value = 0.5;
    n.connect(bp).connect(ng).connect(g);
    n.start(t);
    n.stop(t + duration + 1.3);
    g.connect(this.fx!);
  }

  /** Soft, short wooden tick for hovers. */
  tick() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    if (t - this.lastTick < 0.12) return; // never more than ~8 per second
    this.lastTick = t;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(hz(88), t); // E6
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.012, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.1);
  }

  /** Stops everything and releases the audio device. */
  dispose() {
    this.stopAmbient();
    this.ctx?.close();
    this.ctx = null;
    this.on = false;
  }
}

// In dev, hot reload creates a new engine while the old AudioContext keeps playing.
// Close the previous one so you only ever hear the current code.
const globalAudio = globalThis as unknown as { __nuhashAudio?: AudioEngine };
globalAudio.__nuhashAudio?.dispose();
export const audio = new AudioEngine();
globalAudio.__nuhashAudio = audio;