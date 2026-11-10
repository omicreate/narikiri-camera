// 粒の演出(火・けむり・水・星・ハート・文字)。座標はキャンバスの画素。
import { TAU, clamp, rand, pick, starPath, heartPath, easeOutBack, FONT } from './util.js';

const CONFETTI = ['#FFD84D', '#FF6F91', '#5CC8FF', '#7BE08A', '#FFFFFF', '#FFA53C'];

export class Fx {
  constructor() { this.list = []; this.limit = 520; }
  clear() { this.list.length = 0; }

  add(p) {
    if (this.list.length >= this.limit) this.list.shift();
    p.life = 0;
    p.max = p.max || 1;
    p.vx = p.vx || 0; p.vy = p.vy || 0;
    p.ax = p.ax || 0; p.ay = p.ay || 0;
    p.drag = p.drag || 0;
    p.rot = p.rot || 0; p.vr = p.vr || 0;
    p.a = p.a === undefined ? 1 : p.a;
    this.list.push(p);
    return p;
  }

  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.life += dt;
      let dead = p.life >= p.max;
      if (!dead && p.home) {
        const tg = p.home();
        const dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy) || 1;
        const sp = p.speed * (0.6 + p.life * 1.6);
        const k = clamp(dt * 7);
        p.vx += ((dx / d) * sp - p.vx) * k;
        p.vy += ((dy / d) * sp - p.vy) * k;
        if (d < p.reach) { dead = true; if (p.onArrive) p.onArrive(p); }
      }
      if (dead) { L[i] = L[L.length - 1]; L.pop(); continue; }
      p.vx += p.ax * dt; p.vy += p.ay * dt;
      if (p.drag) { const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }

  draw(g) {
    const L = this.list;
    if (!L.length) return;
    g.save();
    g.lineJoin = 'round'; g.lineCap = 'round';
    let glow = false, words = false;
    for (const p of L) {
      if (p.k === 'fire') { glow = true; continue; }
      if (p.k === 'word') { words = true; continue; }
      drawOne(g, p);
    }
    if (glow) {
      g.globalCompositeOperation = 'lighter';
      for (const p of L) if (p.k === 'fire') drawFire(g, p);
      g.globalCompositeOperation = 'source-over';
    }
    if (words) for (const p of L) if (p.k === 'word') drawWord(g, p);
    g.restore();
  }

  // ---- 出し方の型 ----
  fire(x, y, u, n = 3, spread = 1) {
    for (let i = 0; i < n; i++) {
      this.add({ k: 'fire', x: x + rand(-0.05, 0.05) * u, y: y + rand(0, 0.05) * u, vx: rand(-0.75, 0.75) * u * spread, vy: rand(1.0, 2.5) * u, ay: -1.2 * u, drag: 1.3, s: rand(0.055, 0.115) * u, max: rand(0.4, 0.75), a: 0.8 });
    }
  }
  flame(x, y, u, n = 2, down = 1) {   // ロケットの噴射(下向き)
    for (let i = 0; i < n; i++) {
      this.add({ k: 'fire', x: x + rand(-0.25, 0.25) * u, y, vx: rand(-0.25, 0.25) * u, vy: rand(1.4, 2.6) * u * down, drag: 0.5, s: rand(0.16, 0.3) * u, max: rand(0.35, 0.6) });
    }
  }
  smoke(x, y, u, n = 1, o = {}) {
    for (let i = 0; i < n; i++) {
      this.add({ k: 'smoke', x: x + rand(-0.05, 0.05) * u, y, vx: (o.vx || 0) * u + rand(-0.15, 0.15) * u, vy: (o.vy === undefined ? -0.7 : o.vy) * u + rand(-0.1, 0.1) * u, drag: 0.6, s: rand(0.1, 0.18) * u * (o.size || 1), max: rand(0.9, 1.5) * (o.life || 1), col: o.col || '#ffffff', a: o.a === undefined ? 0.85 : o.a });
    }
  }
  drops(x, y, u, vx, vy, n = 3) {
    for (let i = 0; i < n; i++) {
      this.add({ k: 'drop', x, y, vx: (vx + rand(-0.35, 0.35)) * u, vy: (vy + rand(-0.35, 0.35)) * u, ay: 3.4 * u, s: rand(0.035, 0.07) * u, max: rand(0.8, 1.3) });
    }
  }
  burst(kind, x, y, u, n = 8, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(TAU), sp = rand(0.6, 1.8) * u * (o.speed || 1);
      this.add({ k: kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0.6) * u, ay: (o.g === undefined ? 1.6 : o.g) * u, drag: 0.8, s: rand(0.07, 0.12) * u * (o.size || 1), max: rand(0.8, 1.4) * (o.life || 1), rot: rand(TAU), vr: rand(-4, 4), col: o.col || pick(CONFETTI), draw: o.draw });
    }
  }
  rise(kind, x, y, u, n = 1, o = {}) {   // ふわっと上がる(ハート・星)
    for (let i = 0; i < n; i++) {
      this.add({ k: kind, x: x + rand(-0.3, 0.3) * u, y: y + rand(-0.1, 0.1) * u, vx: rand(-0.25, 0.25) * u, vy: rand(-0.9, -0.5) * u, drag: 0.4, s: rand(0.08, 0.13) * u * (o.size || 1), max: rand(1.0, 1.6), rot: rand(-0.3, 0.3), vr: rand(-1, 1), col: o.col, draw: o.draw });
    }
  }
  ring(x, y, u, col = '#ffffff', n = 1) {
    for (let i = 0; i < n; i++) this.add({ k: 'ring', x, y, s: u * (0.5 + i * 0.25), max: 0.7 + i * 0.15, col });
  }
  dust(x, y, u, n = 6) {
    for (let i = 0; i < n; i++) {
      this.add({ k: 'smoke', x: x + rand(-0.6, 0.6) * u, y, vx: rand(-0.6, 0.6) * u, vy: rand(-0.9, -0.3) * u, drag: 1.2, s: rand(0.14, 0.26) * u, max: rand(0.7, 1.2), col: '#e3cfa8', a: 0.75 });
    }
  }
  streak(x, y, len, vy, col = '#ffffff') {
    this.add({ k: 'streak', x, y, vy, s: len, max: 1.2, col });
  }
  word(x, y, size, text, col = '#FFD84D', rot = -0.1) {
    this.add({ k: 'word', x, y, s: size, text, col, rot, max: 1.25, vy: -size * 0.12 });
  }
  homing(x, y, u, target, o = {}) {
    return this.add({ k: 'sprite', x, y, vx: rand(-1, 1) * u, vy: rand(-1, 1) * u, s: (o.size || 0.2) * u, max: 3, speed: (o.speed || 2.2) * u, reach: 0.12 * u, home: target, onArrive: o.onArrive, draw: o.draw, rot: rand(-0.4, 0.4), vr: rand(-3, 3) });
  }
}

