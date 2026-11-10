// どうぶつの なりきり(ライオン・うさぎ・パンダ)
import { TAU, paint, circle, ellipse, vgrad, clamp, scallop } from './util.js';
import { LW, blinkNow, snout, whiskers, blush, SPRITES } from './art.js';

const lion = {
  id: 'lion', cat: 'animal', name: 'ライオン', world: 'savanna', word: 'ガオー!', wordCol: '#FFC14D',
  thumb: { s: 0.33, y: 0.03 }, ext: { l: 1.3, r: 1.3, t: 1.35, b: 1.3 },
  hood(g, f, env) {
    const o = f.open, t = env.t, OL = '#6E3610';
    const puff = 1 + o * 0.1 + Math.sin(t * 34) * 0.012 * o;
    g.lineJoin = 'round';
    g.save(); g.scale(puff, puff);
    scallop(g, 0, -0.02, 1.04, 13, 0.16, t * 0.05); paint(g, '#B9601A', OL, LW * 1.2);
    scallop(g, 0, -0.02, 0.88, 13, 0.14, TAU / 26 - t * 0.04); g.fillStyle = '#E58A2E'; g.fill();
    g.restore();
    for (const s of [-1, 1]) {
      circle(g, s * 0.63, -0.86, 0.2); paint(g, '#F7C552', '#8A5514', LW);
      circle(g, s * 0.63, -0.84, 0.11); g.fillStyle = '#E58A2E'; g.fill();
    }
    ellipse(g, 0, 0, 0.72, 0.88); paint(g, vgrad(g, -0.9, 0.9, [[0, '#FBD468'], [1, '#F2B63F']]), '#8A5514', LW);
  },
  front(g, f, env) {
    env.rim(g, f, '#C98A2A', 0.02);
    const n = f.L.nose;
    whiskers(g, n.x, n.y, '#4A2A17', 0.44, 'rgba(255,255,255,.5)');
    g.fillStyle = '#4A2A17';
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { circle(g, n.x + s * (0.1 + (i % 2) * 0.04), n.y + 0.07 + i * 0.03, 0.01); g.fill(); }
    snout(g, n.x, n.y, 0.19, '#5A3320');
    g.strokeStyle = '#5A3320'; g.lineWidth = 0.014; g.lineCap = 'round';
    g.beginPath(); g.moveTo(n.x, n.y + 0.068); g.lineTo(n.x, n.y + 0.11); g.stroke();
  },
  onTrigger(f, env) {
    env.sfx('roar', { pitch: 0.82 }); env.shake(8, 0.4);
    const m = f.toCanvas(f.L.mouth.x, f.L.mouth.y);
    env.fx.ring(m.x, m.y, f.U, '#FFE08A', 3);
  },
};

const rabbit = {
  id: 'rabbit', cat: 'animal', name: 'うさぎ', world: 'meadow', word: 'ぴょーん!', wordCol: '#FF9EC4',
  thumb: { s: 0.28, y: 0.22 }, ext: { l: 0.9, r: 0.9, t: 2.0, b: 1.0 },
  // 耳が ばねのように ゆれる
  update(f, env, dt) {
    const st = f.st;
    if (st.a === undefined) { st.a = 0; st.v = 0; st.h = 0; st.hv = 0; st.heart = 0; }
    const target = clamp(-f.vx * 0.22, -0.55, 0.55);
    st.v += ((target - st.a) * 110 - st.v * 9) * dt; st.a += st.v * dt;
    st.hv += (((f.openOn ? 0.3 : 0) - st.h) * 190 - st.hv * 11) * dt; st.h += st.hv * dt;
    if (!env.thumb && f.smile > 0.55 && env.t - st.heart > 0.55) {
      st.heart = env.t;
      const c = Math.random() < 0.5 ? f.L.cheekL : f.L.cheekR, p = f.toCanvas(c.x * 1.5, c.y - 0.15);
      env.fx.rise('heart', p.x, p.y, f.U, 1);
    }
  },
  front(g, f) {
    const st = f.st, a = st.a || 0, h = st.h || 0;
    g.lineJoin = 'round';
    for (const s of [-1, 1]) {
      g.save(); g.translate(s * 0.27, -0.78); g.rotate(s * 0.2 + a * (s > 0 ? 1 : 0.82)); g.scale(1, 1 + h);
      g.beginPath(); g.moveTo(-0.15, 0.06); g.bezierCurveTo(-0.26, -0.4, -0.2, -1.02, 0, -1.06); g.bezierCurveTo(0.2, -1.02, 0.26, -0.4, 0.15, 0.06); g.closePath();
      paint(g, '#FFFFFF', '#B9A9A2', LW);
      g.beginPath(); g.moveTo(-0.07, -0.1); g.bezierCurveTo(-0.14, -0.42, -0.11, -0.86, 0, -0.9); g.bezierCurveTo(0.11, -0.86, 0.14, -0.42, 0.07, -0.1); g.closePath();
      g.fillStyle = '#FFB3C7'; g.fill();
      g.restore();
    }
    for (const s of [-1, 1]) { circle(g, s * 0.27, -0.74, 0.12); paint(g, '#FFFFFF', '#B9A9A2', LW); }
    blush(g, f, '#FF8FB0', 0.11, 0.45);
    const n = f.L.nose;
    whiskers(g, n.x, n.y, '#FFFFFF', 0.4, 'rgba(60,40,40,.45)');
    snout(g, n.x, n.y, 0.13, '#FF7FA5');
  },
  onTrigger(f, env) {
    env.sfx('boing');
    const p = f.toCanvas(0, -1.4);
    env.fx.burst('heart', p.x, p.y, f.U, 5, { up: 1.2 });
    env.fx.burst('sprite', p.x, p.y, f.U, 4, { up: 1.4, size: 1.6, draw: SPRITES.carrot });
  },
};

