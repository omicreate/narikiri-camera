// なりきりの絵で共通に使う部品。座標は「顔の幅 = 1」の顔基準の単位。
import { TAU, paint, circle, ellipse, rrect, clamp, FONT } from './util.js';

export const LW = 0.024;   // ふち取りの太さ

// 目玉。o.look=[x,y](-1〜1), o.blink=0〜1
export function eye(g, x, y, r, o = {}) {
  const b = o.blink || 0;
  ellipse(g, x, y, r, Math.max(r * (1 - b * 0.9), r * 0.08));
  paint(g, '#ffffff', o.rim || '#243b2b', LW);
  if (b < 0.6) {
    const lx = (o.look ? o.look[0] : 0) * r * 0.36, ly = (o.look ? o.look[1] : 0) * r * 0.36;
    const pr = r * (o.pupil || 0.52);
    circle(g, x + lx, y + ly, pr); g.fillStyle = '#1d1a22'; g.fill();
    circle(g, x + lx - pr * 0.3, y + ly - pr * 0.35, pr * 0.34); g.fillStyle = '#ffffff'; g.fill();
  }
}

// まばたき(ときどき 1 になる)
export const blinkNow = (t, seed = 0) => (((t + seed * 1.7) % 4.3) < 0.14 ? 1 : 0);

export function wheel(g, x, y, r, rot, o = {}) {
  circle(g, x, y, r); paint(g, o.tire || '#2A2D34', '#14161a', LW);
  circle(g, x, y, r * 0.62); paint(g, o.hub || '#C9CED6', '#6f7782', LW * 0.7);
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = o.bolt || '#7c8591';
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; circle(g, Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, r * 0.075); g.fill(); }
  circle(g, 0, 0, r * 0.14); g.fill();
  g.restore();
}

// だ円のふちに沿って、内がわを向いた歯を並べる(角度は度、270 が上)
export function teethRing(g, cx, cy, rx, ry, deg0, deg1, n, b, h) {
  for (let i = 0; i < n; i++) {
    const a = ((deg0 + ((deg1 - deg0) * (i + 0.5)) / n) * Math.PI) / 180;
    const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry;
    let nx = -Math.cos(a) / rx, ny = -Math.sin(a) / ry;
    const l = Math.hypot(nx, ny); nx /= l; ny /= l;
    const tx = -ny, ty = nx;
    g.beginPath();
    g.moveTo(px + tx * b - nx * 0.03, py + ty * b - ny * 0.03);
    g.quadraticCurveTo(px + nx * h * 0.85 + tx * b * 0.35, py + ny * h * 0.85 + ty * b * 0.35, px + nx * h, py + ny * h);
    g.quadraticCurveTo(px + nx * h * 0.85 - tx * b * 0.35, py + ny * h * 0.85 - ty * b * 0.35, px - tx * b - nx * 0.03, py - ty * b - ny * 0.03);
    g.closePath();
    paint(g, '#FFFDF4', '#CFC6B4', 0.012);
  }
}

// 動物の鼻(顔の鼻の位置に置く)
export function snout(g, x, y, w, col, hl = true) {
  g.beginPath();
  g.moveTo(x - w * 0.5, y - w * 0.18);
  g.quadraticCurveTo(x, y - w * 0.46, x + w * 0.5, y - w * 0.18);
  g.quadraticCurveTo(x + w * 0.3, y + w * 0.34, x, y + w * 0.36);
  g.quadraticCurveTo(x - w * 0.3, y + w * 0.34, x - w * 0.5, y - w * 0.18);
  g.closePath();
  g.fillStyle = col; g.fill();
  if (hl) { ellipse(g, x - w * 0.14, y - w * 0.16, w * 0.13, w * 0.06, -0.3); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(); }
}

export function whiskers(g, x, y, col, len = 0.42, under = null) {
  g.lineCap = 'round';
  const draw = (lw, c) => {
    g.strokeStyle = c; g.lineWidth = lw;
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const dy = (i - 1) * 0.085;
      g.beginPath(); g.moveTo(x + s * 0.17, y + 0.08 + dy * 0.35);
      g.quadraticCurveTo(x + s * (0.17 + len * 0.5), y + 0.04 + dy, x + s * (0.17 + len), y + 0.06 + dy * 1.7);
      g.stroke();
    }
  };
  if (under) draw(0.03, under);
  draw(0.014, col);
}

export function blush(g, f, col = '#FF9FB5', r = 0.1, a = 0.42) {
  const a0 = g.globalAlpha;
  g.globalAlpha = a0 * a; g.fillStyle = col;
  ellipse(g, f.L.cheekL.x, f.L.cheekL.y, r, r * 0.7); g.fill();
  ellipse(g, f.L.cheekR.x, f.L.cheekR.y, r, r * 0.7); g.fill();
  g.globalAlpha = a0;
}

