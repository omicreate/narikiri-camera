// おしごとの なりきり(しょうぼうし・コックさん・うちゅうひこうし)。服は wear、かぶりものは front
import { TAU, paint, circle, ellipse, rrect, vgrad, rand, starPath } from './util.js';
import { LW, torsoPath, SPRITES } from './art.js';

const firefighter = {
  id: 'firefighter', cat: 'job', name: 'しょうぼうし', world: 'town', word: 'しょうか!', wordCol: '#7FD3FF',
  thumb: { s: 0.24, y: -0.03 }, ext: { l: 1.4, r: 1.4, t: 1.5, b: 2.3 },
  wear(g, f, env) {
    const OD = '#C9540A', T = { w: 1.3, wide: env.masked };
    g.lineJoin = 'round';
    torsoPath(g, T); paint(g, vgrad(g, 0.88, 3.0, [[0, '#FF8E33'], [1, '#FF7A1A']]), env.masked ? null : OD, LW * 1.2);
    g.save(); torsoPath(g, T); g.clip();
    for (const y of [1.9, 2.65]) { g.fillStyle = '#F6E96B'; g.fillRect(-3, y, 6, 0.2); g.fillStyle = '#D9DEE6'; g.fillRect(-3, y + 0.065, 6, 0.07); }
    g.strokeStyle = OD; g.lineWidth = 0.03; g.beginPath(); g.moveTo(0, 1.3); g.lineTo(0, 3.6); g.stroke();
    g.restore();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 0.28, 0.88); g.lineTo(s * 0.62, 1.1); g.lineTo(s * 0.2, 1.52); g.lineTo(0, 1.3); g.closePath(); paint(g, '#2B3A5C', '#141c2e', LW); }
    circle(g, 0.62, 1.58, 0.13); paint(g, '#FFD84D', '#8a6a12', LW * 0.8);
    g.fillStyle = '#E8402F'; starPath(g, 0.62, 1.58, 0.085); g.fill();
  },
  hood(g) {   // ヘルメットから下がる布(しころ)
    g.lineJoin = 'round';
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(s * 0.4, -0.6); g.lineTo(s * 0.78, -0.6); g.quadraticCurveTo(s * 1.0, 0.3, s * 0.9, 0.98); g.quadraticCurveTo(s * 0.6, 1.08, s * 0.36, 0.86); g.closePath();
      paint(g, '#C9D2DC', '#6f7b89', LW);
    }
  },
  front(g, f, env) {
    const OL = '#59616d', o = f.open;
    g.lineJoin = 'round';
    // にじ(水を出しているあいだ)
    if (o > 0.25 && !env.thumb) {
      const cols = ['#FF6B6B', '#FFB347', '#FFE66D', '#7BE08A', '#6EC8FF', '#B79CFF'];
      const a0 = g.globalAlpha;
      g.globalAlpha = a0 * (o - 0.25) * 0.75; g.lineWidth = 0.05;
      cols.forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(0, 0.5, 1.72 - i * 0.05, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); });
      g.globalAlpha = a0;
    }
    // ヘルメット
    g.beginPath(); g.moveTo(-0.76, -0.56); g.bezierCurveTo(-0.84, -1.1, -0.45, -1.36, 0, -1.36); g.bezierCurveTo(0.45, -1.36, 0.84, -1.1, 0.76, -0.56); g.quadraticCurveTo(0, -0.7, -0.76, -0.56); g.closePath();
    paint(g, vgrad(g, -1.36, -0.56, [[0, '#FFFFFF'], [1, '#D7DEE6']]), OL, LW * 1.2);
    g.beginPath(); g.moveTo(-0.07, -1.36); g.lineTo(0.07, -1.36); g.lineTo(0.09, -0.68); g.lineTo(-0.09, -0.68); g.closePath(); g.fillStyle = '#E8402F'; g.fill();
    g.beginPath(); g.moveTo(-0.86, -0.5); g.quadraticCurveTo(0, -0.74, 0.86, -0.5); g.quadraticCurveTo(0.9, -0.42, 0.82, -0.4); g.quadraticCurveTo(0, -0.62, -0.82, -0.4); g.quadraticCurveTo(-0.9, -0.42, -0.86, -0.5); g.closePath();
    paint(g, '#B9C2CD', OL, LW);
    g.beginPath(); g.moveTo(0, -1.14); g.quadraticCurveTo(0.21, -1.1, 0.2, -0.92); g.quadraticCurveTo(0.17, -0.74, 0, -0.67); g.quadraticCurveTo(-0.17, -0.74, -0.2, -0.92); g.quadraticCurveTo(-0.21, -1.1, 0, -1.14); g.closePath();
    paint(g, '#FFD84D', '#8a6a12', LW);
    g.fillStyle = '#E8402F'; starPath(g, 0, -0.9, 0.1); g.fill();
    // ホース(右下から のびてきて、先が 上を向く)
    g.lineCap = 'round';
    for (const [lw, col] of [[0.2, '#7d745e'], [0.15, '#EDE6D2']]) {
      g.strokeStyle = col; g.lineWidth = lw;
      g.beginPath(); g.moveTo(1.75, 3.2); g.bezierCurveTo(1.7, 2.3, 0.9, 2.3, 1.0, 1.9); g.stroke();
    }
    g.save(); g.translate(1.15, 1.42); g.rotate(-1.28);
    rrect(g, -0.5, -0.1, 0.5, 0.2, 0.05); paint(g, '#D9A441', '#7a5514', LW * 0.9);
    g.beginPath(); g.moveTo(0, -0.11); g.lineTo(0.3, -0.065); g.lineTo(0.3, 0.065); g.lineTo(0, 0.11); g.closePath(); paint(g, '#F2C14E', '#7a5514', LW * 0.9);
    rrect(g, -0.64, -0.12, 0.16, 0.24, 0.04); paint(g, '#C8362E', '#6f1c16', LW * 0.9);
    rrect(g, -0.3, -0.19, 0.07, 0.1, 0.02); paint(g, '#8E97A3', '#3f4650', LW * 0.7);
    g.restore();
  },
  onTrigger(f, env) { env.sfx('water'); env.sfx('pop'); },
  // 水が 頭の上を こえて アーチになる
  whileOpen(f, env) {
    const p = f.toCanvas(1.15 + Math.cos(-1.28) * 0.3, 1.42 + Math.sin(-1.28) * 0.3), u = f.U;
    for (let i = 0; i < 3; i++) env.fx.add({ k: 'drop', x: p.x, y: p.y, vx: (-1.0 + rand(-0.2, 0.2)) * u, vy: (-3.4 + rand(-0.3, 0.3)) * u, ay: 2.4 * u, s: rand(0.04, 0.075) * u, max: 2.5 });
  },
};

