// まねっこゲーム: おてほんと同じ顔をすると 星が もらえる。5つで 1回
import { makeCanvas } from './util.js';

export const POSES = [
  { id: 'open', text: 'おくちを あーん!', label: 'あーん', test: (f) => f.mouth > 0.5 },
  { id: 'smile', text: 'にっこり えがお!', label: 'にっこり', test: (f) => f.smile > 0.45 && f.mouth < 0.5 },
  { id: 'brow', text: 'びっくり! まゆげを あげて', label: 'びっくり', test: (f) => f.brow > 0.42 },
  { id: 'eyes', text: 'おめめを ぎゅっ!', label: 'ぎゅっ', test: (f) => f.blinkL > 0.5 && f.blinkR > 0.5 },
  { id: 'kiss', text: 'くちを とがらせて チュー!', label: 'チュー', test: (f) => f.pucker > 0.5 && f.mouth < 0.4 },
  { id: 'tilt', text: 'あたまを かたむけて!', label: 'こてん', test: (f) => Math.abs(f.roll) > 0.3 },
  { id: 'turn', text: 'よこを むいて!', label: 'よこむき', test: (f) => Math.abs(f.yaw) > 0.4 },
  { id: 'peek', text: 'おかおを かくして…', text2: 'ばあ!', label: 'ばあ', peek: true },
];

const HOLD = 0.45;    // この秒数 つづけて できたら 成功
const LIMIT = 14;     // できなくても この秒数で つぎへ(せかさない・へらさない)
const ROUND = 5;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export class Game {
  // ui: { pose(p, index, total, text), progress(0〜1), mark(index, ok), finish(stars, total, shots) }
  constructor(engine, sound, ui) {
    this.engine = engine; this.sound = sound; this.ui = ui;
    this.active = false; this.pose = null;
  }

  start(ids) {
    this.round = ids ? ids.map((id) => POSES.find((p) => p.id === id)).filter(Boolean) : shuffle(POSES.slice()).slice(0, ROUND);
    this.i = 0; this.stars = 0; this.shots = []; this.active = true;
    this._begin();
  }

  stop() { this.active = false; }

  _begin() {
    const p = this.round[this.i];
    this.pose = p; this.hold = 0; this.elapsed = 0; this.phase = 'show'; this.hidden = 0; this.wasHidden = false; this.snapIn = -1;
    this.ui.pose(p, this.i, this.round.length, p.text);
    this.ui.progress(0);
    this.sound.play('tick');
  }

  update(dt) {
    if (!this.active) return;
    if (this.phase === 'show') {
      const p = this.pose, seen = this.engine.views.filter((v) => v.alpha > 0.9);
      this.elapsed += dt;
      if (p.peek) {
        if (!seen.length) {
          this.hidden += dt;
          if (this.hidden > 0.35 && !this.wasHidden) { this.wasHidden = true; this.ui.pose(p, this.i, this.round.length, p.text2); }
        } else if (this.wasHidden) { this._success(0.3); return; } else this.hidden = 0;
        this.ui.progress(this.wasHidden ? 0.7 : Math.min(1, this.hidden / 0.35) * 0.7);
      } else {
        this.hold = seen.some((v) => p.test(v)) ? this.hold + dt : Math.max(0, this.hold - dt * 1.5);
        this.ui.progress(this.hold / HOLD);
        if (this.hold >= HOLD) { this._success(0); return; }
      }
      if (this.elapsed > LIMIT) this._skip();
      return;
    }
    if (this.snapIn >= 0) { this.snapIn -= dt; if (this.snapIn < 0) this._snap(); }
    this.wait -= dt;
    if (this.wait <= 0) {
      this.i++;
      if (this.i >= this.round.length) this._finish(); else this._begin();
    }
  }

  _snap() {
    const e = this.engine, w = 420, c = makeCanvas(w, Math.round((w * e.H) / e.W));
    c.getContext('2d').drawImage(e.canvas, 0, 0, c.width, c.height);
    this.shots.push({ canvas: c, label: this.pose.label });
  }

  _success(snapDelay) {
    const e = this.engine, W = e.W, H = e.H;
    this.stars++; this.phase = 'done'; this.wait = 1.5;
    if (snapDelay > 0) this.snapIn = snapDelay; else this._snap();
    this.ui.mark(this.i, true); this.ui.progress(1);
    this.sound.play('success');
    e.fx.word(W / 2, H * 0.3, Math.min(W * 0.17, H * 0.1), 'できた!', '#FFD25A', -0.08);
    e.fx.burst('star', W / 2, H * 0.3, W * 0.5, 12, { up: 1.0, size: 0.55 });
    e.fx.burst('confetti', W / 2, H * 0.3, W * 0.5, 16, { up: 1.2, size: 0.4 });
  }

  _skip() {
    this.phase = 'done'; this.wait = 0.8;
    this.ui.mark(this.i, false);
    this.sound.play('soft');
  }

  _finish() {
    this.active = false;
    this.sound.play('fanfare');
    this.ui.finish(this.stars, this.round.length, this.shots);
  }
}