// 体にまとう服の外形(肩〜おなか)。えり元は V 字にあける。
// o.wide: 人物の切り抜きで 体の形に切りそろえる場合。肩より外まで広く塗っておく
export function torsoPath(g, o = {}) {
  const w = o.w || 1.34, top = (o.top || 0.88) - (o.wide ? 0.08 : 0), v = o.v === undefined ? top + 0.42 : o.v, nk = o.neck || 0.28;
  g.beginPath();
  g.moveTo(-nk, top);
  if (o.wide) {
    g.lineTo(-w - 0.4, top - 0.1); g.lineTo(-w - 0.4, 3.6); g.lineTo(w + 0.4, 3.6); g.lineTo(w + 0.4, top - 0.1);
  } else {
    g.quadraticCurveTo(-nk - 0.3, top + 0.12, -w + 0.2, top + 0.34);
    g.quadraticCurveTo(-w - 0.06, top + 0.46, -w - 0.08, top + 0.9);
    g.lineTo(-w - 0.14, 3.6); g.lineTo(w + 0.14, 3.6); g.lineTo(w + 0.08, top + 0.9);
    g.quadraticCurveTo(w + 0.06, top + 0.46, w - 0.2, top + 0.34);
    g.quadraticCurveTo(nk + 0.3, top + 0.12, nk, top);
  }
  g.lineTo(nk, top);
  g.lineTo(0, v); g.closePath();
}

