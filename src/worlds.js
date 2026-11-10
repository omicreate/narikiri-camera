// 背景の世界。draw(g, W, H, t, sc) … t は秒、sc は横(宇宙は縦)に流れた量(画素)。
import { TAU, vgrad, rrect, clamp } from './util.js';

function sky(g, W, H, stops) { g.fillStyle = vgrad(g, 0, H, stops); g.fillRect(0, 0, W, H); }

function band(g, W, H, baseY, amp, wave, phase, color) {
  g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W + 10; x += 10) {
    g.lineTo(x, baseY + Math.sin((x + phase) / wave) * amp + Math.sin((x + phase) / (wave * 0.37) + 1.3) * amp * 0.35);
  }
  g.lineTo(W, H); g.closePath(); g.fillStyle = color; g.fill();
}

function cloud(g, x, y, s, col = '#ffffff', a = 0.95) {
  g.globalAlpha = a; g.fillStyle = col;
  g.beginPath();
  g.arc(x, y, s, 0, TAU); g.arc(x + s * 1.1, y + s * 0.15, s * 0.8, 0, TAU); g.arc(x - s * 1.05, y + s * 0.2, s * 0.7, 0, TAU);
  g.arc(x + s * 0.3, y - s * 0.55, s * 0.75, 0, TAU);
  g.fill(); g.globalAlpha = 1;
}

// 同じ絵を period ごとに並べて横に流す
function tile(W, period, offset, fn) {
  const start = -(((offset % period) + period) % period);
  let i = Math.floor(offset / period);
  for (let x = start; x < W + period; x += period, i++) fn(x, i);
}

function seeded(n) { let s = n * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const STARS = (() => { const r = seeded(7); return Array.from({ length: 130 }, () => ({ x: r(), y: r(), s: 0.4 + r() * 1.4, p: r() * TAU, d: 0.3 + r() * 0.7 })); })();

function palm(g, x, y, s, lean) {
  g.strokeStyle = '#8A5A33'; g.lineWidth = s * 0.16; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * s * 0.4, y - s * 0.9, x + lean * s * 0.7, y - s * 1.7); g.stroke();
  const tx = x + lean * s * 0.7, ty = y - s * 1.7;
  g.fillStyle = '#2F8C55';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.55;
    g.beginPath(); g.moveTo(tx, ty);
    g.quadraticCurveTo(tx + Math.cos(a - 0.35) * s * 0.7, ty + Math.sin(a - 0.35) * s * 0.7, tx + Math.cos(a) * s * 1.05, ty + Math.sin(a) * s * 1.05 + s * 0.3);
    g.quadraticCurveTo(tx + Math.cos(a + 0.3) * s * 0.55, ty + Math.sin(a + 0.3) * s * 0.55, tx, ty);
    g.fill();
  }
}

function longNeck(g, x, y, s, t, col, dark) {   // 遠くにいる首長竜
  const bob = Math.sin(t * 0.9) * s * 0.05;
  g.fillStyle = col;
  g.beginPath(); g.ellipse(x, y, s * 0.95, s * 0.5, 0, 0, TAU); g.fill();
  g.fillRect(x - s * 0.6, y, s * 0.22, s * 0.75); g.fillRect(x + s * 0.3, y, s * 0.22, s * 0.75);
  g.beginPath(); g.moveTo(x - s * 0.8, y - s * 0.1); g.quadraticCurveTo(x - s * 1.6, y + s * 0.1, x - s * 1.9, y + s * 0.55); g.quadraticCurveTo(x - s * 1.4, y + s * 0.35, x - s * 0.75, y + s * 0.3); g.fill();
  g.strokeStyle = col; g.lineWidth = s * 0.3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x + s * 0.65, y - s * 0.2); g.quadraticCurveTo(x + s * 1.0, y - s * 1.0, x + s * 1.2, y - s * 1.7 + bob); g.stroke();
  g.beginPath(); g.ellipse(x + s * 1.38, y - s * 1.78 + bob, s * 0.3, s * 0.19, -0.15, 0, TAU); g.fill();
  g.fillStyle = dark; g.beginPath(); g.arc(x + s * 1.42, y - s * 1.84 + bob, s * 0.04, 0, TAU); g.fill();
}

