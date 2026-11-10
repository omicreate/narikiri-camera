// のりもの(しょうぼうしゃ・きかんしゃ・ロケット)。顔の下に車体を置いて「乗っている」ように見せる
import { TAU, paint, circle, ellipse, rrect, vgrad, hgrad, clamp, rand, starPath } from './util.js';
import { LW, wheel, label } from './art.js';

// 画面の幅に入るよう車体の大きさを決める(顔が大きいときは小さく)
const rideK = (f, units) => clamp((f.fitW * 0.97) / units, 0.45, 0.92);
const rideOpen = (g, f, env, k, speed) => {
  g.save();
  g.translate(0, 1.2 + Math.sin(env.t * speed + f.id) * 0.008); g.scale(k, k); g.translate(0, -1.2);
  g.lineJoin = 'round';
};

const firetruck = {
  id: 'firetruck', cat: 'vehicle', name: 'しょうぼうしゃ', world: 'town', ride: true, rollFactor: 0.25, scroll: 60, word: 'ウーウー!', wordCol: '#FF7B6E',
  thumb: { s: 0.2, y: -0.22 }, ext: { l: 2.1, r: 1.8, t: 1.25, b: 2.55 },
  front(g, f, env) {
    const o = f.open, t = env.t, R = '#E8402F', RD = '#BF2C20', OL = '#5E130E';
    const k = rideK(f, 3.9); f.st.k = k;
    rideOpen(g, f, env, k, 9);
    // はしご(口をあけると 上がる)
    const la = 0.6 + o * 0.22; f.st.la = la;
    g.save(); g.translate(-1.25, 1.3); g.rotate(la);
    g.lineCap = 'round';
    for (const [lw, col] of [[0.085, '#5B6673'], [0.045, '#E2E7ED']]) {
      g.strokeStyle = col; g.lineWidth = lw;
      g.beginPath(); g.moveTo(0, -0.085); g.lineTo(-1.15, -0.085); g.moveTo(0, 0.085); g.lineTo(-1.15, 0.085);
      for (let i = 1; i < 8; i++) { g.moveTo(-i * 0.14, -0.085); g.lineTo(-i * 0.14, 0.085); }
      g.stroke();
    }
    rrect(g, -1.3, -0.075, 0.17, 0.15, 0.03); paint(g, '#3A4350', '#1c2129', LW * 0.8);
    g.restore();
    // 車体
    rrect(g, -1.75, 1.3, 3.5, 0.95, 0.14); paint(g, R, OL, LW * 1.2);
    g.save(); rrect(g, -1.75, 1.3, 3.5, 0.95, 0.14); g.clip();
    g.fillStyle = RD; g.fillRect(-1.8, 1.98, 3.6, 0.4);
    g.fillStyle = '#FFFFFF'; g.fillRect(-1.8, 1.76, 3.6, 0.1);
    g.restore();
    rrect(g, -1.75, 1.3, 3.5, 0.95, 0.14); g.strokeStyle = OL; g.lineWidth = LW * 1.2; g.stroke();
    // 運転席
    g.beginPath(); g.moveTo(0.62, 1.36); g.lineTo(0.62, 1.02); g.quadraticCurveTo(0.62, 0.9, 0.76, 0.9); g.lineTo(1.42, 0.9); g.quadraticCurveTo(1.6, 0.9, 1.68, 1.08); g.lineTo(1.8, 1.36); g.closePath();
    paint(g, R, OL, LW * 1.2);
    g.beginPath(); g.moveTo(0.8, 1.26); g.lineTo(0.8, 1.05); g.quadraticCurveTo(0.8, 0.99, 0.87, 0.99); g.lineTo(1.38, 0.99); g.quadraticCurveTo(1.5, 0.99, 1.55, 1.1); g.lineTo(1.62, 1.26); g.closePath();
    paint(g, '#BFE9FF', '#2F5F80', LW * 0.8);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(0.9, 1.22); g.lineTo(1.08, 1.03); g.lineTo(1.2, 1.03); g.lineTo(1.02, 1.22); g.closePath(); g.fill();
    ellipse(g, 0, 1.33, 0.6, 0.1); g.fillStyle = '#7E1A13'; g.fill();          // すわるところ
    // 赤色灯
    const on = o > 0.2, flash = on ? (Math.sin(t * 22) > 0 ? 1 : 0.3) : 0.5;
    if (on) { const a0 = g.globalAlpha; g.globalAlpha = a0 * 0.4 * flash; circle(g, 1.1, 0.8, 0.36); g.fillStyle = '#FF4A3D'; g.fill(); g.globalAlpha = a0; }
    rrect(g, 0.98, 0.84, 0.24, 0.075, 0.02); paint(g, '#C9CED6', '#59616d', LW * 0.7);
    g.beginPath(); g.arc(1.1, 0.84, 0.095, Math.PI, 0); g.closePath(); paint(g, flash > 0.8 ? '#FFD9D4' : '#FF4A3D', OL, LW * 0.8);
    // とびら・ホース・番号
    g.strokeStyle = 'rgba(94,19,14,.55)'; g.lineWidth = 0.014; rrect(g, -0.55, 1.42, 0.95, 0.26, 0.03); g.stroke();
    circle(g, -1.1, 1.54, 0.18); paint(g, '#D5DAE1', '#59616d', LW * 0.8);
    g.strokeStyle = '#F4C63D'; g.lineWidth = 0.035; for (const r of [0.125, 0.075]) { circle(g, -1.1, 1.54, r); g.stroke(); }
    circle(g, -1.1, 1.54, 0.03); g.fillStyle = '#59616d'; g.fill();
    label(g, '119', 1.2, 1.56, 0.2, '#FFFFFF');
    circle(g, 1.67, 1.94, 0.07); paint(g, '#FFE27A', '#8a6a12', LW * 0.7);
    rrect(g, 1.6, 2.1, 0.3, 0.12, 0.05); paint(g, '#C9CED6', '#59616d', LW * 0.7);
    rrect(g, -1.9, 2.1, 0.24, 0.1, 0.04); paint(g, '#C9CED6', '#59616d', LW * 0.7);
    wheel(g, -1.05, 2.3, 0.33, env.spin); wheel(g, 1.05, 2.3, 0.33, env.spin);
    g.restore();
  },
  onTrigger(f, env) { env.sfx('siren'); env.sfx('water'); env.boost(1.2); },
  // はしごの先から 水が アーチをえがく
  whileOpen(f, env) {
    const k = f.st.k || 0.8, la = f.st.la || 0.7, u = f.U * k;
    const p = f.toCanvas((-1.25 - Math.cos(la) * 1.25) * k, 1.2 + (1.3 - Math.sin(la) * 1.25 - 1.2) * k);
    for (let i = 0; i < 3; i++) env.fx.add({ k: 'drop', x: p.x, y: p.y, vx: (1.9 + rand(-0.25, 0.25)) * u, vy: (-3.6 + rand(-0.3, 0.3)) * u, ay: 3.4 * u, s: rand(0.04, 0.075) * u, max: 2.1 });
  },
};