export function label(g, text, x, y, size, col, weight = 900) {
  g.save();
  g.translate(x, y); g.scale(size / 100, size / 100);
  g.font = `${weight} 100px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, 0, 0);
  g.restore();
}

// ---- 飛んでくる小物(大きさ 1 を基準に描く) ----
export const SPRITES = {
  carrot(g) {
    g.fillStyle = '#5DBB63';
    for (const a of [-0.5, 0, 0.5]) { g.beginPath(); g.ellipse(Math.sin(a) * 0.35, -0.75 - Math.cos(a) * 0.2, 0.14, 0.38, a, 0, TAU); g.fill(); }
    g.beginPath(); g.moveTo(-0.38, -0.5); g.quadraticCurveTo(0, -0.72, 0.38, -0.5); g.quadraticCurveTo(0.2, 0.5, 0, 1); g.quadraticCurveTo(-0.2, 0.5, -0.38, -0.5); g.closePath();
    g.fillStyle = '#FF8A2B'; g.fill(); g.strokeStyle = '#B85A12'; g.lineWidth = 0.08; g.stroke();
  },
  bamboo(g) {
    g.fillStyle = '#6DB65B'; rrect(g, -0.16, -1, 0.32, 2, 0.14); g.fill();
    g.strokeStyle = '#3F8C3A'; g.lineWidth = 0.08; g.stroke();
    g.beginPath(); g.moveTo(-0.16, -0.25); g.lineTo(0.16, -0.25); g.moveTo(-0.16, 0.4); g.lineTo(0.16, 0.4); g.stroke();
    g.fillStyle = '#4FA24A';
    g.beginPath(); g.moveTo(0.14, -0.3); g.quadraticCurveTo(0.7, -0.8, 1.05, -0.5); g.quadraticCurveTo(0.6, -0.3, 0.14, -0.3); g.fill();
  },
  onigiri(g) {
    g.beginPath(); g.moveTo(0, -0.95); g.quadraticCurveTo(0.35, -0.9, 0.95, 0.5); g.quadraticCurveTo(1.0, 0.85, 0.6, 0.85); g.lineTo(-0.6, 0.85); g.quadraticCurveTo(-1.0, 0.85, -0.95, 0.5); g.quadraticCurveTo(-0.35, -0.9, 0, -0.95); g.closePath();
    g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = '#B9B2A4'; g.lineWidth = 0.08; g.stroke();
    g.fillStyle = '#26332B'; rrect(g, -0.42, 0.18, 0.84, 0.67, 0.08); g.fill();
  },
  strawberry(g) {
    g.beginPath(); g.moveTo(0, 0.95); g.bezierCurveTo(-1.1, 0.2, -0.95, -0.75, 0, -0.6); g.bezierCurveTo(0.95, -0.75, 1.1, 0.2, 0, 0.95); g.closePath();
    g.fillStyle = '#F2445C'; g.fill(); g.strokeStyle = '#A71E33'; g.lineWidth = 0.08; g.stroke();
    g.fillStyle = '#FFE08A';
    for (const [x, y] of [[-0.35, -0.1], [0.3, -0.15], [0, 0.3], [-0.15, -0.35], [0.4, 0.2], [-0.4, 0.3]]) { g.beginPath(); g.ellipse(x, y, 0.05, 0.08, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#4FA24A';
    for (const a of [-0.9, -0.3, 0.3, 0.9]) { g.beginPath(); g.ellipse(Math.sin(a) * 0.36, -0.68, 0.14, 0.3, a + Math.PI / 2 * 0, 0, TAU); g.fill(); }
  },
  donut(g) {
    g.beginPath(); g.arc(0, 0, 0.9, 0, TAU); g.arc(0, 0, 0.3, 0, TAU, true);
    g.fillStyle = '#E2A45C'; g.fill('evenodd'); g.strokeStyle = '#9C6427'; g.lineWidth = 0.08; g.stroke();
    g.beginPath(); g.arc(0, 0, 0.76, 0, TAU); g.arc(0, 0, 0.4, 0, TAU, true);
    g.fillStyle = '#FF9EC4'; g.fill('evenodd');
    const cs = ['#ffffff', '#7BD0FF', '#FFE066', '#8FE08A'];
    for (let i = 0; i < 8; i++) { const a = i * 0.8 + 0.3; g.save(); g.translate(Math.cos(a) * 0.58, Math.sin(a) * 0.58); g.rotate(a * 2.3); g.fillStyle = cs[i % 4]; g.fillRect(-0.09, -0.03, 0.18, 0.06); g.restore(); }
  },
  pudding(g) {
    g.beginPath(); g.moveTo(-0.5, -0.6); g.lineTo(0.5, -0.6); g.quadraticCurveTo(0.8, 0.4, 0.85, 0.75); g.lineTo(-0.85, 0.75); g.quadraticCurveTo(-0.8, 0.4, -0.5, -0.6); g.closePath();
    g.fillStyle = '#FFD25A'; g.fill(); g.strokeStyle = '#B98519'; g.lineWidth = 0.08; g.stroke();
    g.beginPath(); g.moveTo(-0.52, -0.6); g.lineTo(0.52, -0.6); g.quadraticCurveTo(0.6, -0.25, 0.3, -0.3); g.quadraticCurveTo(0, -0.1, -0.3, -0.3); g.quadraticCurveTo(-0.6, -0.2, -0.52, -0.6); g.closePath();
    g.fillStyle = '#8A4B1C'; g.fill();
    g.fillStyle = '#F2445C'; g.beginPath(); g.arc(0, -0.8, 0.2, 0, TAU); g.fill();
  },
};

// サムネイル用の「だれか」(顔と肩)。なりきりを着せて一覧に出す
export function drawBust(g) {
  g.fillStyle = '#7FB2E5';
  g.beginPath(); g.moveTo(-1.15, 3.2); g.quadraticCurveTo(-1.2, 1.4, -0.45, 1.1); g.lineTo(0.45, 1.1); g.quadraticCurveTo(1.2, 1.4, 1.15, 3.2); g.closePath(); g.fill();
  g.fillStyle = '#F2C9A5'; rrect(g, -0.2, 0.55, 0.4, 0.7, 0.12); g.fill();
  ellipse(g, 0, -0.08, 0.6, 0.86); g.fillStyle = '#4A3526'; g.fill();           // かみ
  ellipse(g, 0, 0.02, 0.5, 0.66); g.fillStyle = '#FBD7B5'; g.fill();              // かお
  g.fillStyle = '#4A3526';
  g.beginPath(); g.moveTo(-0.52, -0.2); g.quadraticCurveTo(-0.3, -0.72, 0.1, -0.5); g.quadraticCurveTo(0.4, -0.62, 0.52, -0.2); g.quadraticCurveTo(0.5, -0.8, 0, -0.84); g.quadraticCurveTo(-0.5, -0.8, -0.52, -0.2); g.fill();
  g.fillStyle = '#2B2320'; circle(g, -0.19, -0.1, 0.05); g.fill(); circle(g, 0.19, -0.1, 0.05); g.fill();
  g.strokeStyle = '#B5543E'; g.lineWidth = 0.035; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-0.14, 0.3); g.quadraticCurveTo(0, 0.42, 0.14, 0.3); g.stroke();
  g.fillStyle = 'rgba(255,140,150,.45)'; ellipse(g, -0.3, 0.16, 0.09, 0.06); g.fill(); ellipse(g, 0.3, 0.16, 0.09, 0.06); g.fill();
}

export { clamp };
