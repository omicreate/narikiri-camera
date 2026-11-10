// 顔の追跡と人物の切り抜き(MediaPipe)。映像は端末の中だけで処理し、どこにも送らない。
import { FilesetResolver, FaceLandmarker, ImageSegmenter } from '../vendor/mediapipe/vision_bundle.js';
import { clamp, lerp, makeCanvas } from './util.js';

const BASE = new URL('../', import.meta.url).href;   // このファイル(src/)の ひとつ上 = アプリの置き場所
const WASM = BASE + 'vendor/mediapipe';
const FACE_MODEL = BASE + 'models/face_landmarker.task';
const SEG_MODEL = BASE + 'models/selfie_segmenter.tflite';

// 顔の輪郭をぐるりと一周する点の番号(MediaPipe Face Mesh)
export const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

const SEG_N = 256;      // 切り抜きモデルに渡す画像の一辺
const MAX_FACES = 4;

export class Tracker {
  constructor() {
    this.tracks = [];
    this.nextId = 1;
    this.face = null;
    this.seg = null;
    this.delegate = null;
    this.segIn = makeCanvas(SEG_N, SEG_N);
    this.segInCtx = this.segIn.getContext('2d');
    this.mask = makeCanvas(SEG_N, SEG_N);
    this.maskCtx = this.mask.getContext('2d');
    this.maskImg = null;
    this.maskPrev = null;
    this.hasMask = false;
    this.maskAt = 0;
    this.stats = { face: 0, seg: 0 };
    this.bsIndex = null;
    this.tsFace = 0;
    this.tsSeg = 0;
    this.errors = 0;
    this.broken = false;
  }