function spokeWheel(g, x, y, r, rot) {
  circle(g, x, y, r); paint(g, '#C8362E', '#2A2D34', 0.05);
  g.save(); g.translate(x, y); g.rotate(rot);
  g.strokeStyle = '#7d1f19'; g.lineWidth = 0.03;
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); g.lineTo(-Math.cos(a) * r * 0.85, -Math.sin(a) * r * 0.85); g.stroke(); }
  g.restore();
  circle(g, x, y, r * 0.2); paint(g, '#F2B84B', '#8a6a12', 0.02);
}

function loco(g, env) {
  const NAVY = '#33456B', NAVY2 = '#263553', OL = '#141c2e', GOLD = '#F2B84B';
  rrect(g, -1.68, 1.98, 3.42, 0.2, 0.06); paint(g, '#2A2D34', '#111317', LW);
  // うんてんしつ
  rrect(g, -1.62, 1.0, 1.08, 1.02, 0.08); paint(g, '#E0483E', '#6f1c16', LW * 1.2);
  rrect(g, -1.42, 1.18, 0.66, 0.38, 0.06); paint(g, '#FFF3D6', '#6f1c16', LW * 0.8);
  rrect(g, -1.74, 0.9, 1.32, 0.13, 0.06); paint(g, NAVY2, OL, LW);
  g.strokeStyle = GOLD; g.lineWidth = 0.035; g.beginPath(); g.moveTo(-1.6, 1.74); g.lineTo(-0.56, 1.74); g.stroke();
  // のるところ
  rrect(g, -0.56, 1.3, 1.14, 0.72, 0.06); paint(g, NAVY, OL, LW * 1.2);
  ellipse(g, 0, 1.32, 0.52, 0.09); g.fillStyle = '#18233a'; g.fill();
  // ボイラー
  rrect(g, 0.56, 1.3, 1.1, 0.72, 0.2); paint(g, vgrad(g, 1.3, 2.02, [[0, '#4D6494'], [1, NAVY2]]), OL, LW * 1.2);
  g.strokeStyle = GOLD; g.lineWidth = 0.04; for (const x of [0.82, 1.24]) { g.beginPath(); g.moveTo(x, 1.32); g.lineTo(x, 2.0); g.stroke(); }
  ellipse(g, 1.66, 1.66, 0.09, 0.34); paint(g, NAVY, OL, LW);
  circle(g, 1.72, 1.5, 0.075); paint(g, '#FFE27A', '#8a6a12', LW * 0.7);
  g.beginPath(); g.arc(0.9, 1.31, 0.13, Math.PI, 0); g.closePath(); paint(g, GOLD, '#8a6a12', LW * 0.8);
  // えんとつ
  g.beginPath(); g.moveTo(1.2, 1.32); g.lineTo(1.22, 0.86); g.lineTo(1.12, 0.74); g.lineTo(1.48, 0.74); g.lineTo(1.38, 0.86); g.lineTo(1.4, 1.32); g.closePath(); paint(g, NAVY2, OL, LW);
  g.strokeStyle = GOLD; g.lineWidth = 0.04; g.beginPath(); g.moveTo(1.14, 0.77); g.lineTo(1.46, 0.77); g.stroke();
  g.beginPath(); g.moveTo(1.66, 1.92); g.lineTo(2.0, 2.26); g.lineTo(1.6, 2.26); g.closePath(); paint(g, '#8E97A3', '#3f4650', LW * 0.8);
  const ws = [[-1.02, 2.2, 0.36], [0.02, 2.26, 0.3], [0.98, 2.26, 0.3]];
  for (const [x, y, r] of ws) spokeWheel(g, x, y, r, env.spin);
  g.strokeStyle = '#D5DAE1'; g.lineWidth = 0.05; g.lineCap = 'round';
  g.beginPath();
  ws.forEach(([x, y], i) => { const px = x + Math.cos(env.spin) * 0.13, py = y + Math.sin(env.spin) * 0.13; if (i) g.lineTo(px, py); else g.moveTo(px, py); });
  g.stroke();
}

