// 1人ぶんの なりきりを重ねる順番(うしろ → 服 → フード → 手前)と、一覧用の小さな絵
import { TAU, smoothClosed, makeCanvas } from './util.js';
import { drawBust } from './art.js';

export const SHRINK = 0.965;   // 顔の穴を少し小さくして、フードとの すきまを隠す

export function applyFace(g, f) {
  g.translate(f.cx, f.cy); g.rotate(f.ang);
  const k = f.U * f.pop; g.scale(k, k);
}

// ほかの人の顔を 隠さないようにする。まどのある なりきり(ロケットなど)は まどの中ごと 守る
function clipOthers(g, f, others, W, H, item) {
  if (!others || others.length < 2) return;
  const win = item && item.window;
  g.beginPath(); g.rect(0, 0, W, H);
  for (const o of others) {
    if (o === f) continue;
    if (win) {
      const c = o.toCanvas(win.x, win.y), k = o.U * o.pop;
      g.moveTo(c.x + Math.cos(o.ang) * win.rx * k, c.y + Math.sin(o.ang) * win.rx * k);
      g.ellipse(c.x, c.y, win.rx * k, win.ry * k, o.ang, 0, TAU);
      g.closePath();
    } else smoothClosed(g, o.hole);
  }
  g.clip('evenodd');
}

export function rim(g, f, col, lw) {
  g.beginPath(); smoothClosed(g, f.holeL);
  g.strokeStyle = col; g.lineWidth = lw; g.stroke();
}

export function drawBackLayer(g, item, f, env) {
  if (!item.back) return;
  g.save(); g.globalAlpha = f.alpha; applyFace(g, f); item.back(g, f, env); g.restore();
}

export function drawWearLayer(g, item, f, env, W, H, others) {
  if (!item.wear) return;
  g.save(); g.globalAlpha = f.alpha; clipOthers(g, f, others, W, H, null); applyFace(g, f); item.wear(g, f, env); g.restore();
}

export function drawFrontLayer(g, item, f, env, W, H, others) {
  g.save();
  g.globalAlpha = f.alpha;
  clipOthers(g, f, others, W, H, item);
  if (item.hood) {
    g.save();
    g.beginPath(); g.rect(0, 0, W, H); smoothClosed(g, f.hole); g.clip('evenodd');
    applyFace(g, f); item.hood(g, f, env);
    g.restore();
  }
  if (item.front) { g.save(); applyFace(g, f); item.front(g, f, env); g.restore(); }
  g.restore();
}

// 一覧用: 見本の顔に着せた絵を作る
const NOFX = new Proxy({}, { get: () => () => ({}) });

function fakeFace(cx, cy, U, px) {
  const oval = [];
  for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU; oval.push({ x: cx + Math.cos(a) * 0.5 * U, y: cy + (0.02 + Math.sin(a) * 0.66) * U }); }
  const hole = oval.map((p) => ({ x: cx + (p.x - cx) * SHRINK, y: cy + (p.y - cy) * SHRINK }));
  return {
    id: 0, cx, cy, U, ang: 0, roll: 0, pop: 1, alpha: 1, open: 0, openOn: false, smile: 0.3, brow: 0, yaw: 0, pitch: 0, vx: 0, vy: 0,
    side: 1, index: 0, count: 1, fitW: px / U, st: {}, oval, hole,
    holeL: hole.map((p) => ({ x: (p.x - cx) / U, y: (p.y - cy) / U })),
    L: { nose: { x: 0, y: 0.1 }, noseBase: { x: 0, y: 0.17 }, mouth: { x: 0, y: 0.34 }, mouthTop: { x: 0, y: 0.27 }, chin: { x: 0, y: 0.66 }, forehead: { x: 0, y: -0.66 }, eyeL: { x: -0.19, y: -0.1 }, eyeR: { x: 0.19, y: -0.1 }, cheekL: { x: -0.3, y: 0.16 }, cheekR: { x: 0.3, y: 0.16 } },
    toCanvas: (x, y) => ({ x: cx + x * U, y: cy + y * U }),
  };
}

export function renderThumb(item, px, worldFn, open = 0) {
  const c = makeCanvas(px, px), g = c.getContext('2d');
  if (worldFn) worldFn(g, px, px, 1.5, 0);
  const U = item.thumb.s * px, f = fakeFace(px / 2, px * (0.5 + item.thumb.y), U, px);
  f.open = open; f.openOn = open > 0.5;
  const env = { t: 1.5, dt: 0.016, W: px, H: px, spin: 0.6, thumb: true, fx: NOFX, sfx() {}, shake() {}, boost() {}, rim };
  if (item.update) item.update(f, env, 0.016);
  drawBackLayer(g, item, f, env);
  g.save(); applyFace(g, f); drawBust(g); g.restore();
  drawWearLayer(g, item, f, env, px, px, null);
  drawFrontLayer(g, item, f, env, px, px, null);
  return c;
}
