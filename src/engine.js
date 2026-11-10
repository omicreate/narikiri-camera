// 毎コマの流れ: 映像 → 顔の追跡 → なりきりの動き → 重ねて描く
import { Tracker, OVAL } from './tracker.js';
import { Fx } from './fx.js';
import { WORLDS } from './worlds.js';
import { clamp, easeOutBack, hill, makeCanvas } from './util.js';
import { SHRINK, rim, drawBackLayer, drawWearLayer, drawFrontLayer } from './draw.js';

const OPEN_ON = 0.45, OPEN_OFF = 0.27;   // 口をあけた/とじた と見なす境目

export class Engine {
  constructor(canvas, sound) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d', { alpha: false });
    this.sound = sound;
    this.tracker = new Tracker();
    this.fx = new Fx();
    this.personC = makeCanvas(2, 2); this.pg = this.personC.getContext('2d');
    this.wearC = makeCanvas(2, 2); this.wg = this.wearC.getContext('2d');
    this.W = 2; this.H = 2; this.css = { w: 2, h: 2, dpr: 1 };
    this.item = null; this.worldOn = true; this.mirror = true;
    this.source = null; this.map = null;
    this.safe = { top: 0, bottom: 0, right: 0 };   // 操作の部品で かくれる幅(CSS px)。構図と写真の切り出しに使う
    this.fr = { k: 1, tx: 0, ty: 0 };              // 構図の調整(拡大率と ずらし量)。背景を変えているときだけ働く
    this.views = [];
    this.t = 0; this.frameNo = 0; this.segEvery = 1; this.freshNo = 0;
    this.scroll = 0; this.boostV = 0; this.spin = 0;
    this.shakeAmp = 0; this.shakeEnd = 0; this.shakeDur = 1;
    this.lastWord = -9; this.lastVT = -1; this.photoN = 0; this.photoAt = 0;
    this.quiet = false;        // true のあいだは なりきりの かけ声の文字を出さない(まねっこ中)
    this.noFaceT = 0;
    this.override = null;      // 試験用: 表情の値を上書きする
    this.onTrigger = null;     // 口をあけた瞬間に呼ぶ
    this.calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.adaptive = true; this.quality = 1; this.frameMs = 16; this.slow = 0; this.lastNow = 0;
    const self = this;
    this.env = {
      t: 0, dt: 0.016, W: 2, H: 2, spin: 0, thumb: false, masked: false, fx: this.fx, rim,
      sfx: (n, o) => (self.sound ? self.sound.play(n, o) : false),
      shake: (amp, dur) => {
        if (self.calm) return;   // 「動きを へらす」設定のときは ゆらさない
        self.shakeAmp = Math.max(self.shakeAmp, amp * (self.W / 720)); self.shakeDur = dur; self.shakeEnd = self.t + dur;
      },
      boost: (v) => { self.boostV = Math.max(self.boostV, v); },
    };
  }

  resize(cssW, cssH, dpr = 1) {
    this.css = { w: cssW, h: cssH, dpr };
    const sc = Math.min(dpr, 2) * this.quality, long = Math.max(cssW, cssH) * sc, k = long > 1600 ? 1600 / long : 1;
    const W = Math.max(2, Math.round(cssW * sc * k)), H = Math.max(2, Math.round(cssH * sc * k));
    if (W === this.W && H === this.H) return;
    this.W = W; this.H = H; this.env.W = W; this.env.H = H;
    for (const c of [this.canvas, this.personC, this.wearC]) { c.width = W; c.height = H; }
  }

  setItem(item) {
    this.item = item;
    this.fx.clear();
    this.boostV = 0; this.lastWord = -9;
  }

  setWorld(on) {
    this.worldOn = on;
    if (!on) { this.tracker.hasMask = false; this.tracker.maskPrev = null; }
  }

  // src: { el, kind: 'video' | 'photo', w, h, mirror }
  setSource(src) {
    this.source = src;
    this.mirror = !!(src && src.mirror);
    this.tracker.reset();
    this.views = [];
    this.lastVT = -1; this.photoN = 0;
  }

  // 画面タップ: 口をあけたのと同じ動きを起こす
  poke() { for (const v of this.views) v.fakeAt = this.t; return this.views.length; }

  // いまの画面を写しとる。crop=true なら 操作の台に かくれている部分を 切り落とす
  snapshot(crop = false) {
    const px = this.W / this.css.w;
    const w = crop ? Math.max(2, Math.round(this.W - this.safe.right * px)) : this.W;
    const h = crop ? Math.max(2, Math.round(this.H - this.safe.bottom * px)) : this.H;
    const c = makeCanvas(w, h);
    c.getContext('2d').drawImage(this.canvas, 0, 0);
    return c;
  }

  frame(now) {
    const t = now / 1000;
    const dt = clamp(t - this.t, 0.001, 0.05);
    this.t = t; this.env.t = t; this.env.dt = dt;
    if (this.lastNow) this.frameMs += (Math.min(250, now - this.lastNow) - this.frameMs) * 0.08;
    this.lastNow = now;
    const src = this.source, tk = this.tracker;
    if (src && tk.face) {
      let fresh = false;
      if (src.kind === 'video') {
        const v = src.el;
        if (v.readyState >= 2 && v.videoWidth) {
          src.w = v.videoWidth; src.h = v.videoHeight;
          if (src.rvfc) { fresh = src.newFrame; src.newFrame = false; }   // 新しいコマが来たときだけ 顔をさがす
          else if (v.currentTime !== this.lastVT) { this.lastVT = v.currentTime; fresh = true; }
        }
      } else {
        this.photoN++;
        fresh = this.photoN <= 10;   // 写真は動かないので、はじめの数コマだけ 顔をさがす
      }
      const wantSeg = this.worldOn && this.item && WORLDS[this.item.world];
      if (fresh && src.w) {
        tk.detect(src.el, src.w, src.h, now);
        if (src.kind === 'photo') { if (wantSeg) tk.segment(src.el, now, tk.tracks.length > 0); }
        // 間引きは「新しいコマ」の数で数える(画面の更新回数で数えると、カメラの周期と かみ合って 一度も切り抜かないことがある)
        else if (wantSeg && this.freshNo++ % this.segEvery === 0) tk.segment(src.el, now, tk.tracks.some((tr) => now - tr.seen < 120));
      } else if (src.kind === 'photo' && wantSeg && !tk.hasMask) tk.segment(src.el, now, tk.tracks.length > 0);
    }
    this.frameNo++;
    this._views(now, dt);
    this._logic(t, dt);
    this.fx.update(dt);
    this._draw();
    this._adapt();
  }

  // 重い端末では 切り抜きの回数→画面の細かさ の順に下げて、動きのなめらかさを守る
  _adapt() {
    if (!this.adaptive || !this.source || this.source.kind !== 'video') return;
    this.slow = this.frameMs > 52 ? this.slow + 1 : Math.max(0, this.slow - 2);
    if (this.slow < 80) return;
    this.slow = 0;
    if (this.segEvery < 3) this.segEvery++;
    else if (this.quality > 0.62) { this.quality -= 0.2; this.resize(this.css.w, this.css.h, this.css.dpr); }
  }

  // なりきりが 画面からはみ出さないよう、人物の大きさと位置を 決める(背景を変えているときだけ)
  _frame(dt, s, ox, oy) {
    const src = this.source, W = this.W, H = this.H, item = this.item, mir = this.mirror, fr = this.fr;
    const tracks = this.tracker.tracks;
    const active = item && this.worldOn && this.tracker.hasMask && WORLDS[item.world];
    if (!active) { fr.k = 1; fr.tx = 0; fr.ty = 0; return; }
    let k = 1, tx = 0, ty = 0;
    this.noFaceT = tracks.length ? 0 : this.noFaceT + dt;
    if (!tracks.length && this.noFaceT < 1.3) return;   // 顔を一瞬 見失っても 構図を うごかさない
    if (tracks.length) {
      const E = item.ext || { l: 1.2, r: 1.2, t: 1.5, b: 1.3 };
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, umax = 1, mx = 0, my = 0;
      for (const tr of tracks) {
        const pts = tr.pts;
        const B = (i) => { let x = ox + pts[i * 2] * src.w * s; if (mir) x = W - x; return { x, y: oy + pts[i * 2 + 1] * src.h * s }; };
        let cx = 0, cy = 0;
        for (const i of OVAL) { const p = B(i); cx += p.x; cy += p.y; }
        cx /= OVAL.length; cy /= OVAL.length;
        const a = B(234), b = B(454), c = B(10), d = B(152);
        const U = Math.max(Math.hypot(a.x - b.x, a.y - b.y), Math.hypot(c.x - d.x, c.y - d.y) / 1.32, 8);
        umax = Math.max(umax, U); mx += cx; my += cy;
        x0 = Math.min(x0, cx - E.l * U); x1 = Math.max(x1, cx + E.r * U); y0 = Math.min(y0, cy - E.t * U); y1 = Math.max(y1, cy + E.b * U);
      }
      mx /= tracks.length; my /= tracks.length;
      const px = W / this.css.w, top = this.safe.top * px, aw = W - this.safe.right * px, bot = H - this.safe.bottom * px, ah = Math.max(40, bot - top);
      const fit = Math.min((aw * 0.97) / (x1 - x0), (ah * 0.97) / (y1 - y0));
      if (fit < 1) k = Math.max(fit, 0.3, (0.13 * Math.min(W, H)) / umax);             // 大きすぎる → 引く(顔が 小さくなりすぎない所まで)
      else k = clamp((0.22 * Math.min(W, H)) / umax, 1, Math.min(fit, 1.5));          // 小さすぎる → 寄る
      const bx0 = mx + (x0 - mx) * k, bx1 = mx + (x1 - mx) * k, by0 = my + (y0 - my) * k, by1 = my + (y1 - my) * k;
      const dx = bx1 - bx0 > aw ? (aw - (bx0 + bx1)) / 2 : clamp(0, -bx0, aw - bx1);
      const dy = by1 - by0 > ah ? (top + bot - (by0 + by1)) / 2 : clamp(0, top - by0, bot - by1);
      tx = mx * (1 - k) + dx; ty = my * (1 - k) + dy;
    }
    const a = 1 - Math.exp(-dt * 6);
    fr.k += (k - fr.k) * a; fr.tx += (tx - fr.tx) * a; fr.ty += (ty - fr.ty) * a;
  }

  _views(now, dt) {
    const src = this.source, W = this.W, H = this.H, item = this.item, out = [];
    if (src && src.w) {
      const s = Math.max(W / src.w, H / src.h), ox = (W - src.w * s) / 2, oy = (H - src.h * s) / 2, mir = this.mirror;
      this.map = { s, ox, oy };
      this._frame(dt, s, ox, oy);
      const fr = this.fr;
      const rf = item && item.rollFactor !== undefined ? item.rollFactor : 1;
      for (const tr of this.tracker.tracks) {
        const v = tr.view || (tr.view = newView(tr.id));
        const pts = tr.pts;
        const P = (k) => { let x = ox + pts[k * 2] * src.w * s; if (mir) x = W - x; return { x: x * fr.k + fr.tx, y: (oy + pts[k * 2 + 1] * src.h * s) * fr.k + fr.ty }; };
        const oval = OVAL.map(P);
        let cx = 0, cy = 0;
        for (const p of oval) { cx += p.x; cy += p.y; }
        cx /= oval.length; cy /= oval.length;
        const a = P(33), b = P(263), l = a.x < b.x ? a : b, r = a.x < b.x ? b : a;
        const roll = Math.atan2(r.y - l.y, r.x - l.x);
        const pa = P(234), pb = P(454), pt = P(10), pc = P(152);
        const U = Math.max(Math.hypot(pa.x - pb.x, pa.y - pb.y), Math.hypot(pt.x - pc.x, pt.y - pc.y) / 1.32, 8);
        if (v.U) {
          const k = 1 - Math.exp(-dt * 12);
          v.vx += ((cx - v.cx) / U / dt - v.vx) * k; v.vy += ((cy - v.cy) / U / dt - v.vy) * k;
        }
        v.cx = cx; v.cy = cy; v.U = U; v.roll = roll; v.ang = roll * rf; v.oval = oval;
        v.pop = easeOutBack(clamp((now - tr.born) / 380));
        v.alpha = src.kind === 'photo' ? 1 : 1 - clamp((now - tr.seen - 120) / 300);
        const e = tr.expr;
        v.jaw = e.jaw; v.smile = e.smile; v.brow = e.brow; v.blinkL = e.blinkL; v.blinkR = e.blinkR; v.pucker = e.pucker; v.gap = e.gap;
        v.yaw = mir ? -e.yaw : e.yaw; v.pitch = e.pitch;
        v.fitW = W / U;
        const ca = Math.cos(-v.ang), sa = Math.sin(-v.ang);
        const toL = (p) => { const dx = (p.x - cx) / U, dy = (p.y - cy) / U; return { x: dx * ca - dy * sa, y: dx * sa + dy * ca }; };
        const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
        const iris = tr.n > 473;
        const e1 = toL(iris ? P(468) : mid(P(33), P(133))), e2 = toL(iris ? P(473) : mid(P(362), P(263)));
        const c1 = toL(P(50)), c2 = toL(P(280));
        v.L = {
          nose: toL(P(1)), noseBase: toL(P(2)), mouth: toL(mid(P(13), P(14))), mouthTop: toL(P(0)), chin: toL(pc), forehead: toL(pt),
          eyeL: e1.x < e2.x ? e1 : e2, eyeR: e1.x < e2.x ? e2 : e1, cheekL: c1.x < c2.x ? c1 : c2, cheekR: c1.x < c2.x ? c2 : c1,
        };
        v.hole = oval.map((p) => ({ x: cx + (p.x - cx) * SHRINK, y: cy + (p.y - cy) * SHRINK }));
        v.holeL = v.hole.map(toL);
        v.st = item ? (v.states[item.id] || (v.states[item.id] = {})) : {};
        out.push(v);
      }
    }
    out.sort((p, q) => p.cx - q.cx);
    out.forEach((v, i) => { v.index = i; v.count = out.length; v.side = out.length > 1 && v.cx < W / 2 ? -1 : 1; });
    this.views = out;
  }

  _logic(t, dt) {
    const item = this.item, env = this.env, ov = this.override;
    const u = Math.min(this.W, this.H) / 100;
    this.boostV *= Math.exp(-dt * 1.3);
    if (item) this.scroll += dt * (item.scroll || 0) * u * (1 + this.boostV * 2.6);
    this.spin += dt * (5 + this.boostV * 12);
    env.spin = this.spin;
    for (const v of this.views) {
      if (ov) for (const k in ov) if (k !== 'open') v[k] = ov[k];
      let real = clamp(Math.max(v.jaw * 1.2, (v.gap - 0.17) / 0.13));
      if (ov && ov.open !== undefined) real = ov.open;
      const fake = t - v.fakeAt < 0.95 ? hill((t - v.fakeAt) / 0.95, 0.18) : 0;
      const val = Math.max(real, fake);
      v.open += (val - v.open) * (1 - Math.exp(-dt * 16));
      v.mouth = real;
      if (!v.openOn && val > OPEN_ON) { v.openOn = true; this._trigger(v, t); }
      else if (v.openOn && val < OPEN_OFF) v.openOn = false;
      if (item) {
        if (item.update) item.update(v, env, dt);
        if (v.openOn && item.whileOpen) item.whileOpen(v, env, dt);
      }
    }
  }

  _trigger(v, t) {
    const item = this.item;
    if (!item) return;
    if (item.word && !this.quiet && t - this.lastWord > 0.5) {
      this.lastWord = t;
      const W = this.W, H = this.H, p = v.toCanvas(0, -1.3);
      const size = clamp(v.U * 0.42, W * 0.085, (W * 0.86) / Math.max(4, item.word.length));
      this.fx.word(clamp(p.x, W * 0.3, W * 0.7), clamp(p.y, H * 0.12, H * 0.7), size, item.word, item.wordCol);
    }
    if (item.onTrigger) item.onTrigger(v, this.env);
    if (this.onTrigger) this.onTrigger(v);
  }

  _drawSource(g, el) {
    const m = this.map, src = this.source, fr = this.fr;
    g.save();
    if (fr.k !== 1 || fr.tx || fr.ty) { g.translate(fr.tx, fr.ty); g.scale(fr.k, fr.k); }
    if (this.mirror) { g.translate(this.W, 0); g.scale(-1, 1); }
    g.drawImage(el, m.ox, m.oy, src.w * m.s, src.h * m.s);
    g.restore();
  }

  // マスクで 人物だけを 切り抜く。引いて映像のふちが見えるときは、ふちを ぼかして消す
  _cutout() {
    const pg = this.pg, m = this.map, src = this.source, fr = this.fr;
    pg.setTransform(1, 0, 0, 1, 0, 0);
    pg.globalCompositeOperation = 'source-over';
    pg.clearRect(0, 0, this.W, this.H);
    pg.imageSmoothingEnabled = true; pg.imageSmoothingQuality = 'medium';
    this._drawSource(pg, this.tracker.mask);
    if (fr.k < 0.985 || Math.abs(fr.tx) > 2 || Math.abs(fr.ty) > 2) {
      const X0 = fr.tx + fr.k * m.ox, X1 = fr.tx + fr.k * (m.ox + src.w * m.s), Y0 = fr.ty + fr.k * m.oy, Y1 = fr.ty + fr.k * (m.oy + src.h * m.s);
      const f = (X1 - X0) * 0.08;
      const lg = (x0, y0, x1, y1) => { const gr = pg.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); return gr; };
      pg.globalCompositeOperation = 'destination-out';
      pg.fillStyle = lg(X0, 0, X0 + f, 0); pg.fillRect(X0 - 2, Y0 - 2, f + 2, Y1 - Y0 + 4);
      pg.fillStyle = lg(X1, 0, X1 - f, 0); pg.fillRect(X1 - f, Y0 - 2, f + 2, Y1 - Y0 + 4);
      pg.fillStyle = lg(0, Y1, 0, Y1 - f); pg.fillRect(X0 - 2, Y1 - f, X1 - X0 + 4, f + 2);
      pg.fillStyle = lg(0, Y0, 0, Y0 + f * 0.6); pg.fillRect(X0 - 2, Y0 - 2, X1 - X0 + 4, f * 0.6 + 2);
    }
    pg.globalCompositeOperation = 'source-in';
    this._drawSource(pg, src.el);
    pg.globalCompositeOperation = 'source-over';
  }

  _draw() {
    const g = this.g, W = this.W, H = this.H, item = this.item, src = this.source, env = this.env, views = this.views;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (!src || !src.w || !this.map) { g.fillStyle = '#0A1020'; g.fillRect(0, 0, W, H); return; }
    const worldFn = item && this.worldOn && this.tracker.hasMask ? WORLDS[item.world] : null;
    g.save();
    if (this.t < this.shakeEnd) {
      const k = (this.shakeEnd - this.t) / this.shakeDur, amp = this.shakeAmp * k, z = 1 + (amp * 2.4) / W;
      g.translate(W / 2 + (Math.random() * 2 - 1) * amp, H / 2 + (Math.random() * 2 - 1) * amp); g.scale(z, z); g.translate(-W / 2, -H / 2);
    } else this.shakeAmp = 0;
    if (worldFn) {
      g.save(); worldFn(g, W, H, this.t, this.scroll); g.restore();
      if (item.back) for (const v of views) drawBackLayer(g, item, v, env);
      this._cutout();
      g.drawImage(this.personC, 0, 0);
    } else {
      this._drawSource(g, src.el);
    }
    if (item && views.length) {
      if (item.wear) {
        const wg = this.wg;
        wg.setTransform(1, 0, 0, 1, 0, 0); wg.globalCompositeOperation = 'source-over'; wg.clearRect(0, 0, W, H);
        env.masked = !!worldFn;
        // 画面の下にいる人ほど 手前にいると見なし、その人の頭まわりは うしろの人の服で塗らない
        for (const v of views.slice().sort((p, q) => p.cy - q.cy)) {
          if (worldFn && views.length > 1) {
            wg.save(); wg.globalCompositeOperation = 'destination-out';
            wg.translate(v.cx, v.cy); wg.rotate(v.ang); wg.scale(v.U, v.U);
            wg.beginPath(); wg.ellipse(0, -0.1, 0.78, 1.0, 0, 0, Math.PI * 2); wg.rect(-0.4, 0.5, 0.8, 0.5); wg.fill();
            wg.restore();
          }
          drawWearLayer(wg, item, v, env, W, H, views);
        }
        if (worldFn) {   // 服を 体の形に合わせる
          wg.globalCompositeOperation = 'destination-in';
          wg.drawImage(this.personC, 0, 0);
          wg.globalCompositeOperation = 'source-over';
        }
        g.drawImage(this.wearC, 0, 0);
      }
      const order = views.slice().sort((p, q) => (item.ride ? p.cy - q.cy : p.U - q.U));
      for (const v of order) drawFrontLayer(g, item, v, env, W, H, views);
    }
    this.fx.draw(g);
    g.restore();
  }
}

function newView(id) {
  const v = {
    id, cx: 0, cy: 0, U: 0, roll: 0, ang: 0, pop: 1, alpha: 1, vx: 0, vy: 0,
    open: 0, mouth: 0, openOn: false, fakeAt: -9,
    jaw: 0, smile: 0, brow: 0, blinkL: 0, blinkR: 0, pucker: 0, gap: 0, yaw: 0, pitch: 0,
    index: 0, count: 1, side: 1, fitW: 4, states: {}, st: {}, oval: [], hole: [], holeL: [], L: null,
  };
  v.toCanvas = (x, y) => {
    const c = Math.cos(v.ang), s = Math.sin(v.ang), k = v.U * v.pop;
    return { x: v.cx + (x * c - y * s) * k, y: v.cy + (x * s + y * c) * k };
  };
  return v;
}
