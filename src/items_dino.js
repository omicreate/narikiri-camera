// きょうりゅうの なりきり(ティラノ・トリケラ・くびながに のる)
import { paint, circle, ellipse, vgrad, hgrad, clamp } from './util.js';
import { LW, eye, blinkNow, teethRing } from './art.js';

function trexHead(g) {
  g.beginPath();
  g.moveTo(-0.98, -0.2);
  g.bezierCurveTo(-1.06, -0.85, -0.92, -1.3, -0.56, -1.32);
  g.bezierCurveTo(-0.36, -1.33, -0.24, -1.16, 0, -1.16);
  g.bezierCurveTo(0.24, -1.16, 0.36, -1.33, 0.56, -1.32);
  g.bezierCurveTo(0.92, -1.3, 1.06, -0.85, 0.98, -0.2);
  g.bezierCurveTo(0.94, 0.5, 0.62, 1.12, 0, 1.14);
  g.bezierCurveTo(-0.62, 1.12, -0.94, 0.5, -0.98, -0.2);
  g.closePath();
}

// 顔が ティラノの口の中から のぞく
const trex = {
  id: 'trex', cat: 'dino', name: 'ティラノ', world: 'jungle', word: 'ガオー!', wordCol: '#FFD23F',
  thumb: { s: 0.3, y: 0.06 }, ext: { l: 1.1, r: 1.1, t: 1.45, b: 1.2 },
  hood(g, f, env) {
    const o = f.open, t = env.t, OL = '#1F5B2B';
    g.lineJoin = 'round';
    for (const [x, h] of [[-0.2, 0.2], [0, 0.3], [0.2, 0.2]]) {
      g.beginPath(); g.moveTo(x - 0.12, -1.1); g.quadraticCurveTo(x, -1.14 - h * 1.7, x + 0.12, -1.1); g.closePath();
      paint(g, '#FFA53C', '#B8621B', LW);
    }
    trexHead(g); paint(g, vgrad(g, -1.3, 1.1, [[0, '#86DE5E'], [1, '#3FAE49']]), OL, LW * 1.2);
    g.save(); trexHead(g); g.clip();
    ellipse(g, 0, 1.24, 0.62, 0.4); g.fillStyle = '#CFF5A2'; g.fill();
    g.fillStyle = 'rgba(31,112,52,.5)';
    for (const [x, y, r] of [[-0.8, -0.5, 0.07], [-0.87, -0.2, 0.045], [0.83, -0.42, 0.06], [0.8, 0.2, 0.05], [-0.76, 0.36, 0.05], [0.72, -0.76, 0.04]]) { circle(g, x, y, r); g.fill(); }
    g.restore();
    ellipse(g, 0, 0.06, 0.7, 0.8 + o * 0.1); paint(g, '#A3243B', '#E8607A', 0.05);
    g.fillStyle = OL;
    ellipse(g, -0.13, -0.95 - o * 0.1, 0.035, 0.022, 0.4); g.fill();
    ellipse(g, 0.13, -0.95 - o * 0.1, 0.035, 0.022, -0.4); g.fill();
    const b = blinkNow(t, f.id), look = [clamp(f.yaw * -1.2, -1, 1), 0.45];
    for (const s of [-1, 1]) {
      eye(g, s * 0.5, -1.08, 0.165 * (1 + o * 0.08), { blink: b, look, pupil: 0.5 - o * 0.14, rim: OL });
      g.strokeStyle = OL; g.lineWidth = 0.055; g.lineCap = 'round';
      g.beginPath(); g.moveTo(s * 0.72, -1.3); g.lineTo(s * 0.34, -1.2 + o * 0.05); g.stroke();
    }
  },
  front(g, f, env) {
    const ry = 0.8 + f.open * 0.1;
    env.rim(g, f, '#7A1528', 0.02);
    teethRing(g, 0, 0.06, 0.7, ry, 205, 335, 7, 0.078, 0.15);
    teethRing(g, 0, 0.06, 0.7, ry, 28, 152, 6, 0.066, 0.12);
  },
  onTrigger(f, env) { env.sfx('roar'); env.sfx('fire'); env.shake(10, 0.45); },
  whileOpen(f, env) { const m = f.toCanvas(f.L.mouth.x, f.L.mouth.y); env.fx.fire(m.x, m.y, f.U, 3); },
};

function triHead(g) {
  g.beginPath(); g.moveTo(0, -1.1);
  g.bezierCurveTo(0.6, -1.12, 1.0, -0.95, 1.0, -0.5);
  g.bezierCurveTo(1.0, 0.1, 0.72, 0.7, 0.3, 0.98);
  g.quadraticCurveTo(0, 1.12, -0.3, 0.98);
  g.bezierCurveTo(-0.72, 0.7, -1.0, 0.1, -1.0, -0.5);
  g.bezierCurveTo(-1.0, -0.95, -0.6, -1.12, 0, -1.1);
  g.closePath();
}