const chef = {
  id: 'chef', cat: 'job', name: 'コックさん', world: 'kitchen', word: 'いただきます!', wordCol: '#FFB3A7',
  thumb: { s: 0.22, y: 0.1 }, ext: { l: 1.4, r: 1.4, t: 1.95, b: 2.2 },
  wear(g, f, env) {
    const T = { w: 1.3, wide: env.masked };
    g.lineJoin = 'round';
    torsoPath(g, T); paint(g, vgrad(g, 0.88, 3.0, [[0, '#FFFFFF'], [1, '#EEF1F5']]), env.masked ? null : '#9AA5B1', LW * 1.2);
    g.save(); torsoPath(g, T); g.clip();
    g.strokeStyle = '#C5CCD6'; g.lineWidth = 0.02; g.beginPath(); g.moveTo(0.34, 1.4); g.quadraticCurveTo(0.46, 2.3, 0.4, 3.6); g.stroke();
    g.fillStyle = '#3A4350'; for (const y of [1.85, 2.25, 2.65]) for (const x of [-0.28, 0.28]) { circle(g, x, y, 0.055); g.fill(); }
    g.restore();
    g.beginPath(); g.moveTo(-0.4, 0.9); g.quadraticCurveTo(0, 1.18, 0.4, 0.9); g.lineTo(0.48, 1.08); g.quadraticCurveTo(0, 1.4, -0.48, 1.08); g.closePath(); paint(g, '#E8402F', '#8a231a', LW);
    g.beginPath(); g.moveTo(-0.08, 1.24); g.lineTo(0.08, 1.24); g.lineTo(0.2, 1.66); g.lineTo(0, 1.56); g.lineTo(-0.2, 1.66); g.closePath(); paint(g, '#E8402F', '#8a231a', LW);
    circle(g, 0, 1.26, 0.085); paint(g, '#F2594A', '#8a231a', LW);
  },
  front(g, f, env) {
    const OL = '#9AA5B1', bob = Math.sin(env.t * 2 + f.id) * 0.01 + f.open * 0.03;
    g.lineJoin = 'round';
    const puffs = [[-0.5, -1.2, 0.3], [-0.2, -1.42, 0.34], [0.2, -1.46, 0.36], [0.52, -1.22, 0.3], [0, -1.12, 0.42]];
    g.strokeStyle = OL; g.lineWidth = LW * 2.4;
    for (const [x, y, r] of puffs) { circle(g, x, y - bob, r); g.stroke(); }
    g.fillStyle = '#FFFFFF'; for (const [x, y, r] of puffs) { circle(g, x, y - bob, r); g.fill(); }
    g.fillStyle = 'rgba(160,175,195,.25)'; ellipse(g, 0.25, -1.12 - bob, 0.34, 0.16, -0.3); g.fill();
    rrect(g, -0.68, -0.92, 1.36, 0.4, 0.07); paint(g, vgrad(g, -0.92, -0.52, [[0, '#FFFFFF'], [1, '#E6EAF0']]), OL, LW * 1.2);
    g.strokeStyle = 'rgba(154,165,177,.6)'; g.lineWidth = 0.014;
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 0.18, -0.88); g.lineTo(i * 0.18, -0.56); g.stroke(); }
    // くるんとした ひげ
    const nb = f.L.noseBase, mt = f.L.mouthTop, x = (nb.x + mt.x) / 2, y = nb.y * 0.45 + mt.y * 0.55;
    g.fillStyle = '#4A2C1A';
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(x, y - 0.02);
      g.bezierCurveTo(x + s * 0.1, y - 0.07, x + s * 0.22, y + 0.03, x + s * 0.3, y - 0.07);
      g.bezierCurveTo(x + s * 0.24, y + 0.09, x + s * 0.1, y + 0.07, x, y + 0.035);
      g.closePath(); g.fill();
    }
  },
  // ごちそうが 口に とびこむ
  onTrigger(f, env) {
    const target = () => f.toCanvas(f.L.mouth.x, f.L.mouth.y);
    const foods = [SPRITES.onigiri, SPRITES.strawberry, SPRITES.donut, SPRITES.pudding];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * (0.1 + 0.8 * Math.random()), c = f.toCanvas(Math.cos(a) * 2.0, Math.sin(a) * 1.9);
      env.fx.homing(c.x, c.y, f.U, target, {
        size: 0.17, speed: 2.0, draw: foods[i % 4],
        onArrive: (p) => { env.sfx('pop', { pitch: 0.8 + Math.random() * 0.5 }); env.fx.burst('star', p.x, p.y, f.U, 2, { up: 0.3, size: 0.6, life: 0.5 }); },
      });
    }
    env.sfx('tick');
  },
};

