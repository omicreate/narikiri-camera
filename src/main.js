// 画面の操作と 全体の流れ(はじめる → カメラ → なりきり / まねっこ → 写真)
import { Engine } from './engine.js';
import { Sound } from './audio.js';
import { ITEMS, CATS, itemById } from './items.js';
import { WORLDS } from './worlds.js';
import { renderThumb } from './draw.js';
import { drawLeon } from './guide.js';
import { Game } from './game.js';
import { makePhoto, makeCollage, saveBlob, shareBlob, canShare, fileName, BRAND } from './capture.js';
import { makeCanvas, clamp, FONT } from './util.js';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const DEBUG = q.has('debug');
const app = $('app');
const sound = new Sound();
const engine = new Engine($('view'), sound);
if (DEBUG) engine.adaptive = false;

const S = {
  cat: 'dino', item: null, mode: 'play', facing: 'user', stream: null, lastKind: 'camera',
  ml: null, mlReady: false, cpuTried: false, running: false, raf: 0, lastNow: 0,
  lastTrig: 0, pickedAt: 0, noFaceSince: 0, hintText: '', blob: null, blobName: '', blobUrl: '', sheetGame: false,
  fpsT: 0, fpsN: 0, segBroken: false, segToldAt: -1e9,
};
const NO_WORLD = 'はいけいは かえずに あそべます';
const VERSION = '0.1.2';   // package.json と そろえる。「おとなの方へ」の末尾に出す(どの版が動いているかの確認用)

const thumbs = new Map();
const thumbOf = (it) => { if (!thumbs.has(it.id)) thumbs.set(it.id, renderThumb(it, 168, WORLDS[it.world])); return thumbs.get(it.id); };

// ---------- 画面の出し分け ----------
function showScreen(name) {
  app.dataset.screen = name;
  $('home').hidden = name !== 'home';
  $('stage').hidden = name !== 'stage';
  if (name === 'stage') resize();
}

function showLoading(on) { $('loading').hidden = !on; }
function loadStep(step) {
  $('loadBar').style.width = ['12%', '30%', '62%', '88%'][step] || '100%';
  $('loadStep').textContent = ['カメラを よびだしています', 'かおを みつける ぶひんを よみこんでいます', 'かおの モデルを じゅんびしています', 'きりぬきの モデルを じゅんびしています'][step] || '';
}

const ERRORS = {
  NotAllowedError: ['カメラを つかう きょかが ありません', 'ブラウザの「サイトの設定」で、カメラを「許可」にしてから もういちど おしてください。'],
  SecurityError: ['カメラを つかう きょかが ありません', 'ブラウザの「サイトの設定」で、カメラを「許可」にしてから もういちど おしてください。'],
  NotFoundError: ['カメラが みつかりません', 'カメラのない端末でも「しゃしんで あそぶ」は つかえます。'],
  OverconstrainedError: ['カメラが みつかりません', 'カメラのない端末でも「しゃしんで あそぶ」は つかえます。'],
  NotReadableError: ['カメラを よびだせませんでした', 'ほかのアプリが カメラを つかっていないか たしかめてください。'],
  InsecureError: ['この ページでは カメラが つかえません', 'https で はじまる アドレスで ひらいてください。'],
  UnsupportedError: ['この 画面では カメラが つかえません', 'Chrome などの ブラウザで ひらくか、「しゃしんで あそぶ」を ためしてください。'],
  ImageError: ['しゃしんを よみこめませんでした', 'べつの しゃしんで ためしてください。'],
  MLError: ['じゅんびが できませんでした', 'つうしんを たしかめて、もういちど おしてください。'],
};
function showError(e, kind) {
  const [title, text] = ERRORS[e && e.name] || ['うまく いきませんでした', 'もういちど ためしてください。'];
  $('errTitle').textContent = title; $('errText').textContent = text; $('errText').style.wordBreak = 'normal';
  $('errPhoto').hidden = kind === 'photo';
  $('error').hidden = false;
  if (DEBUG) console.warn('[error]', e);
}

let toastT = 0;
function toast(text) {
  const t = $('toast'); t.textContent = text; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2200);
}