function frill(g, R, n, a0, a1) {
  g.beginPath();
  g.moveTo(Math.cos(a0) * R * 0.2, Math.sin(a0) * R * 0.2);
  g.lineTo(Math.cos(a0) * R, Math.sin(a0) * R);
  for (let i = 0; i < n; i++) {
    const b1 = a0 + ((a1 - a0) * (i + 1)) / n, bm = a0 + ((a1 - a0) * (i + 0.5)) / n;
    g.quadraticCurveTo(Math.cos(bm) * R * 1.2, Math.sin(bm) * R * 1.2, Math.cos(b1) * R, Math.sin(b1) * R);
  }
  g.lineTo(Math.cos(a1) * R * 0.2, Math.sin(a1) * R * 0.2);
  g.closePath();
}

function horn(g, bx, by, tx, ty, w, bend) {
  const dx = tx - bx, dy = ty - by, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
  const mx = (bx + tx) / 2 + nx * bend, my = (by + ty) / 2 + ny * bend;
  g.beginPath(); g.moveTo(bx + nx * w, by + ny * w);
  g.quadraticCurveTo(mx + nx * w * 0.55, my + ny * w * 0.55, tx, ty);
  g.quadraticCurveTo(mx - nx * w * 0.55, my - ny * w * 0.55, bx - nx * w, by - ny * w);
  g.closePath();
}

// えりかざりと 3本のつの
const tricera = {
  id: 'tricera', cat: 'dino', name: 'トリケラ', world: 'jungle', word: 'ドッシーン!', wordCol: '#FFB347',
  thumb: { s: 0.26, y: 0.14 }, ext: { l: 1.6, r: 1.6, t: 2.0, b: 1.15 },
  hood(g, f, env) {
    const o = f.open, t = env.t, OL = '#8A4418';
    const fl = 1 + o * 0.09 + Math.sin(t * 36) * 0.012 * o;
    g.lineJoin = 'round';
    g.save(); g.translate(0, -0.2); g.scale(fl, fl);
    const a0 = (158 * Math.PI) / 180, a1 = (382 * Math.PI) / 180;
    frill(g, 1.3, 9, a0, a1); paint(g, '#F26D5B', '#93321F', LW * 1.2);
    frill(g, 1.06, 9, a0, a1); g.fillStyle = '#FF9B88'; g.fill();
    g.fillStyle = '#FFE08A';
    for (let i = 0; i < 9; i++) { const a = a0 + ((a1 - a0) * (i + 0.5)) / 9; circle(g, Math.cos(a) * 1.16, Math.sin(a) * 1.16, 0.075); g.fill(); }
    g.restore();
    triHead(g); paint(g, vgrad(g, -1.1, 1.0, [[0, '#FFB56B'], [1, '#F2843C']]), OL, LW * 1.2);
    g.save(); triHead(g); g.clip();
    ellipse(g, 0, 1.12, 0.44, 0.32); g.fillStyle = '#FFE3A0'; g.fill();
    g.fillStyle = 'rgba(190,90,30,.4)';
    for (const [x, y, r] of [[-0.82, -0.2, 0.05], [0.84, -0.12, 0.06], [-0.7, 0.36, 0.045], [0.66, 0.44, 0.04]]) { circle(g, x, y, r); g.fill(); }
    g.restore();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 0.96, -0.08); g.lineTo(s * 1.16, 0.06); g.lineTo(s * 0.93, 0.2); g.closePath(); paint(g, '#FFF1D0', OL, LW); }
    const b = blinkNow(t, f.id + 2);
    for (const s of [-1, 1]) eye(g, s * 0.74, -0.52, 0.1, { blink: b, look: [-s * 0.5, 0.3], rim: OL, pupil: 0.6 });
    horn(g, 0, -0.8, 0, -1.2, 0.1, 0); paint(g, '#FFF1D0', OL, LW);
  },
  front(g, f, env) {
    env.rim(g, f, '#B45A20', 0.02);
    const OL = '#8A4418', k = 1 + f.open * 0.06;
    for (const s of [-1, 1]) {
      horn(g, s * 0.5, -0.96, s * 0.8 * k, -1.86 * k, 0.12, -s * 0.12);
      paint(g, vgrad(g, -1.9, -0.9, [[0, '#FFFFFF'], [1, '#FFE6B5']]), OL, LW);
    }
  },
  onTrigger(f, env) {
    env.sfx('stomp'); env.sfx('roar', { pitch: 0.78, vol: 0.5 }); env.shake(16, 0.5);
    for (let i = 0; i < 5; i++) env.fx.dust(env.W * (0.1 + 0.2 * i), env.H * 0.98, f.U, 2);
    env.fx.burst('rock', f.cx, env.H * 0.95, f.U, 7, { up: 1.6, speed: 1.2, size: 0.8 });
  },
};