const SUIT = { w: 1.36, top: 1.0, v: 1.12, neck: 0.5 };
const astronaut = {
  id: 'astronaut', cat: 'job', name: 'うちゅうひこうし', world: 'space', rollFactor: 0.8, scroll: 6, word: 'うちゅうだー!', wordCol: '#9FD8FF',
  thumb: { s: 0.2, y: 0.02 }, ext: { l: 1.45, r: 1.45, t: 1.8, b: 2.2 }, window: { x: 0, y: -0.04, rx: 0.88, ry: 0.84 },
  wear(g, f, env) {
    const T = { ...SUIT, wide: env.masked };
    g.lineJoin = 'round';
    torsoPath(g, T); paint(g, vgrad(g, 1.0, 3.0, [[0, '#FFFFFF'], [1, '#E3E9F1']]), env.masked ? null : '#8E9AAA', LW * 1.2);
    g.save(); torsoPath(g, T); g.clip();
    g.fillStyle = '#3D7BE0';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 0.86, 1.0); g.lineTo(s * 1.08, 1.0); g.lineTo(s * 1.3, 3.6); g.lineTo(s * 1.06, 3.6); g.closePath(); g.fill(); }
    g.restore();
    rrect(g, -0.42, 1.84, 0.84, 0.56, 0.08); paint(g, '#D5DCE6', '#6f7b89', LW);
    rrect(g, -0.34, 1.92, 0.36, 0.2, 0.03); g.fillStyle = '#16204A'; g.fill();
    g.strokeStyle = '#6EE0A8'; g.lineWidth = 0.016; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-0.3, 2.04); g.lineTo(-0.22, 2.04); g.lineTo(-0.18, 1.96); g.lineTo(-0.12, 2.08); g.lineTo(-0.08, 2.02); g.lineTo(-0.02, 2.02); g.stroke();
    const on = Math.floor(env.t * 2) % 3;
    ['#FF6B5E', '#FFD84D', '#6EE0A8'].forEach((c, i) => { circle(g, 0.14 + i * 0.1, 1.98, 0.035); g.fillStyle = i === on ? c : 'rgba(120,130,150,.6)'; g.fill(); });
    rrect(g, -0.34, 2.2, 0.68, 0.1, 0.03); g.fillStyle = '#8FA6BF'; g.fill();
    circle(g, -0.8, 1.74, 0.13); paint(g, '#2B3A7A', '#141c40', LW * 0.8);
    g.fillStyle = '#FFD84D'; starPath(g, -0.8, 1.74, 0.08); g.fill();
  },
  front(g, f, env) {
    const t = env.t, OL = '#7C8898';
    g.save(); g.translate(0, Math.sin(t * 1.3 + f.id) * 0.025);
    g.lineJoin = 'round';
    g.strokeStyle = OL; g.lineWidth = 0.035; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.6, -1.24); g.lineTo(0.82, -1.66); g.stroke();
    circle(g, 0.82, -1.68, 0.075); paint(g, Math.sin(t * 5) > 0 ? '#FF5A4F' : '#B93A33', '#6f1c16', LW * 0.8);
    for (const s of [-1, 1]) { rrect(g, s * 1.3 - 0.1, -0.3, 0.2, 0.46, 0.07); paint(g, '#B9C4D2', OL, LW); }
    // ヘルメット(顔のところは あける)
    const shell = () => { g.moveTo(1.3, -0.1); g.arc(0, -0.1, 1.3, 0, TAU); g.closePath(); };
    const visor = () => { g.moveTo(0.88, -0.04); g.ellipse(0, -0.04, 0.88, 0.84, 0, 0, TAU, true); g.closePath(); };
    const gr = g.createRadialGradient(-0.45, -0.7, 0.1, 0, -0.1, 1.35);
    gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.6, '#F2F5F9'); gr.addColorStop(1, '#CBD5E2');
    g.beginPath(); shell(); visor(); g.fillStyle = gr; g.fill('evenodd');
    g.beginPath(); shell(); g.strokeStyle = OL; g.lineWidth = LW * 1.2; g.stroke();
    ellipse(g, 0, -0.04, 0.88, 0.84); g.fillStyle = 'rgba(150,205,255,.1)'; g.fill();
    ellipse(g, 0, -0.04, 0.915, 0.875); g.strokeStyle = '#F2B84B'; g.lineWidth = 0.07; g.stroke();
    g.strokeStyle = '#8a6a12'; g.lineWidth = LW * 0.8;
    ellipse(g, 0, -0.04, 0.95, 0.91); g.stroke(); ellipse(g, 0, -0.04, 0.88, 0.84); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 0.05;
    g.beginPath(); g.ellipse(0, -0.04, 0.74, 0.7, 0, Math.PI * 1.1, Math.PI * 1.4); g.stroke();
    g.beginPath(); g.ellipse(0, -0.04, 0.74, 0.7, 0, Math.PI * 1.45, Math.PI * 1.5); g.stroke();
    rrect(g, -0.84, 1.02, 1.68, 0.3, 0.14); paint(g, vgrad(g, 1.02, 1.32, [[0, '#D5DCE6'], [1, '#A9B5C5']]), OL, LW);
    g.restore();
  },
  onTrigger(f, env) {
    env.sfx('beep'); env.boost(2);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU, p = f.toCanvas(Math.cos(a) * 1.5, -0.1 + Math.sin(a) * 1.5);
      env.fx.rise(i % 2 ? 'star' : 'spark', p.x, p.y, f.U, 1, { size: 1.2 });
    }
  },
  whileOpen(f, env) {
    if (Math.random() < 0.25) { const p = f.toCanvas(rand(-1.6, 1.6), rand(0.2, 1.6)); env.fx.rise('star', p.x, p.y, f.U, 1, { size: 0.8 }); }
  },
};

export default [firefighter, chef, astronaut];