function drawFire(g, p) {
  const t = p.life / p.max;
  const size = p.s * (t < 0.5 ? 0.7 + t * 1.5 : 1.45 * (1 - (t - 0.5) / 0.62));
  if (size <= 0.5) return;
  g.globalAlpha = p.a * (t < 0.6 ? 0.5 : 0.5 * (1 - (t - 0.6) / 0.4));
  g.fillStyle = t < 0.18 ? '#FFE27A' : t < 0.45 ? '#FF9A2E' : t < 0.75 ? '#FF5320' : '#8A2E14';
  g.beginPath(); g.arc(p.x, p.y, size, 0, TAU); g.fill();
}

function drawWord(g, p) {
  const t = p.life / p.max;
  const sc = easeOutBack(clamp(t / 0.2)) * (1 + Math.sin(t * 40) * 0.015);
  g.save();
  g.globalAlpha = t > 0.78 ? clamp(1 - (t - 0.78) / 0.22) : 1;
  g.translate(p.x, p.y); g.rotate(p.rot); g.scale(sc, sc);
  g.font = `900 ${p.s}px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.strokeStyle = '#1b2440'; g.lineWidth = p.s * 0.3; g.strokeText(p.text, 0, 0);
  g.strokeStyle = '#ffffff'; g.lineWidth = p.s * 0.16; g.strokeText(p.text, 0, 0);
  g.fillStyle = p.col; g.fillText(p.text, 0, 0);
  g.restore();
}

function drawOne(g, p) {
  const t = p.life / p.max;
  const fade = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
  const k = p.k;
  if (k === 'smoke') {
    g.globalAlpha = p.a * (1 - t) * (t < 0.1 ? t / 0.1 : 1);
    g.fillStyle = p.col;
    g.beginPath(); g.arc(p.x, p.y, p.s * (1 + t * 1.6), 0, TAU); g.fill();
    g.globalAlpha = 1;
    return;
  }
  if (k === 'ring') {
    g.globalAlpha = (1 - t) * 0.9;
    g.strokeStyle = p.col; g.lineWidth = p.s * 0.1 * (1 - t) + 1;
    g.beginPath(); g.arc(p.x, p.y, p.s * (0.25 + t * 1.5), 0, TAU); g.stroke();
    g.globalAlpha = 1;
    return;
  }
  if (k === 'streak') {
    g.globalAlpha = 0.75 * fade;
    g.strokeStyle = p.col; g.lineWidth = Math.max(1.5, p.s * 0.03);
    g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x, p.y - p.s); g.stroke();
    g.globalAlpha = 1;
    return;
  }
  g.save();
  g.globalAlpha = p.a * fade;
  g.translate(p.x, p.y);
  if (p.rot) g.rotate(p.rot);
  const s = p.s * (t < 0.12 ? easeOutBack(t / 0.12) : 1);
  if (k === 'drop') {
    g.fillStyle = '#6EC8FF'; g.beginPath(); g.arc(0, 0, s, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(-s * 0.3, -s * 0.3, s * 0.32, 0, TAU); g.fill();
  } else if (k === 'star') {
    starPath(g, 0, 0, s, 5, 0.5, -Math.PI / 2);
    g.fillStyle = p.col || '#FFD84D'; g.fill();
    g.strokeStyle = 'rgba(160,100,0,.55)'; g.lineWidth = Math.max(1, s * 0.1); g.stroke();
  } else if (k === 'spark') {
    starPath(g, 0, 0, s, 4, 0.28, 0);
    g.fillStyle = p.col || '#ffffff'; g.fill();
  } else if (k === 'heart') {
    heartPath(g, 0, 0, s);
    g.fillStyle = p.col || '#FF6F91'; g.fill();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = Math.max(1, s * 0.14); g.stroke();
  } else if (k === 'leaf') {
    g.fillStyle = p.col || '#5DBB63';
    g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.8, s, 0); g.quadraticCurveTo(0, s * 0.8, -s, 0); g.fill();
    g.strokeStyle = 'rgba(20,80,40,.5)'; g.lineWidth = Math.max(1, s * 0.08);
    g.beginPath(); g.moveTo(-s * 0.8, 0); g.lineTo(s * 0.8, 0); g.stroke();
  } else if (k === 'confetti') {
    g.fillStyle = p.col; g.fillRect(-s * 0.5, -s * 0.28, s, s * 0.56);
  } else if (k === 'rock') {
    g.fillStyle = '#9A7B5B';
    g.beginPath(); g.moveTo(-s, s * 0.3); g.lineTo(-s * 0.5, -s * 0.7); g.lineTo(s * 0.5, -s * 0.8); g.lineTo(s, 0); g.lineTo(s * 0.4, s * 0.7); g.closePath(); g.fill();
    g.strokeStyle = '#5E4631'; g.lineWidth = Math.max(1, s * 0.12); g.stroke();
  } else if (k === 'sprite' && p.draw) {
    g.scale(s, s); p.draw(g);
  }
  g.restore();
}