  // prefer: 'GPU' なら GPU→CPU の順に試す
  async init(prefer = 'GPU', onStep = () => {}) {
    onStep(1);
    const fileset = await FilesetResolver.forVisionTasks(WASM);
    const order = prefer === 'CPU' ? ['CPU'] : ['GPU', 'CPU'];
    let lastErr = null;
    for (const delegate of order) {
      try {
        onStep(2);
        this.face = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: FACE_MODEL, delegate },
          runningMode: 'VIDEO',
          numFaces: MAX_FACES,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        });
        onStep(3);
        this.seg = await ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: SEG_MODEL, delegate },
          runningMode: 'VIDEO',
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });
        this.delegate = delegate;
        this.errors = 0;
        this.broken = false;
        return delegate;
      } catch (e) {
        lastErr = e;
        this.close();
      }
    }
    throw lastErr || new Error('init failed');
  }

  close() {
    try { this.face && this.face.close(); } catch (e) { /* 閉じられなくても続ける */ }
    try { this.seg && this.seg.close(); } catch (e) { /* 同上 */ }
    this.face = null;
    this.seg = null;
  }

  reset() {
    this.tracks = [];
    this.hasMask = false;
    this.maskPrev = null;
  }

  _err(e) {
    this.errors++;
    if (this.errors >= 3) this.broken = true;   // 呼び出し側が CPU で作り直す合図
    if (this.errors <= 3) console.warn('[tracker]', e && e.message ? e.message : e);
  }

  // src: video / canvas, sw×sh: その画素数, now: ミリ秒
  detect(src, sw, sh, now) {
    if (!this.face) return;
    this.tsFace = Math.max(this.tsFace + 1, Math.round(now));
    const t0 = performance.now();
    let res;
    try { res = this.face.detectForVideo(src, this.tsFace); } catch (e) { this._err(e); return; }
    this.errors = 0;
    this.stats.face = lerp(this.stats.face, performance.now() - t0, 0.2);
    this._assign(res, sw, sh, now);
  }

  _assign(res, sw, sh, now) {
    const dets = [];
    const n = res && res.faceLandmarks ? res.faceLandmarks.length : 0;
    for (let i = 0; i < n; i++) {
      const lm = res.faceLandmarks[i];
      if (!lm || lm.length < 468) continue;
      const bs = res.faceBlendshapes && res.faceBlendshapes[i] ? res.faceBlendshapes[i].categories : null;
      const mtx = res.facialTransformationMatrixes && res.facialTransformationMatrixes[i] ? res.facialTransformationMatrixes[i].data : null;
      const size = Math.hypot((lm[234].x - lm[454].x) * sw, (lm[234].y - lm[454].y) * sh) + 1e-3;
      dets.push({ lm, bs, mtx, x: lm[1].x * sw, y: lm[1].y * sh, size, used: false });
    }
    for (const tr of this.tracks) tr.matched = false;
    const pairs = [];
    this.tracks.forEach((tr, ti) => dets.forEach((d, di) => {
      const dist = Math.hypot(d.x - tr.x, d.y - tr.y) / Math.max(d.size, tr.size);
      if (dist < 1.3) pairs.push([dist, ti, di]);
    }));
    pairs.sort((a, b) => a[0] - b[0]);
    for (const [dist, ti, di] of pairs) {
      const tr = this.tracks[ti], d = dets[di];
      if (tr.matched || d.used) continue;
      tr.matched = true; d.used = true;
      this._update(tr, d, sw, sh, now, dist);
    }
    for (const d of dets) if (!d.used) this.tracks.push(this._create(d, sw, sh, now));
    this.tracks = this.tracks.filter((tr) => now - tr.seen < 500);
  }

  _create(d, sw, sh, now) {
    const n = d.lm.length;
    const pts = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { pts[i * 2] = d.lm[i].x; pts[i * 2 + 1] = d.lm[i].y; }
    return { id: this.nextId++, pts, n, x: d.x, y: d.y, size: d.size, expr: this._expr(d, sw, sh), born: now, seen: now, matched: true, view: null };
  }

  _update(tr, d, sw, sh, now, dist) {
    const frames = clamp((now - tr.seen) / 33, 0.5, 4);
    // 止まっているときは強くならし、速く動くときは遅れないようにする
    const a = 1 - Math.pow(1 - clamp(0.36 + dist * 5, 0.36, 0.95), frames);
    const n = Math.min(tr.n, d.lm.length);
    const pts = tr.pts;
    for (let i = 0; i < n; i++) {
      pts[i * 2] += (d.lm[i].x - pts[i * 2]) * a;
      pts[i * 2 + 1] += (d.lm[i].y - pts[i * 2 + 1]) * a;
    }
    tr.x = pts[2] * sw; tr.y = pts[3] * sh;
    tr.size = lerp(tr.size, d.size, a);
    const e = this._expr(d, sw, sh);
    const ae = 1 - Math.pow(1 - 0.55, frames);
    for (const k in e) tr.expr[k] += (e[k] - tr.expr[k]) * ae;
    tr.seen = now;
  }

  // 表情の値(0〜1)と顔の向き(ラジアン)
  _expr(d, sw, sh) {
    const lm = d.lm;
    const dist = (a, b) => Math.hypot((lm[a].x - lm[b].x) * sw, (lm[a].y - lm[b].y) * sh);
    const U = Math.max(dist(234, 454), dist(10, 152) / 1.32) + 1e-3;
    const out = { jaw: 0, smile: 0, brow: 0, blinkL: 0, blinkR: 0, pucker: 0, yaw: 0, pitch: 0, gap: dist(13, 14) / U };
    if (d.bs && d.bs.length) {
      if (!this.bsIndex) { this.bsIndex = {}; d.bs.forEach((c, i) => { this.bsIndex[c.categoryName] = i; }); }
      const v = (name) => { const i = this.bsIndex[name]; return i === undefined ? 0 : d.bs[i].score; };
      out.jaw = v('jawOpen');
      out.smile = (v('mouthSmileLeft') + v('mouthSmileRight')) / 2;
      out.brow = Math.max(v('browInnerUp'), (v('browOuterUpLeft') + v('browOuterUpRight')) / 2);
      out.blinkL = v('eyeBlinkLeft');
      out.blinkR = v('eyeBlinkRight');
      out.pucker = v('mouthPucker');
    } else {
      // 表情モデルが使えないときの代わり(点の距離から見積もる)
      out.jaw = clamp((out.gap - 0.12) / 0.2);
      out.smile = clamp((dist(61, 291) / U - 0.38) / 0.08);
      out.blinkL = clamp(1 - (dist(159, 145) / U) / 0.035);
      out.blinkR = clamp(1 - (dist(386, 374) / U) / 0.035);
    }
    if (d.mtx) {
      out.yaw = Math.asin(clamp(d.mtx[8], -1, 1));
      out.pitch = Math.asin(clamp(d.mtx[6], -1, 1));
    } else {
      const l = dist(1, 234), r = dist(1, 454);
      out.yaw = clamp((r - l) / (r + l + 1e-3), -1, 1) * 1.2;
    }
    return out;
  }

  // 人物の切り抜きマスクを更新する。maskCanvas のアルファに人物らしさが入る
  segment(src, now) {
    if (!this.seg) return;
    this.segInCtx.drawImage(src, 0, 0, SEG_N, SEG_N);
    this.tsSeg = Math.max(this.tsSeg + 1, Math.round(now));
    const t0 = performance.now();
    try {
      this.seg.segmentForVideo(this.segIn, this.tsSeg, (res) => {
        const masks = res && res.confidenceMasks;
        if (!masks || !masks.length) return;
        const m = masks[masks.length - 1];
        const w = m.width, h = m.height, arr = m.getAsFloat32Array();
        if (!this.maskImg || this.maskImg.width !== w || this.maskImg.height !== h) {
          this.mask.width = w; this.mask.height = h;
          this.maskImg = this.maskCtx.createImageData(w, h);
          this.maskImg.data.fill(255);
          this.maskPrev = null;
        }
        const first = !this.maskPrev;
        if (first) this.maskPrev = new Float32Array(w * h);
        const prev = this.maskPrev, data = this.maskImg.data;
        for (let i = 0, k = 3; i < arr.length; i++, k += 4) {
          const v = first ? arr[i] : prev[i] * 0.3 + arr[i] * 0.7;   // 前のコマと混ぜて、ふちのちらつきを抑える
          prev[i] = v;
          let t = (v - 0.32) * 2.5;                                   // 0.32〜0.72 を 0〜1 に
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          data[k] = t * t * (3 - 2 * t) * 255;
        }
        this.maskCtx.putImageData(this.maskImg, 0, 0);
        this.hasMask = true;
        this.maskAt = now;
      });
      this.errors = 0;
    } catch (e) { this._err(e); }
    this.stats.seg = lerp(this.stats.seg, performance.now() - t0, 0.2);
  }
}