// くびながりゅうの せなかに のる
const brachio = {
  id: 'brachio', cat: 'dino', name: 'くびなが', world: 'jungle', ride: true, rollFactor: 0.3, scroll: 22, word: 'クオーン!', wordCol: '#8CF0DA',
  thumb: { s: 0.2, y: -0.2 }, ext: { l: 2.0, r: 2.0, t: 1.25, b: 2.45 },
  front(g, f, env) {
    const o = f.open, t = env.t, OL = '#1F6F68', C1 = '#62D0C0', C2 = '#3BA79C';
    const k = clamp((f.fitW * 0.97) / 3.6, 0.45, 0.92); f.st.k = k;
    g.save();
    g.translate(0, 1.2 + Math.sin(t * 3 + f.id) * 0.02); g.scale(k * f.side, k); g.translate(0, -1.2);
    g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-1.45, 1.85); g.quadraticCurveTo(-2.2, 1.7, -2.6, 1.2); g.quadraticCurveTo(-2.3, 2.15, -1.55, 2.7); g.closePath(); paint(g, C2, OL, LW);
    ellipse(g, -0.1, 2.45, 1.8, 1.25); paint(g, vgrad(g, 1.2, 3.2, [[0, C1], [1, C2]]), OL, LW * 1.2);
    const lift = o * 0.1, nod = Math.sin(t * 2.2 + f.id) * 0.03;
    g.beginPath(); g.moveTo(0.74, 1.74); g.quadraticCurveTo(0.9, 0.6, 0.9, -0.22 - lift); g.lineTo(1.32, -0.26 - lift); g.quadraticCurveTo(1.58, 0.6, 1.58, 1.95); g.closePath();
    paint(g, hgrad(g, 0.74, 1.58, [[0, '#BFEDE1'], [0.32, C1], [1, C2]]), OL, LW * 1.2);
    g.fillStyle = 'rgba(31,111,104,.4)';
    for (const [x, y, r] of [[1.36, 0.5, 0.07], [1.3, 1.0, 0.09], [1.42, 1.5, 0.06], [-0.9, 1.9, 0.12], [-1.3, 2.3, 0.09], [0.9, 2.2, 0.1]]) { circle(g, x, y, r); g.fill(); }
    // あたま(口をあけると いっしょに あける)
    g.save(); g.translate(1.08, -0.42 - lift + nod); g.rotate(-0.1 - o * 0.18);
    if (o > 0.05) { ellipse(g, -0.2, 0.1 + o * 0.07, 0.24, 0.1 + o * 0.05, 0.1); paint(g, '#B83A4B', OL, LW); }
    ellipse(g, 0, -0.08, 0.4, 0.26); paint(g, C1, OL, LW * 1.2);
    ellipse(g, -0.3, -0.04, 0.16, 0.14); g.fillStyle = '#BFEDE1'; g.fill();
    eye(g, 0.06, -0.16, 0.07, { blink: blinkNow(t, f.id + 5), look: [-0.7, 0.2], rim: OL, pupil: 0.62 });
    g.fillStyle = OL; circle(g, -0.36, -0.1, 0.018); g.fill();
    g.strokeStyle = OL; g.lineWidth = 0.018; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-0.38, 0.05); g.quadraticCurveTo(-0.2, 0.13, -0.02, 0.07); g.stroke();
    g.fillStyle = 'rgba(255,150,160,.5)'; ellipse(g, 0.16, 0.0, 0.07, 0.045); g.fill();
    g.restore();
    // くら
    g.beginPath(); g.moveTo(-0.7, 1.44); g.quadraticCurveTo(0, 1.06, 0.7, 1.44); g.lineTo(0.74, 2.0); g.quadraticCurveTo(0, 1.74, -0.74, 2.0); g.closePath();
    paint(g, '#E8504E', '#8E2422', LW);
    g.strokeStyle = '#FFD166'; g.lineWidth = 0.05; g.beginPath(); g.moveTo(-0.72, 1.92); g.quadraticCurveTo(0, 1.66, 0.72, 1.92); g.stroke();
    ellipse(g, 0, 1.3, 0.44, 0.1); g.fillStyle = '#A93330'; g.fill();
    g.fillStyle = '#FFD166';
    for (const [x, y] of [[-0.5, 1.97], [-0.17, 1.92], [0.17, 1.92], [0.5, 1.97]]) { circle(g, x, y, 0.035); g.fill(); }
    g.restore();
  },
  onTrigger(f, env) {
    env.sfx('call');
    const k = f.st.k || 0.8, p = f.toCanvas(f.side * k * 1.1, 1.2 + (-0.9 - 1.2) * k);
    env.fx.rise('heart', p.x, p.y, f.U * k, 4);
    env.fx.burst('leaf', p.x, p.y, f.U * k, 6, { up: 0.2, g: 0.8 });
    env.boost(1);
  },
};

export default [trex, tricera, brachio];