function flash() { const f = $('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }

// ---------- なりきりの えらびかた ----------
function buildCats() {
  const nav = $('cats');
  for (const c of CATS) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = c.name; b.dataset.cat = c.id; b.setAttribute('role', 'tab');
    b.addEventListener('click', () => { sound.play('tick'); setCat(c.id, true); });
    nav.append(b);
  }
}

function setCat(id, pickFirst) {
  S.cat = id;
  for (const b of $('cats').children) b.setAttribute('aria-selected', String(b.dataset.cat === id));
  const box = $('items');
  box.textContent = '';
  for (const it of ITEMS.filter((x) => x.cat === id)) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'item'; b.dataset.id = it.id;
    const name = document.createElement('span'); name.textContent = it.name;
    b.append(thumbOf(it), name);
    b.addEventListener('click', () => selectItem(it, true));
    box.append(b);
  }
  if (pickFirst) selectItem(ITEMS.find((x) => x.cat === id), false); else markItem();
}

function markItem() {
  for (const b of $('items').children) b.setAttribute('aria-pressed', String(S.item && b.dataset.id === S.item.id));
}

function selectItem(it, click) {
  S.item = it; S.pickedAt = performance.now();
  engine.setItem(it);
  markItem();
  if (click) sound.play('pop');
}

// ---------- 映像のもと(カメラ / 写真) ----------
let frameToken = 0;
function stopStream() {
  frameToken++;
  if (S.stream) { S.stream.getTracks().forEach((t) => t.stop()); S.stream = null; }
  $('cam').srcObject = null;
}

// カメラから 新しいコマが届いたことを 知らせてもらう(同じコマを 二度 調べないため)
function watchFrames(v, src) {
  if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) return;
  const token = ++frameToken;
  src.rvfc = true; src.newFrame = true;
  const cb = () => { if (token !== frameToken) return; src.newFrame = true; v.requestVideoFrameCallback(cb); };
  v.requestVideoFrameCallback(cb);
}

async function startCamera(facing) {
  stopStream();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const e = new Error('camera api missing'); e.name = window.isSecureContext === false ? 'InsecureError' : 'UnsupportedError'; throw e;
  }
  const cam = (q.get('cam') || '1280x720').split('x').map(Number);   // 試験用に ?cam=720x1280 で指定できる
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: facing, width: { ideal: cam[0] }, height: { ideal: cam[1] } } });
  const v = $('cam');
  v.srcObject = stream;
  await v.play();
  if (!v.videoWidth) await new Promise((ok) => v.addEventListener('loadedmetadata', ok, { once: true }));
  S.stream = stream; S.facing = facing;
  const track = stream.getVideoTracks()[0], st = track && track.getSettings ? track.getSettings() : {};
  const mirror = st.facingMode ? st.facingMode === 'user' : facing === 'user';
  const src = { el: v, kind: 'video', w: v.videoWidth, h: v.videoHeight, mirror };
  engine.setSource(src);
  watchFrames(v, src);
  app.dataset.source = 'camera';
  $('flip').disabled = false;
  $('pick').setAttribute('aria-label', 'しゃしんを えらぶ');
}

function loadImage(file) {
  return new Promise((ok, ng) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); const e = new Error('bad image'); e.name = 'ImageError'; ng(e); };
    img.src = url;
  });
}

async function usePhoto(file) {
  const img = await loadImage(file);
  const k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = makeCanvas(Math.max(2, Math.round(img.naturalWidth * k)), Math.max(2, Math.round(img.naturalHeight * k)));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  stopStream();
  engine.setSource({ el: c, kind: 'photo', w: c.width, h: c.height, mirror: false });
  app.dataset.source = 'photo';
  $('flip').disabled = true;
  $('pick').setAttribute('aria-label', 'カメラに もどる');
}

function ensureML(prefer) {
  if (!S.ml) {
    // ?delegate=CPU で 顔の追跡も CPU に、?seg=GPU で 切り抜きを GPU に 切りかえられる(調べるとき用)
    S.ml = engine.tracker.init(prefer || q.get('delegate') || 'GPU', loadStep, q.get('seg') || 'CPU')
      .then(() => { S.mlReady = true; })
      .catch((e) => { S.ml = null; e.name = 'MLError'; throw e; });
  }
  return S.ml;
}