function wagon(g, f, env) {
  const [C, D] = [['#4DA3E0', '#1f5b8a'], ['#58B368', '#2b6b38'], ['#F4A340', '#8a5412']][f.index % 3];
  g.strokeStyle = '#2A2D34'; g.lineWidth = 0.07; g.lineCap = 'round'; g.beginPath(); g.moveTo(1.45, 2.06); g.lineTo(1.95, 2.06); g.stroke();
  rrect(g, -1.5, 1.98, 3.0, 0.2, 0.06); paint(g, '#2A2D34', '#111317', LW);
  rrect(g, -1.42, 1.3, 2.84, 0.72, 0.1); paint(g, C, D, LW * 1.2);
  g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(-1.4, 1.58, 2.8, 0.09);
  ellipse(g, 0, 1.32, 0.6, 0.09); g.fillStyle = D; g.fill();
  g.fillStyle = '#FFE27A'; for (const x of [-1.0, 1.0]) { starPath(g, x, 1.84, 0.1); g.fill(); }
  spokeWheel(g, -0.85, 2.28, 0.28, env.spin); spokeWheel(g, 0.85, 2.28, 0.28, env.spin);
}

// いちばん右の人が 機関車、ほかの人は 客車
const train = {
  id: 'train', cat: 'vehicle', name: 'きかんしゃ', world: 'rail', ride: true, rollFactor: 0.25, scroll: 70, word: 'ポッポー!', wordCol: '#FFE27A',
  thumb: { s: 0.2, y: -0.22 }, ext: { l: 1.75, r: 1.95, t: 1.25, b: 2.55 },
  update(f, env, dt) {
    const st = f.st; st.puff = (st.puff || 0) - dt;
    if (env.thumb || f.index !== f.count - 1 || st.puff > 0) return;
    st.puff = f.openOn ? 0.07 : 0.4;
    const k = st.k || 0.8, p = f.toCanvas(1.3 * k, 1.2 + (0.66 - 1.2) * k);
    env.fx.smoke(p.x, p.y, f.U * k, 1, { vx: -0.9, vy: -0.9, size: f.openOn ? 1.6 : 1 });
  },
  front(g, f, env) {
    const k = rideK(f, 3.9); f.st.k = k;
    rideOpen(g, f, env, k, 10);
    if (f.index === f.count - 1) loco(g, env); else wagon(g, f, env);
    g.restore();
  },
  onTrigger(f, env) { env.sfx('whistle'); env.sfx('chug'); env.boost(1.5); },
};

