// 効果音。録音ファイルは使わず、すべてその場で音を合成する(Web Audio)。
const GAP = { roar: 900, siren: 1500, whistle: 1100, rocket: 1400, boing: 350, munch: 400, stomp: 700, water: 800, call: 900, beep: 600, pop: 60, star: 120, success: 500, fanfare: 1500, shutter: 300, tick: 80, chug: 600, fire: 500, soft: 200 };

export class Sound {
  constructor() { this.ctx = null; this.master = null; this.muted = false; this.last = {}; this.noiseBuf = null; }

  // 最初のタップで呼ぶ(ブラウザは操作の後でないと音を出せない)
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.8;
        const comp = this.ctx.createDynamicsCompressor();
        this.master.connect(comp); comp.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 2;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { /* 音が出せない端末でも遊べるようにする */ }
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.02);
  }

  play(name, o = {}) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return false;
    const now = performance.now();
    if (now - (this.last[name] || -1e9) < (GAP[name] || 0)) return false;
    this.last[name] = now;
    const fn = SFX[name];
    if (!fn) return false;
    try { fn(this, this.ctx.currentTime + 0.01, o); } catch (e) { return false; }
    return true;
  }

  // 文字を読めない子のために、おてほんの ことばを 声で読む(端末の読み上げ機能。なければ 何もしない)
  speak(text) {
    if (this.muted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[!…]/g, ' '));
      u.lang = 'ja-JP'; u.rate = 1; u.pitch = 1.2;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 読み上げが使えなくても 文字は出ている */ }
  }

  // ---- 部品 ----
  out(t, peak, attack, hold, release, dest) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    g.connect(dest || this.master);
    return g;
  }
  osc(type, freq, t, dur, dest) {
    const o = this.ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    o.connect(dest); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  noise(t, dur, dest) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf; s.loop = true;
    s.connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    return s;
  }
  filter(type, freq, q, dest) {
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    f.connect(dest);
    return f;
  }
}

function distCurve(k) {
  const n = 256, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
  return c;
}