function acacia(g, x, y, s) {
  g.strokeStyle = '#6B4226'; g.lineWidth = s * 0.12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - s * 0.9); g.moveTo(x, y - s * 0.6); g.lineTo(x - s * 0.5, y - s * 1.0); g.moveTo(x, y - s * 0.7); g.lineTo(x + s * 0.5, y - s * 1.05); g.stroke();
  g.fillStyle = '#7B8F3A';
  g.beginPath(); g.ellipse(x, y - s * 1.12, s * 1.05, s * 0.3, 0, 0, TAU); g.fill();
  g.fillStyle = '#8FA548';
  g.beginPath(); g.ellipse(x - s * 0.2, y - s * 1.2, s * 0.6, s * 0.18, 0, 0, TAU); g.fill();
}

function giraffe(g, x, H, s, t) {   // 画面の横からのぞくキリン
  const hy = H * 0.26 + Math.sin(t * 1.1) * s * 0.06, chew = Math.sin(t * 7) * s * 0.02;
  g.fillStyle = '#F2BE4A';
  g.beginPath(); g.moveTo(x - s * 0.36, H); g.quadraticCurveTo(x - s * 0.3, hy + s * 1.6, x - s * 0.22, hy + s * 0.4); g.lineTo(x + s * 0.3, hy + s * 0.3); g.quadraticCurveTo(x + s * 0.42, hy + s * 1.6, x + s * 0.5, H); g.closePath(); g.fill();
  g.fillStyle = '#B5742A';
  for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(x + (i % 2 ? 0.16 : -0.1) * s, hy + s * (0.85 + i * 0.62), s * 0.15, s * 0.19, i, 0, TAU); g.fill(); }
  g.fillStyle = '#F2BE4A';
  g.beginPath(); g.ellipse(x - s * 0.12, hy, s * 0.62, s * 0.4, -0.25, 0, TAU); g.fill();        // 頭
  g.fillStyle = '#F7D98A'; g.beginPath(); g.ellipse(x - s * 0.5, hy + s * 0.14 + chew, s * 0.3, s * 0.22, -0.2, 0, TAU); g.fill(); // 口元
  g.strokeStyle = '#B5742A'; g.lineWidth = s * 0.08; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - s * 0.05, hy - s * 0.34); g.lineTo(x - s * 0.08, hy - s * 0.62); g.moveTo(x + s * 0.22, hy - s * 0.3); g.lineTo(x + s * 0.26, hy - s * 0.58); g.stroke();
  g.fillStyle = '#7A4A1E'; g.beginPath(); g.arc(x - s * 0.08, hy - s * 0.65, s * 0.07, 0, TAU); g.arc(x + s * 0.26, hy - s * 0.61, s * 0.07, 0, TAU); g.fill();
  g.fillStyle = '#F2BE4A'; g.beginPath(); g.ellipse(x + s * 0.5, hy - s * 0.2, s * 0.22, s * 0.1, 0.5, 0, TAU); g.fill(); // 耳
  g.fillStyle = '#2B1D12'; g.beginPath(); g.arc(x - s * 0.2, hy - s * 0.06, s * 0.06, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x - s * 0.22, hy - s * 0.08, s * 0.02, 0, TAU); g.fill();
  g.fillStyle = '#7A4A1E'; g.beginPath(); g.arc(x - s * 0.66, hy + s * 0.08 + chew, s * 0.025, 0, TAU); g.fill();
}

function building(g, x, base, w, h, col, i) {
  g.fillStyle = col; rrect(g, x, base - h, w, h + 4, w * 0.06); g.fill();
  g.fillStyle = 'rgba(255,255,255,.75)';
  const cols = 3, rows = Math.max(2, Math.floor(h / (w * 0.42)));
  const ww = w * 0.16, gap = (w - cols * ww) / (cols + 1);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if ((r * 3 + c + i) % 5 === 0) continue;
    g.fillRect(x + gap + c * (ww + gap), base - h + w * 0.16 + r * w * 0.36, ww, ww * 1.15);
  }
}