// 顔のまわりを フードで つつむ。パンダの顔は フードの上
const panda = {
  id: 'panda', cat: 'animal', name: 'パンダ', world: 'bamboo', word: 'もぐもぐ!', wordCol: '#A5E88F',
  thumb: { s: 0.28, y: 0.16 }, ext: { l: 1.1, r: 1.1, t: 1.55, b: 1.15 },
  hood(g, f, env) {
    const t = env.t, OL = '#7E8894', K = '#24272C';
    g.lineJoin = 'round';
    const wig = Math.sin(t * 2.4 + f.id) * 0.03 + f.open * 0.05;
    for (const s of [-1, 1]) { circle(g, s * (0.72 + wig * 0.3), -1.12 - wig, 0.27); paint(g, K, '#0f1114', LW); }
    ellipse(g, 0, -0.2, 1.0, 1.24); paint(g, vgrad(g, -1.44, 1.04, [[0, '#FFFFFF'], [1, '#E9EDF2']]), OL, LW * 1.2);
    const b = blinkNow(t, f.id + 3);
    for (const s of [-1, 1]) {
      ellipse(g, s * 0.34, -1.02, 0.16, 0.2, s * 0.5); g.fillStyle = K; g.fill();
      if (b) { g.strokeStyle = '#ffffff'; g.lineWidth = 0.022; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 0.27, -1.0); g.lineTo(s * 0.39, -1.0); g.stroke(); }
      else { circle(g, s * 0.33, -1.0, 0.055); g.fillStyle = '#ffffff'; g.fill(); circle(g, s * 0.325, -0.995, 0.03); g.fillStyle = K; g.fill(); }
      ellipse(g, s * 0.64, -0.8, 0.08, 0.05); g.fillStyle = 'rgba(255,150,170,.5)'; g.fill();
    }
    ellipse(g, 0, -0.85, 0.07, 0.045); g.fillStyle = K; g.fill();
    g.strokeStyle = K; g.lineWidth = 0.016; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-0.07, -0.775); g.quadraticCurveTo(-0.035, -0.735, 0, -0.78); g.quadraticCurveTo(0.035, -0.735, 0.07, -0.775); g.stroke();
  },
  front(g, f, env) { env.rim(g, f, '#B8C1CC', 0.02); blush(g, f, '#FF9FB5', 0.1, 0.4); },
  onTrigger(f, env) {
    const target = () => f.toCanvas(f.L.mouth.x, f.L.mouth.y);
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * TAU, c = f.toCanvas(Math.cos(a) * 1.9, Math.sin(a) * 1.5);
      env.fx.homing(c.x, c.y, f.U, target, {
        size: 0.16, speed: 2.4, draw: SPRITES.bamboo,
        onArrive: (p) => { env.sfx('munch'); env.fx.burst('spark', p.x, p.y, f.U, 3, { up: 0.2, size: 0.6, life: 0.5 }); },
      });
    }
  },
};

export default [lion, rabbit, panda];
