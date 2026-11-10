// 共通の小道具(数値・色・パス)
export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
// 0→1→0 の山(頂点 p)
export const hill = (t, p = 0.5) => (t < p ? t / p : (1 - t) / (1 - p));

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// 塗り+ふち取りをまとめて行う
export function paint(g, fill, stroke, lw) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}

export function rrect(g, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

export function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
export function ellipse(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); }

// 点列をなめらかな閉じた曲線としてパスに足す(beginPath はしない)
export function smoothClosed(g, pts) {
  const n = pts.length;
  const p0 = pts[n - 1], p1 = pts[0];
  g.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    g.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  g.closePath();
}

// もこもこした円(たてがみ・雲)
export function scallop(g, cx, cy, r, bumps, depth = 0.16, phase = 0) {
  g.beginPath();
  for (let i = 0; i < bumps; i++) {
    const a0 = phase + (i / bumps) * TAU, a1 = phase + ((i + 1) / bumps) * TAU, am = (a0 + a1) / 2;
    const x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
    const k = r * (1 + depth * 2);
    if (i === 0) g.moveTo(x0, y0);
    g.quadraticCurveTo(cx + Math.cos(am) * k, cy + Math.sin(am) * k, x1, y1);
  }
  g.closePath();
}

export function starPath(g, cx, cy, r, n = 5, inner = 0.46, rot = -Math.PI / 2) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * TAU, rr = i % 2 ? r * inner : r;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}

export function heartPath(g, cx, cy, s) {
  g.beginPath();
  g.moveTo(cx, cy + s * 0.9);
  g.bezierCurveTo(cx - s * 1.3, cy + s * 0.05, cx - s * 0.75, cy - s * 0.95, cx, cy - s * 0.3);
  g.bezierCurveTo(cx + s * 0.75, cy - s * 0.95, cx + s * 1.3, cy + s * 0.05, cx, cy + s * 0.9);
  g.closePath();
}

// #rrggbb を明るく(amt>0)/暗く(amt<0)
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(clamp(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt), 0, 255));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export function vgrad(g, y0, y1, stops) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}
export function hgrad(g, x0, x1, stops) {
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}

export const FONT = '"Zen Maru Gothic","Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP",system-ui,sans-serif';