export const WORLDS = {
  // 恐竜の森
  jungle(g, W, H, t, sc) {
    const u = Math.min(W, H) / 100;
    sky(g, W, H, [[0, '#86D6D8'], [0.5, '#CDEFC6'], [1, '#FBE9A6']]);
    g.fillStyle = 'rgba(255,250,210,.55)'; g.beginPath(); g.arc(W * 0.2, H * 0.2, u * 22, 0, TAU); g.fill();
    // 火山
    const vx = W * 0.8 - sc * 0.05, vy = H * 0.64;
    for (let i = 0; i < 5; i++) {
      const p = (t * 0.1 + i / 5) % 1;
      g.globalAlpha = 0.5 * (1 - p); g.fillStyle = '#e9e4f0';
      g.beginPath(); g.arc(vx + Math.sin(p * 5 + i) * u * 3 + p * u * 10, vy - u * 36 - p * u * 26, u * (4 + p * 8), 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    g.fillStyle = '#8D8FB0';
    g.beginPath(); g.moveTo(vx - u * 34, vy + u * 6); g.quadraticCurveTo(vx - u * 12, vy - u * 16, vx - u * 6, vy - u * 34); g.lineTo(vx + u * 6, vy - u * 34); g.quadraticCurveTo(vx + u * 12, vy - u * 16, vx + u * 34, vy + u * 6); g.closePath(); g.fill();
    g.fillStyle = '#FF8A3D'; g.beginPath(); g.ellipse(vx, vy - u * 34, u * 6.2, u * 1.6, 0, 0, TAU); g.fill();
    g.fillStyle = '#FF6A2B';
    g.beginPath(); g.moveTo(vx - u * 4, vy - u * 33.5); g.quadraticCurveTo(vx - u * 5, vy - u * 24, vx - u * 8, vy - u * 17); g.quadraticCurveTo(vx - u * 4, vy - u * 22, vx - u * 1, vy - u * 33.5); g.fill();
    band(g, W, H, H * 0.64, u * 3.5, u * 30, sc * 0.1, '#7CC6A6');
    longNeck(g, W * 0.24 - sc * 0.12 + u * 2, H * 0.63, u * 9, t, '#5BAF90', '#27584A');
    band(g, W, H, H * 0.73, u * 3, u * 22, sc * 0.3 + 40, '#55B37B');
    tile(W, u * 58, sc * 0.5, (x, i) => palm(g, x + u * 12, H * 0.76, u * (9 + (i & 1) * 3), i & 1 ? -1 : 1));
    band(g, W, H, H * 0.86, u * 2.5, u * 17, sc * 0.9 + 90, '#3E9B5C');
    // 翼竜
    const px = ((t * 0.05) % 1.5 - 0.25) * W, py = H * 0.15 + Math.sin(t * 1.3) * u * 3, fl = Math.sin(t * 6) * u * 2.4;
    g.strokeStyle = '#4B6F7A'; g.lineWidth = u * 0.9; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(px - u * 6, py + fl); g.quadraticCurveTo(px - u * 3, py - u * 2, px, py); g.quadraticCurveTo(px + u * 3, py - u * 2, px + u * 6, py + fl); g.stroke();
    // 手前のシダ
    g.fillStyle = '#2C7B49';
    for (const [bx, dir] of [[0, 1], [W, -1]]) for (let i = 0; i < 4; i++) {
      const a = -1.3 + i * 0.32, len = u * (24 - i * 3);
      g.beginPath(); g.moveTo(bx, H);
      g.quadraticCurveTo(bx + dir * Math.cos(a) * len * 0.4, H + Math.sin(a) * len * 0.9, bx + dir * Math.cos(a) * len, H + Math.sin(a) * len);
      g.quadraticCurveTo(bx + dir * Math.cos(a + 0.3) * len * 0.6, H + Math.sin(a + 0.3) * len * 0.5, bx, H); g.fill();
    }
  },

  // サバンナの夕やけ
  savanna(g, W, H, t, sc) {
    const u = Math.min(W, H) / 100;
    sky(g, W, H, [[0, '#FF9A5C'], [0.45, '#FFC46B'], [1, '#FFEAAE']]);
    const sx = W * 0.3, sy = H * 0.46;
    g.fillStyle = 'rgba(255,244,200,.45)'; g.beginPath(); g.arc(sx, sy, u * 24, 0, TAU); g.fill();
    g.fillStyle = '#FFF4C8'; g.beginPath(); g.arc(sx, sy, u * 14, 0, TAU); g.fill();
    band(g, W, H, H * 0.63, u * 3, u * 40, sc * 0.08, '#E0926A');
    band(g, W, H, H * 0.7, u * 2, u * 26, sc * 0.2 + 30, '#D6A85A');
    tile(W, u * 70, sc * 0.35, (x, i) => acacia(g, x + u * 20, H * 0.74, u * (11 + (i & 1) * 4)));
    giraffe(g, W * 0.9, H, u * 12, t);
    band(g, W, H, H * 0.84, u * 1.6, u * 15, sc * 0.9, '#C59A43');
    g.strokeStyle = '#A9812F'; g.lineWidth = u * 0.7; g.lineCap = 'round';
    tile(W, u * 7, sc, (x, i) => {
      const sw = Math.sin(t * 1.6 + i) * u * 1.2, hh = u * (5 + (i * 37 % 5));
      g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + sw * 0.4, H - hh * 0.6, x + sw, H - hh); g.stroke();
    });
  },

  // お花ばたけ
  meadow(g, W, H, t, sc) {
    const u = Math.min(W, H) / 100;
    sky(g, W, H, [[0, '#6FC3F7'], [0.6, '#C6ECFF'], [1, '#EAF9FF']]);
    tile(W, u * 60, sc * 0.05 + t * u * 1.2, (x, i) => cloud(g, x + u * 10, H * (0.12 + (i & 1) * 0.1), u * (5 + (i % 3))));
    band(g, W, H, H * 0.62, u * 4, u * 34, sc * 0.1, '#A6E08A');
    band(g, W, H, H * 0.74, u * 3.2, u * 24, sc * 0.3 + 70, '#7CCB63');
    band(g, W, H, H * 0.86, u * 2.4, u * 18, sc * 0.9 + 20, '#5BB950');
    const cols = ['#FFFFFF', '#FF9EC4', '#FFE066', '#FFB3A7'];
    tile(W, u * 9, sc * 0.9, (x, i) => {
      const y = H * (0.9 + ((i * 53) % 9) / 100), r = u * (0.9 + (i % 3) * 0.3);
      g.fillStyle = cols[((i % 4) + 4) % 4];
      for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + i; g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, 0, TAU); g.fill(); }
      g.fillStyle = '#FFB800'; g.beginPath(); g.arc(x, y, r * 0.6, 0, TAU); g.fill();
    });
    for (let i = 0; i < 3; i++) {
      const bx = W * (0.15 + i * 0.35) + Math.sin(t * 0.7 + i * 2) * u * 12, by = H * (0.3 + i * 0.08) + Math.cos(t * 0.9 + i) * u * 6, fl = Math.abs(Math.sin(t * 9 + i)) * u * 1.6 + u * 0.4;
      g.fillStyle = ['#FF8FB3', '#FFD166', '#B79CFF'][i];
      g.beginPath(); g.ellipse(bx - fl * 0.6, by, fl, u * 1.5, -0.4, 0, TAU); g.ellipse(bx + fl * 0.6, by, fl, u * 1.5, 0.4, 0, TAU); g.fill();
    }
  },

  // 竹林
  bamboo(g, W, H, t, sc) {
    const u = Math.min(W, H) / 100;
    sky(g, W, H, [[0, '#E6F6D8'], [1, '#A8D898']]);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(255,255,240,${0.16 + (i % 3) * 0.05})`;
      g.beginPath(); g.arc(W * ((i * 0.23 + 0.1) % 1), H * ((i * 0.37 + 0.15) % 1), u * (5 + (i % 4) * 2.5), 0, TAU); g.fill();
    }
    const stalk = (x, w, col, node, sway) => {
      g.fillStyle = col; g.fillRect(x - w / 2, -4, w, H + 8);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x - w / 2, -4, w * 0.28, H + 8);
      g.fillStyle = node;
      for (let y = (x * 7) % (u * 20); y < H; y += u * 20) { rrect(g, x - w / 2 - w * 0.08, y, w * 1.16, u * 1.2, u * 0.6); g.fill(); }
      g.fillStyle = col;
      for (let y = u * 14 + (x * 3) % (u * 30); y < H * 0.7; y += u * 34) {
        g.save(); g.translate(x + w / 2, y); g.rotate(-0.5 + sway);
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(u * 6, -u * 2.4, u * 12, 0); g.quadraticCurveTo(u * 6, u * 1.2, 0, 0); g.fill();
        g.restore();
      }
    };
    tile(W, u * 17, sc * 0.2, (x, i) => stalk(x + u * 5, u * (2 + (i % 3) * 0.5), '#8CCB78', '#72B462', Math.sin(t + i) * 0.08));
    tile(W, u * 31, sc * 0.6, (x, i) => stalk(x + u * 9, u * (4 + (i % 2)), '#63AE55', '#4A9243', Math.sin(t * 0.8 + i) * 0.1));
    band(g, W, H, H * 0.9, u * 1.5, u * 20, sc, '#7DBB69');
  },

  // まち
  town(g, W, H, t, sc) {
    const u = Math.min(W, H) / 100;
    sky(g, W, H, [[0, '#7FC8FF'], [0.7, '#DDF2FF'], [1, '#F2FAFF']]);
    tile(W, u * 70, sc * 0.04 + t * u * 0.8, (x, i) => cloud(g, x + u * 14, H * (0.1 + (i & 1) * 0.09), u * (5 + (i % 2) * 2)));
    const base = H * 0.78;
    const far = ['#C9D8F0', '#D8CDEB', '#CFE3EA'], near = ['#FFD9A0', '#FFB7A8', '#A8D8C8', '#F4E3A1', '#B9C9F2'];
    tile(W, u * 16, sc * 0.2, (x, i) => { g.fillStyle = far[((i % 3) + 3) % 3]; g.fillRect(x, base - u * (20 + ((i * 7) % 14)), u * 14, u * 40); });
    tile(W, u * 24, sc * 0.5, (x, i) => building(g, x + u * 2, base, u * 19, u * (15 + ((i * 11) % 12)), near[((i % 5) + 5) % 5], i));
    tile(W, u * 48, sc * 0.5, (x) => {
      g.fillStyle = '#7A5A3A'; g.fillRect(x + u * 22.4, base - u * 6, u * 1.2, u * 6);
      g.fillStyle = '#5DBB6A'; g.beginPath(); g.arc(x + u * 23, base - u * 8, u * 4, 0, TAU); g.fill();
    });
    g.fillStyle = '#D9DEE6'; g.fillRect(0, base, W, u * 3);
    g.fillStyle = '#5E6675'; g.fillRect(0, base + u * 3, W, H - base);
    g.fillStyle = '#F4F6FA';
    tile(W, u * 22, sc * 1.2, (x) => { rrect(g, x, base + (H - base) * 0.55, u * 11, u * 1.6, u * 0.8); g.fill(); });
  },

  // 線路のある丘
  rail(g, W, H, t, sc) {
    const u = Math.min(W, H) / 100;
    sky(g, W, H, [[0, '#84CFF6'], [0.65, '#DDF3FF'], [1, '#F3FBFF']]);
    tile(W, u * 64, sc * 0.03 + t * u, (x, i) => cloud(g, x + u * 12, H * (0.11 + (i & 1) * 0.1), u * (5.5 + (i % 3))));
    tile(W, u * 60, sc * 0.06, (x, i) => {
      const mh = u * (22 + (i & 1) * 8), mx = x + u * 30, my = H * 0.66;
      g.fillStyle = '#9DB6D8'; g.beginPath(); g.moveTo(mx - u * 30, my); g.lineTo(mx, my - mh); g.lineTo(mx + u * 30, my); g.closePath(); g.fill();
      g.fillStyle = '#F5FAFF'; g.beginPath(); g.moveTo(mx - u * 8.2, my - mh * 0.73); g.lineTo(mx, my - mh); g.lineTo(mx + u * 8.2, my - mh * 0.73); g.lineTo(mx + u * 3, my - mh * 0.66); g.lineTo(mx, my - mh * 0.74); g.lineTo(mx - u * 3.5, my - mh * 0.65); g.closePath(); g.fill();
    });
    band(g, W, H, H * 0.66, u * 3, u * 30, sc * 0.15, '#9ADB8A');
    band(g, W, H, H * 0.76, u * 2.4, u * 22, sc * 0.4 + 50, '#74C869');
    tile(W, u * 46, sc * 0.6, (x) => {
      g.fillStyle = '#8A6B4A'; g.fillRect(x + u * 20, H * 0.62, u * 1, H * 0.2);
      g.fillRect(x + u * 17, H * 0.64, u * 7, u * 0.8);
    });
    const ry = H * 0.88;
    g.fillStyle = '#B79B74'; g.fillRect(0, ry - u * 1.5, W, H - ry + u * 1.5);
    g.fillStyle = '#7A5C3E';
    tile(W, u * 6, sc * 1.4, (x) => g.fillRect(x, ry + u * 0.6, u * 2.6, u * 6));
    g.fillStyle = '#5C6370'; g.fillRect(0, ry + u * 1.2, W, u * 1.1); g.fillRect(0, ry + u * 5, W, u * 1.1);
    g.fillStyle = '#5BB950';
    tile(W, u * 11, sc * 1.4, (x, i) => { g.beginPath(); g.arc(x, H + u * 1.5, u * (3.5 + (i % 3)), 0, TAU); g.fill(); });
  },

  // 宇宙(sc は縦に流れる)
  space(g, W, H, t, sc) {
    const u = Math.min(W, H) / 100;
    sky(g, W, H, [[0, '#090E2C'], [0.55, '#1A1560'], [1, '#3B1E74']]);
    const neb = (x, y, r, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
    neb(W * 0.25, H * 0.3, u * 45, 'rgba(90,120,255,.28)');
    neb(W * 0.8, H * 0.65, u * 50, 'rgba(210,90,220,.22)');
    for (const s of STARS) {
      const y = (((s.y * H + sc * s.d) % H) + H) % H;
      g.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.5 * s.d + s.p));
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(s.x * W, y, u * 0.28 * s.s, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    const py = (((H * 0.2 + sc * 0.12) % (H * 1.4)) + H * 1.4) % (H * 1.4) - H * 0.2;
    g.save(); g.translate(W * 0.82, py); g.rotate(-0.35);
    g.strokeStyle = 'rgba(255,225,170,.9)'; g.lineWidth = u * 1.3;
    g.beginPath(); g.ellipse(0, 0, u * 14, u * 3.4, 0, Math.PI, TAU); g.stroke();
    g.fillStyle = '#F2B84B'; g.beginPath(); g.arc(0, 0, u * 8, 0, TAU); g.fill();
    g.fillStyle = 'rgba(180,110,30,.35)'; g.beginPath(); g.ellipse(0, u * 2.2, u * 7.4, u * 1.4, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(0, 0, u * 14, u * 3.4, 0, 0, Math.PI); g.stroke();
    g.restore();
    const my = (((H * 0.34 + sc * 0.08) % (H * 1.3)) + H * 1.3) % (H * 1.3) - H * 0.15;
    g.fillStyle = '#D5DEEC'; g.beginPath(); g.arc(W * 0.15, my, u * 6, 0, TAU); g.fill();
    g.fillStyle = '#B4C0D4';
    g.beginPath(); g.arc(W * 0.15 - u * 2, my - u * 1.5, u * 1.5, 0, TAU); g.arc(W * 0.15 + u * 2.2, my + u * 1.6, u * 1.1, 0, TAU); g.arc(W * 0.15 + u * 0.4, my + u * 3.4, u * 0.8, 0, TAU); g.fill();
    const p = (t * 0.22) % 1;
    if (p < 0.25) {
      const k = p / 0.25, x0 = W * (0.9 - k * 0.6), y0 = H * (0.08 + k * 0.2);
      g.strokeStyle = `rgba(255,255,255,${clamp(1 - k)})`; g.lineWidth = u * 0.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + u * 9, y0 - u * 3); g.stroke();
    }
  },

  // キッチン
  kitchen(g, W, H, t) {
    const u = Math.min(W, H) / 100;
    g.fillStyle = '#FFF2DF'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#FFE7CB';
    for (let x = 0; x < W; x += u * 12) g.fillRect(x, 0, u * 6, H);
    const hy = H * 0.07;
    g.fillStyle = '#B98A62'; rrect(g, W * 0.06, hy, W * 0.88, u * 1.4, u * 0.7); g.fill();
    const hang = [[0.16, 'ladle'], [0.34, 'pan'], [0.52, 'whisk'], [0.7, 'pot'], [0.86, 'ladle']];
    for (const [fx, kind] of hang) {
      const x = W * fx, sw = Math.sin(t * 1.2 + fx * 9) * 0.05;
      g.save(); g.translate(x, hy + u * 1.2); g.rotate(sw);
      g.strokeStyle = '#C58F63'; g.fillStyle = '#D9A679'; g.lineWidth = u * 0.9; g.lineCap = 'round';
      if (kind === 'ladle') { g.beginPath(); g.moveTo(0, 0); g.lineTo(0, u * 11); g.stroke(); g.beginPath(); g.arc(0, u * 13, u * 2.6, 0, Math.PI); g.fill(); }
      else if (kind === 'pan') { g.beginPath(); g.moveTo(0, 0); g.lineTo(0, u * 8); g.stroke(); g.fillStyle = '#8C7A70'; g.beginPath(); g.arc(0, u * 12.5, u * 4.6, 0, TAU); g.fill(); g.fillStyle = '#A5958B'; g.beginPath(); g.arc(0, u * 12.5, u * 3.4, 0, TAU); g.fill(); }
      else if (kind === 'whisk') { g.beginPath(); g.moveTo(0, 0); g.lineTo(0, u * 7); g.stroke(); g.lineWidth = u * 0.5; for (let i = -1; i <= 1; i++) { g.beginPath(); g.ellipse(0, u * 11, u * (0.6 + Math.abs(i) * 1.5), u * 4, 0, 0, TAU); g.stroke(); } }
      else { g.beginPath(); g.moveTo(-u * 3, 0); g.lineTo(-u * 3, u * 5); g.moveTo(u * 3, 0); g.lineTo(u * 3, u * 5); g.stroke(); g.fillStyle = '#E36A5C'; rrect(g, -u * 5, u * 5, u * 10, u * 7, u * 1.5); g.fill(); g.fillStyle = '#F08B7E'; g.fillRect(-u * 5, u * 6.4, u * 10, u * 1.2); }
      g.restore();
    }
    const fy = H * 0.84, ts = u * 9;
    for (let y = fy, r = 0; y < H; y += ts, r++) for (let x = -ts, c = 0; x < W + ts; x += ts, c++) {
      g.fillStyle = (r + c) % 2 ? '#F6C7A6' : '#FFE3CF'; g.fillRect(x, y, ts, ts);
    }
    g.fillStyle = '#E9B48C'; g.fillRect(0, fy - u * 1.2, W, u * 1.2);
  },
};