async function begin(kind, file) {
  S.lastKind = kind;
  sound.unlock();
  $('error').hidden = true;
  showScreen('stage');
  loadStep(0); showLoading(true);
  const ml = ensureML(); ml.catch(() => {});
  try {
    if (kind === 'camera') await startCamera(S.facing); else await usePhoto(file);
    await ml;
  } catch (e) { showLoading(false); showError(e, kind); return; }
  showLoading(false);
  run();
}

// ---------- 毎コマ ----------
const leonG = $('leon').getContext('2d'), leonBigG = $('leonBig').getContext('2d');
const INTRO_POSES = ['open', 'smile', 'brow', 'kiss', 'tilt'];

let wake = null;
async function keepAwake(on) {   // あそんでいる間は 画面を 消さない(使えない端末では 何もしない)
  try {
    if (on && !wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); }
    else if (!on && wake) { await wake.release(); wake = null; }
  } catch (e) { wake = null; }
}

function run() {
  if (S.running) return;
  S.running = true; S.lastNow = 0;
  S.raf = requestAnimationFrame(tick);
  keepAwake(true);
}
function pause() { S.running = false; cancelAnimationFrame(S.raf); keepAwake(false); }

function tick(now) {
  if (!S.running) return;
  S.raf = requestAnimationFrame(tick);
  const dt = S.lastNow ? Math.min(0.05, (now - S.lastNow) / 1000) : 0.016;
  S.lastNow = now;
  engine.frame(now);
  if (engine.tracker.broken && !S.cpuTried) {   // GPU で動かない端末は CPU に切りかえる
    S.cpuTried = true; S.ml = null; S.mlReady = false;
    engine.tracker.close();
    ensureML('CPU').catch((e) => showError(e));
  }
  const sb = engine.tracker.segBroken;
  if (sb !== S.segBroken) {   // 切り抜きが働かない映像では、背景を変えずに カメラをそのまま映す
    S.segBroken = sb;
    $('world').setAttribute('aria-pressed', String(!sb && engine.worldOn));
    if (sb && now - S.segToldAt > 30000) { S.segToldAt = now; toast(NO_WORLD); }
  }
  if (game.active) { game.update(dt); drawLeon(leonG, 216, game.pose.id, now / 1000); }
  else if (!$('gameIntro').hidden) drawLeon(leonBigG, 300, INTRO_POSES[Math.floor(now / 1900) % INTRO_POSES.length], now / 1000);
  updateHint(now);
  if (DEBUG) showFps(now);
}

function showFps(now) {
  S.fpsN++;
  if (now - S.fpsT < 500) return;
  const fps = (S.fpsN * 1000) / (now - S.fpsT); S.fpsT = now; S.fpsN = 0;
  const tk = engine.tracker, el = $('fps');
  el.hidden = false;
  el.textContent = `v${VERSION} ${fps.toFixed(0)}fps ${engine.W}x${engine.H} ${tk.delegate || '-'}\nface ${tk.stats.face.toFixed(0)}ms seg ${tk.stats.seg.toFixed(0)}ms/${engine.segEvery} ${tk.segDelegate || '-'} n=${engine.views.length}\nmask ${tk.segBroken ? 'x' : tk.hasMask ? 'ok' : '-'} ${tk.maskMax.toFixed(2)} q${engine.quality.toFixed(1)}`;
}

function overlayOpen() { return !$('sheet').hidden || !$('loading').hidden || !$('error').hidden; }

function updateHint(now) {
  let text = '';
  if (S.mode === 'play' && S.mlReady && engine.source && !overlayOpen()) {
    if (!engine.views.length) {
      if (!S.noFaceSince) S.noFaceSince = now;
      if (now - S.noFaceSince > 1200) text = 'おかおを うつしてね';
    } else {
      S.noFaceSince = 0;
      if (!engine.worldOn && engine.views[0].U > engine.W * (S.item.ride ? 0.36 : 0.48)) text = 'すこし はなれてみて';
      else if (now - S.lastTrig > 6000 && now - S.pickedAt > 1200) text = engine.source.kind === 'photo' ? 'がめんを タッチ してみて!' : 'おくちを あーん してみて!';
    }
  }
  if (text === S.hintText) return;
  S.hintText = text;
  const h = $('hint'); h.hidden = !text; h.textContent = text;
}