// まるい まどから 顔を出す
const rocket = {
  id: 'rocket', cat: 'vehicle', name: 'ロケット', world: 'space', ride: true, rollFactor: 0.6, scroll: 40, word: 'はっしゃ!', wordCol: '#8FD3FF',
  thumb: { s: 0.24, y: 0.06 }, ext: { l: 1.5, r: 1.5, t: 2.4, b: 2.55 }, window: { x: 0, y: -0.12, rx: 0.86, ry: 0.86 },
  back(g) {   // まどの おく(人物の うしろ)
    circle(g, 0, -0.12, 0.9); g.fillStyle = '#16204A'; g.fill();
    for (const [x, y, c] of [[-0.62, -0.5, '#FFD84D'], [0.64, -0.42, '#6EE0A8'], [0.56, 0.34, '#FF7A70'], [-0.6, 0.3, '#7BD0FF']]) { circle(g, x, y, 0.03); g.fillStyle = c; g.fill(); }
  },
  front(g, f, env) {
    const o = f.open, t = env.t, OL = '#3A4A66';
    g.save();
    g.translate(Math.sin(t * 40) * 0.006 * o, Math.sin(t * 1.4 + f.id) * 0.03 + Math.sin(t * 47) * 0.008 * o);
    g.lineJoin = 'round';
    const fl = 0.55 + o * 0.9 + Math.sin(t * 30) * 0.06;
    for (const [w, c] of [[0.5, '#FF7A2B'], [0.32, '#FFC83D'], [0.16, '#FFF6C9']]) {
      g.beginPath(); g.moveTo(-w, 1.9); g.quadraticCurveTo(-w * 0.8, 1.9 + fl * 0.6, 0, 1.9 + fl * (w / 0.5 + 0.35)); g.quadraticCurveTo(w * 0.8, 1.9 + fl * 0.6, w, 1.9); g.closePath();
      g.fillStyle = c; g.fill();
    }
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 1.12, 0.95); g.quadraticCurveTo(s * 1.75, 1.3, s * 1.78, 2.0); g.lineTo(s * 1.12, 1.68); g.closePath(); paint(g, '#F0503F', '#8a231a', LW * 1.2); }
    g.beginPath(); g.moveTo(-0.6, 1.74); g.lineTo(0.6, 1.74); g.lineTo(0.72, 1.96); g.lineTo(-0.72, 1.96); g.closePath(); paint(g, '#5A6578', '#2a313d', LW);
    const body = () => { g.moveTo(0, -2.35); g.bezierCurveTo(0.7, -1.9, 1.18, -1.2, 1.18, -0.5); g.lineTo(1.18, 1.45); g.quadraticCurveTo(1.18, 1.78, 0.85, 1.78); g.lineTo(-0.85, 1.78); g.quadraticCurveTo(-1.18, 1.78, -1.18, 1.45); g.lineTo(-1.18, -0.5); g.bezierCurveTo(-1.18, -1.2, -0.7, -1.9, 0, -2.35); g.closePath(); };
    const hole = () => { g.moveTo(0.86, -0.12); g.arc(0, -0.12, 0.86, 0, TAU, true); g.closePath(); };
    g.beginPath(); body(); hole();
    g.fillStyle = hgrad(g, -1.18, 1.18, [[0, '#FFFFFF'], [0.55, '#F1F5FA'], [1, '#C9D4E3']]); g.fill('evenodd');
    g.save(); g.beginPath(); body(); hole(); g.clip('evenodd');
    g.fillStyle = '#F0503F'; g.beginPath(); g.moveTo(-1.3, -2.5); g.lineTo(1.3, -2.5); g.lineTo(1.3, -1.35); g.quadraticCurveTo(0, -1.12, -1.3, -1.35); g.closePath(); g.fill();
    g.fillStyle = '#3D7BE0'; g.fillRect(-1.3, 1.12, 2.6, 0.2);
    g.fillStyle = 'rgba(60,80,110,.35)'; for (const [x, y] of [[-1.05, -0.95], [1.05, -0.95], [-1.05, 0.85], [1.05, 0.85]]) { circle(g, x, y, 0.028); g.fill(); }
    g.restore();
    g.beginPath(); body(); g.strokeStyle = OL; g.lineWidth = LW * 1.2; g.stroke();
    g.beginPath(); g.arc(0, -0.12, 0.93, 0, TAU); g.strokeStyle = '#8FA6BF'; g.lineWidth = 0.14; g.stroke();
    g.strokeStyle = OL; g.lineWidth = LW;
    g.beginPath(); g.arc(0, -0.12, 1.0, 0, TAU); g.stroke();
    g.beginPath(); g.arc(0, -0.12, 0.86, 0, TAU); g.stroke();
    g.fillStyle = '#5E7391'; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.39; circle(g, Math.cos(a) * 0.93, -0.12 + Math.sin(a) * 0.93, 0.025); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 0.05; g.lineCap = 'round';
    g.beginPath(); g.arc(0, -0.12, 0.72, Math.PI * 1.08, Math.PI * 1.42); g.stroke();
    g.beginPath(); g.arc(0, -0.12, 0.72, Math.PI * 1.47, Math.PI * 1.53); g.stroke();
    g.restore();
  },
  onTrigger(f, env) { env.sfx('rocket'); env.shake(12, 0.9); env.boost(3); },
  whileOpen(f, env) {
    const p = f.toCanvas(0, 2.3);
    env.fx.flame(p.x, p.y, f.U, 2);
    if (Math.random() < 0.5) env.fx.smoke(p.x + rand(-0.4, 0.4) * f.U, p.y + 0.3 * f.U, f.U, 1, { vy: 1.2, size: 1.6, col: '#dfe6f2', a: 0.6 });
    if (Math.random() < 0.6) env.fx.streak(rand(0, env.W), -10, f.U * rand(0.3, 0.7), env.H * 1.6);
  },
};

export default [firetruck, train, rocket];