const SFX = {
  // ガオー(pitch を下げるとライオン風の低い声)
  roar(a, t, o) {
    const p = o.pitch || 1, d = 1.15, c = a.ctx;
    const g = a.out(t, 0.62 * (o.vol || 1), 0.06, d * 0.5, d * 0.45);
    const lp = a.filter('lowpass', 1500 * p, 1, g);
    lp.frequency.setValueAtTime(1600 * p, t); lp.frequency.exponentialRampToValueAtTime(420 * p, t + d);
    const sh = c.createWaveShaper(); sh.curve = distCurve(30); sh.connect(lp);
    const trem = c.createGain(); trem.gain.value = 0.62; trem.connect(sh);
    const lg = c.createGain(); lg.gain.value = 0.36; lg.connect(trem.gain);
    a.osc('sawtooth', 27, t, d, lg);
    const g1 = c.createGain(); g1.gain.value = 0.5; g1.connect(trem);
    const s = a.osc('sawtooth', 96 * p, t, d, g1);
    s.frequency.linearRampToValueAtTime(138 * p, t + 0.16); s.frequency.exponentialRampToValueAtTime(68 * p, t + d);
    const g2 = c.createGain(); g2.gain.value = 0.3; g2.connect(trem);
    const q = a.osc('square', 49 * p, t, d, g2);
    q.frequency.linearRampToValueAtTime(70 * p, t + 0.16); q.frequency.exponentialRampToValueAtTime(36 * p, t + d);
    const g3 = c.createGain(); g3.gain.value = 0.42; g3.connect(trem);
    a.noise(t, d, a.filter('bandpass', 620 * p, 0.7, g3));
  },
  fire(a, t) {
    const g = a.out(t, 0.5, 0.08, 0.25, 0.4);
    const bp = a.filter('bandpass', 400, 0.6, g);
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(1300, t + 0.6);
    a.noise(t, 0.8, bp);
  },
  // 消防車のサイレン+鐘
  siren(a, t) {
    const g = a.out(t, 0.2, 0.08, 1.5, 0.25);
    const lp = a.filter('lowpass', 2200, 0.7, g);
    const s = a.osc('sawtooth', 460, t, 1.9, lp);
    s.frequency.setValueAtTime(460, t); s.frequency.linearRampToValueAtTime(880, t + 0.85); s.frequency.linearRampToValueAtTime(460, t + 1.75);
    for (let i = 0; i < 4; i++) {
      const bt = t + 0.25 + i * 0.36;
      const bg = a.out(bt, 0.22, 0.004, 0.01, 0.3);
      a.osc('sine', 1240, bt, 0.35, bg); a.osc('sine', 1870, bt, 0.35, bg);
    }
  },
  // 汽笛 ポッ ポー
  whistle(a, t) {
    const toot = (t0, dur) => {
      const g = a.out(t0, 0.2, 0.03, dur, 0.12);
      const bp = a.filter('lowpass', 2600, 0.8, g);
      [587, 698, 880].forEach((f) => { const s = a.osc('triangle', f * 0.985, t0, dur + 0.2, bp); s.frequency.linearRampToValueAtTime(f, t0 + 0.07); });
      const ng = a.out(t0, 0.05, 0.02, dur, 0.1);
      a.noise(t0, dur + 0.2, a.filter('bandpass', 1500, 0.8, ng));
    };
    toot(t, 0.14); toot(t + 0.28, 0.7);
  },
  chug(a, t) {
    for (let i = 0; i < 4; i++) {
      const t0 = t + i * 0.17;
      const g = a.out(t0, 0.26, 0.01, 0.03, 0.09);
      a.noise(t0, 0.15, a.filter('bandpass', 900, 0.6, g));
    }
  },
  rocket(a, t) {
    const d = 1.7;
    const g = a.out(t, 0.5, 0.5, d * 0.4, d * 0.4);
    const lp = a.filter('lowpass', 250, 0.8, g);
    lp.frequency.setValueAtTime(220, t); lp.frequency.exponentialRampToValueAtTime(2600, t + d);
    a.noise(t, d + 0.5, lp);
    const g2 = a.out(t, 0.3, 0.3, d * 0.5, d * 0.4);
    const s = a.osc('sawtooth', 48, t, d + 0.4, a.filter('lowpass', 400, 1, g2));
    s.frequency.exponentialRampToValueAtTime(120, t + d);
  },
  boing(a, t) {
    const g = a.out(t, 0.4, 0.01, 0.1, 0.32);
    const s = a.osc('sine', 250, t, 0.5, g);
    s.frequency.exponentialRampToValueAtTime(740, t + 0.13); s.frequency.exponentialRampToValueAtTime(430, t + 0.42);
    const lg = a.ctx.createGain(); lg.gain.value = 22; lg.connect(s.frequency);
    a.osc('sine', 17, t, 0.5, lg);
  },
  pop(a, t, o) {
    const g = a.out(t, 0.3, 0.004, 0.02, 0.08);
    const s = a.osc('sine', 520 * (o.pitch || 1), t, 0.12, g);
    s.frequency.exponentialRampToValueAtTime(940 * (o.pitch || 1), t + 0.07);
  },
  munch(a, t) {
    for (let i = 0; i < 3; i++) {
      const t0 = t + i * 0.14;
      const g = a.out(t0, 0.6, 0.004, 0.02, 0.07);
      a.noise(t0, 0.1, a.filter('lowpass', 900 - i * 120, 2, g));
      const g2 = a.out(t0, 0.14, 0.004, 0.01, 0.06);
      a.osc('square', 150 - i * 15, t0, 0.08, g2);
    }
  },
  shutter(a, t) {
    [0, 0.085].forEach((dt, i) => {
      const g = a.out(t + dt, i ? 0.26 : 0.34, 0.002, 0.012, 0.05);
      a.noise(t + dt, 0.07, a.filter('highpass', 1800, 0.7, g));
    });
  },
  success(a, t) {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const t0 = t + i * 0.085;
      const g = a.out(t0, 0.2, 0.006, 0.05, 0.3);
      a.osc('triangle', f, t0, 0.4, g); a.osc('sine', f * 2, t0, 0.4, a.out(t0, 0.05, 0.006, 0.03, 0.2));
    });
  },
  fanfare(a, t) {
    const seq = [[523.25, 0], [523.25, 0.14], [523.25, 0.28], [698.46, 0.42], [659.25, 0.72], [783.99, 0.86], [1046.5, 1.0]];
    seq.forEach(([f, dt], i) => {
      const last = i === seq.length - 1;
      const g = a.out(t + dt, 0.2, 0.008, last ? 0.5 : 0.07, last ? 0.7 : 0.16);
      a.osc('triangle', f, t + dt, 1.4, g);
      a.osc('square', f / 2, t + dt, 1.4, a.out(t + dt, 0.045, 0.008, last ? 0.5 : 0.07, 0.16));
    });
  },
  star(a, t, o) {
    const p = o.pitch || 1;
    const g = a.out(t, 0.28, 0.004, 0.02, 0.5);
    a.osc('sine', 1318.5 * p, t, 0.6, g); a.osc('sine', 1975.5 * p, t, 0.6, a.out(t, 0.07, 0.004, 0.02, 0.35));
  },
  stomp(a, t) {
    const g = a.out(t, 0.7, 0.008, 0.05, 0.4);
    const s = a.osc('sine', 100, t, 0.5, g);
    s.frequency.exponentialRampToValueAtTime(34, t + 0.36);
    const g2 = a.out(t, 0.4, 0.005, 0.04, 0.22);
    a.noise(t, 0.3, a.filter('lowpass', 240, 0.8, g2));
  },
  water(a, t) {
    const g = a.out(t, 0.34, 0.08, 0.55, 0.3);
    const hp = a.filter('highpass', 1100, 0.6, g);
    const bp = a.filter('bandpass', 2600, 0.5, hp);
    a.noise(t, 1.0, bp);
  },
  beep(a, t) {
    [880, 1174.7, 1568].forEach((f, i) => {
      const t0 = t + i * 0.1;
      a.osc('sine', f, t0, 0.1, a.out(t0, 0.24, 0.006, 0.04, 0.07));
    });
    const g = a.out(t + 0.34, 0.1, 0.02, 0.2, 0.3);
    const s = a.osc('sine', 600, t + 0.34, 0.6, g);
    s.frequency.exponentialRampToValueAtTime(1800, t + 0.9);
  },
  // 首長竜の呼び声
  call(a, t) {
    const d = 0.95;
    const g = a.out(t, 0.3, 0.06, d * 0.55, d * 0.4);
    const lp = a.filter('lowpass', 1800, 1.2, g);
    ['triangle', 'sine'].forEach((type, i) => {
      const s = a.osc(type, 320 * (i + 1), t, d + 0.1, lp);
      s.frequency.linearRampToValueAtTime(520 * (i + 1), t + 0.34); s.frequency.linearRampToValueAtTime(385 * (i + 1), t + d);
      const lg = a.ctx.createGain(); lg.gain.value = 9; lg.connect(s.frequency);
      a.osc('sine', 6.5, t, d + 0.1, lg);
    });
  },
  tick(a, t) { a.osc('sine', 700, t, 0.05, a.out(t, 0.2, 0.003, 0.012, 0.04)); },
  soft(a, t) {
    [392, 330].forEach((f, i) => a.osc('sine', f, t + i * 0.12, 0.2, a.out(t + i * 0.12, 0.13, 0.01, 0.05, 0.14)));
  },
};