function resize() {
  const r = $('stage').getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return;
  engine.resize(r.width, r.height, window.devicePixelRatio || 1);
  measureSafe();
}

// 操作の部品に かくれる幅を はかって、構図と写真の切り出しに使う
function measureSafe() {
  const side = window.matchMedia('(orientation: landscape) and (max-height: 540px)').matches;
  const dock = document.querySelector('.dock'), top = document.querySelector('.top'), hud = $('hud');
  const game = S.mode === 'game';
  engine.safe.top = !hud.hidden ? hud.getBoundingClientRect().bottom : top.offsetHeight + 40;   // 40 = ヒントの ふきだしの分
  engine.safe.bottom = game || side ? 0 : dock.offsetHeight;
  engine.safe.right = !game && side ? dock.offsetWidth : 0;
}

// ---------- 写真 ----------
function openSheet(o) {
  if (S.blobUrl) URL.revokeObjectURL(S.blobUrl);
  S.blob = o.blob; S.blobName = o.name; S.blobUrl = URL.createObjectURL(o.blob); S.sheetGame = !!o.game;
  $('sheetTitle').textContent = o.title;
  $('shot').src = S.blobUrl;
  const st = $('stars');
  st.hidden = !o.game;
  if (o.game) { st.textContent = ''; st.append('★'.repeat(o.stars)); const rest = document.createElement('b'); rest.textContent = '★'.repeat(o.total - o.stars); st.append(rest); }
  $('again').textContent = o.game ? 'もういちど' : 'もどる';
  $('share').hidden = !canShare(o.blob, o.name);
  $('sheet').hidden = false;
}

async function shoot() {
  if (!engine.source || !engine.map || overlayOpen()) return;
  sound.play('shutter'); flash();
  const blob = await makePhoto(engine.snapshot(true));
  openSheet({ title: 'とれたよ!', blob, name: fileName() });
}

// ---------- まねっこ ----------
const game = new Game(engine, sound, {
  pose(p, i, n, text) {
    $('prompt').textContent = text;
    const dots = $('dots');
    if (dots.children.length !== n) { dots.textContent = ''; for (let k = 0; k < n; k++) dots.append(document.createElement('i')); }
    [...dots.children].forEach((d, k) => { if (k === i) d.className = 'now'; else if (k > i) d.className = ''; });
    sound.speak(text);
  },
  progress(v) { $('leon').parentElement.style.setProperty('--p', String(clamp(v))); },
  mark(i, ok) { const d = $('dots').children[i]; if (d) d.className = ok ? 'ok' : 'ng'; },
  async finish(stars, total, shots) {
    $('hud').hidden = true;
    const blob = await makeCollage(shots, stars, total);
    openSheet({ title: stars === total ? 'ぜんぶ できた!' : 'よく できました!', blob, name: fileName('manekko'), game: true, stars, total });
  },
});

function setMode(mode) {
  S.mode = mode; app.dataset.mode = mode; engine.quiet = mode === 'game';
  $('modePlay').setAttribute('aria-selected', String(mode === 'play'));
  $('modeGame').setAttribute('aria-selected', String(mode === 'game'));
  game.stop();
  $('hud').hidden = true;
  $('gameIntro').hidden = mode !== 'game';
  resize();
}

function startGame(ids) {
  $('gameIntro').hidden = true; $('hud').hidden = false; $('dots').textContent = '';
  game.start(ids);
  measureSafe();
}

