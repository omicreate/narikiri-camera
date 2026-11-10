// まねっこの おてほん役「カメレオンのレオン」。ポーズごとに体の色が変わる
import { TAU, circle, ellipse, paint, shade, lerp, clamp, heartPath } from './util.js';

const POSE = {
  idle: { hue: '#7ED957', mouth: 'smile' },
  open: { hue: '#FFB347', mouth: 'open' },
  smile: { hue: '#FFD84D', mouth: 'grin' },
  brow: { hue: '#7FD3FF', mouth: 'o', brow: 1 },
  eyes: { hue: '#B79CFF', mouth: 'flat', shut: 1 },
  kiss: { hue: '#FF9EC4', mouth: 'kiss' },
  tilt: { hue: '#7BE08A', mouth: 'smile', tilt: 1 },
  turn: { hue: '#5CC8FF', mouth: 'smile', turn: 1 },
  peek: { hue: '#FFA07A', mouth: 'smile', hands: 1 },
};

// g: 描く先, size: 一辺の画素, poseId: ポーズ名, t: 秒
export function drawLeon(g, size, poseId, t) {
  const p = POSE[poseId] || POSE.idle;
  const k = poseId === 'idle' ? 0 : 0.5 - 0.5 * Math.cos(t * 3.2);   // 0→1→0 を くりかえして 動きで見せる
  const R = size * 0.33, OL = shade(p.hue, -0.5), LW = 0.06;
  g.save();
  g.clearRect(0, 0, size, size);
  g.translate(size / 2, size * 0.56);
  g.scale(R, R);
  g.lineJoin = 'round'; g.lineCap = 'round';
  if (p.tilt) g.rotate(Math.sin(t * 3.2) * 0.42);
  let dir = 0;
  if (p.turn) { dir = Math.sin(t * 1.6) > 0 ? 1 : -1; g.translate(dir * 0.22 * k, 0); g.scale(1 - 0.24 * k, 1); }
  // しっぽ(うずまき)
  g.strokeStyle = OL; g.lineWidth = 0.26;
  g.beginPath(); for (let i = 0; i <= 40; i++) { const a = (i / 40) * TAU * 1.4, r = 0.34 - (i / 40) * 0.26, x = 1.05 + Math.cos(a) * r, y = 0.72 + Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
  g.strokeStyle = p.hue; g.lineWidth = 0.15; g.stroke();
  // あたま
  g.beginPath(); g.moveTo(0, -1.28);
  g.bezierCurveTo(0.5, -1.18, 1.06, -0.6, 1.06, 0); g.bezierCurveTo(1.06, 0.6, 0.55, 0.94, 0, 0.94);
  g.bezierCurveTo(-0.55, 0.94, -1.06, 0.6, -1.06, 0); g.bezierCurveTo(-1.06, -0.6, -0.5, -1.18, 0, -1.28); g.closePath();
  paint(g, p.hue, OL, LW);
  g.strokeStyle = shade(p.hue, 0.45); g.lineWidth = 0.07;
  g.beginPath(); g.moveTo(-0.2, -0.98); g.quadraticCurveTo(0, -1.1, 0.2, -0.98); g.stroke();
  g.beginPath(); g.moveTo(-0.3, -0.8); g.quadraticCurveTo(0, -0.94, 0.3, -0.8); g.stroke();
  // 目
  const wide = p.brow ? k : 0, shut = p.shut ? k : 0;
  for (const s of [-1, 1]) {
    circle(g, s * 0.6, -0.18, 0.36); paint(g, shade(p.hue, -0.14), OL, LW);
    if (shut > 0.55) {
      g.strokeStyle = OL; g.lineWidth = 0.08;
      g.beginPath(); g.moveTo(s * 0.6 - 0.2, -0.16); g.quadraticCurveTo(s * 0.6, -0.02, s * 0.6 + 0.2, -0.16); g.stroke();
    } else {
      const er = 0.2 + wide * 0.07;
      ellipse(g, s * 0.6, -0.18, er, er * (1 - shut * 0.8)); g.fillStyle = '#ffffff'; g.fill();
      circle(g, s * 0.6 + dir * 0.08 * k - s * 0.03, -0.16, 0.1 - wide * 0.03); g.fillStyle = '#1d1a22'; g.fill();
      circle(g, s * 0.6 + dir * 0.08 * k - s * 0.03 - 0.035, -0.2, 0.034); g.fillStyle = '#ffffff'; g.fill();
    }
    if (p.brow) { g.strokeStyle = OL; g.lineWidth = 0.08; g.beginPath(); g.moveTo(s * 0.4, -0.66 - wide * 0.14); g.quadraticCurveTo(s * 0.62, -0.8 - wide * 0.16, s * 0.84, -0.64 - wide * 0.14); g.stroke(); }
    ellipse(g, s * 0.74, 0.36, 0.13, 0.08); g.fillStyle = 'rgba(255,120,140,.5)'; g.fill();
  }
  // 口
  g.strokeStyle = OL; g.lineWidth = 0.08;
  if (p.mouth === 'open') {
    ellipse(g, 0, 0.5, 0.34, 0.07 + 0.27 * k); paint(g, '#8E1B2E', OL, LW);
    if (k > 0.3) { ellipse(g, 0, 0.5 + 0.2 * k, 0.2, 0.09 * k); g.fillStyle = '#FF8FA3'; g.fill(); }
  } else if (p.mouth === 'grin') {
    g.beginPath(); g.moveTo(-0.46, 0.36); g.quadraticCurveTo(0, 0.4 + 0.5 * k, 0.46, 0.36); g.quadraticCurveTo(0, 0.44 + 0.12 * k, -0.46, 0.36); g.closePath();
    paint(g, '#ffffff', OL, LW);
  } else if (p.mouth === 'o') {
    circle(g, 0, 0.52, 0.08 + 0.07 * k); paint(g, '#8E1B2E', OL, LW);
  } else if (p.mouth === 'kiss') {
    circle(g, 0, 0.5, 0.07 + 0.04 * k); paint(g, '#FF5F8A', OL, LW);
    g.save(); g.globalAlpha = clamp(k * 1.4); heartPath(g, 0.5 + k * 0.25, 0.3 - k * 0.5, 0.12); g.fillStyle = '#FF5F8A'; g.fill(); g.restore();
  } else if (p.mouth === 'flat') {
    g.beginPath(); g.moveTo(-0.22, 0.5); g.quadraticCurveTo(0, 0.56, 0.22, 0.5); g.stroke();
  } else {
    g.beginPath(); g.moveTo(-0.4, 0.4); g.quadraticCurveTo(0, 0.7, 0.4, 0.4); g.stroke();
  }
  // て(いないいないばあ)
  if (p.hands) {
    const c = (t * 0.75) % 1, cover = c < 0.62 ? clamp(c / 0.12) : 1 - clamp((c - 0.62) / 0.1);
    for (const s of [-1, 1]) {
      const x = s * lerp(1.45, 0.52, cover);
      ellipse(g, x, -0.14, 0.42, 0.5, s * 0.2); paint(g, shade(p.hue, 0.12), OL, LW);
      g.strokeStyle = OL; g.lineWidth = 0.05;
      for (const d of [-0.14, 0.02, 0.18]) { g.beginPath(); g.moveTo(x + d * 1.0, -0.56); g.lineTo(x + d * 1.0, -0.32); g.stroke(); }
    }
  }
  g.restore();
}