// ---------- ボタン ----------
$('start').addEventListener('click', () => begin('camera'));
$('usePhoto').addEventListener('click', () => { sound.unlock(); $('file').click(); });
$('file').addEventListener('change', async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if (!file) return;
  if (app.dataset.screen === 'home' || !S.mlReady) { begin('photo', file); return; }
  try { await usePhoto(file); run(); } catch (e) { showError(e, 'photo'); }
});
$('errRetry').addEventListener('click', () => { $('error').hidden = true; if (S.lastKind === 'photo') $('file').click(); else begin('camera'); });
$('errPhoto').addEventListener('click', () => { $('error').hidden = true; $('file').click(); });
$('back').addEventListener('click', () => { pause(); stopStream(); setMode('play'); $('sheet').hidden = true; $('error').hidden = true; showLoading(false); showScreen('home'); });
$('modePlay').addEventListener('click', () => { sound.play('tick'); setMode('play'); });
$('modeGame').addEventListener('click', () => { sound.play('tick'); setMode('game'); });
$('gameStart').addEventListener('click', () => { sound.unlock(); startGame(); });
$('world').addEventListener('click', (ev) => {
  if (engine.tracker.segBroken) { toast(NO_WORLD); return; }
  const on = ev.currentTarget.getAttribute('aria-pressed') !== 'true';
  ev.currentTarget.setAttribute('aria-pressed', String(on));
  engine.setWorld(on); sound.play('tick');
  toast(on ? 'はいけい: へんしん' : 'はいけい: そのまま');
});
$('sound').addEventListener('click', (ev) => {
  const on = ev.currentTarget.getAttribute('aria-pressed') !== 'true';
  ev.currentTarget.setAttribute('aria-pressed', String(on));
  sound.setMuted(!on); if (on) sound.play('pop');
  if (!on && 'speechSynthesis' in window) window.speechSynthesis.cancel();
});
$('flip').addEventListener('click', async () => {
  if (app.dataset.source === 'photo') return;
  sound.play('tick');
  const next = S.facing === 'user' ? 'environment' : 'user';
  try { await startCamera(next); } catch (e) { try { await startCamera(S.facing); } catch (e2) { showError(e2, 'camera'); } toast('カメラを きりかえられませんでした'); }
});
$('pick').addEventListener('click', async () => {
  if (app.dataset.source === 'photo') { try { await startCamera(S.facing); } catch (e) { showError(e, 'camera'); } return; }
  $('file').click();
});
$('shutter').addEventListener('click', shoot);
$('view').addEventListener('pointerdown', () => { if (S.mode === 'play' && engine.poke()) S.lastTrig = performance.now(); });
$('again').addEventListener('click', () => { $('sheet').hidden = true; if (S.sheetGame) setMode('game'); });
$('save').addEventListener('click', async () => {
  if (!S.blob) return;
  const r = await saveBlob(S.blob, S.blobName);
  toast(r === 'download' ? 'ほぞんしました' : 'ほぞん できませんでした');
});
$('share').addEventListener('click', async () => {
  if (!S.blob) return;
  try { await shareBlob(S.blob, S.blobName); } catch (e) { if (e && e.name !== 'AbortError') toast('おくれませんでした'); }
});

engine.onTrigger = () => { S.lastTrig = performance.now(); };
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
  else if (app.dataset.screen === 'stage' && engine.source) run();
});

// ---------- はじまり ----------
$('ver').textContent = VERSION;
buildCats();
setCat('dino', false);
selectItem(itemById(q.get('item') || 'trex'), false);
if (S.item.cat !== S.cat) { setCat(S.item.cat, false); markItem(); }
for (const id of ['trex', 'rocket', 'lion', 'firefighter']) $('hero').append(renderThumb(itemById(id), 240, WORLDS[itemById(id).world]));
// キャンバスに書く ことばの文字を 先に読みこんでおく
if (document.fonts && document.fonts.load) {
  const words = ITEMS.map((it) => it.word || '').join('') + BRAND + 'できた!まねっこできたよ!つぎはきっと119あーんにっこりびっくりぎゅっチューこてんよこむきばあ★';
  document.fonts.load(`900 40px ${FONT}`, words).catch(() => {});
}
if (DEBUG) window.__nk = { engine, sound, game, S, selectItem, setCat, setMode, startGame, shoot, itemById, ITEMS, begin, usePhoto };
if (q.has('autostart')) begin('camera');
