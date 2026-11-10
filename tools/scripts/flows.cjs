
// 背景オフ / 撮影 / まねっこ / 写真モード / タップ の通し試験
const fs = require('fs'), path = require('path');
module.exports = async (t) => {
  const log = (k, v) => console.log(k + ': ' + JSON.stringify(v));
  await t.open('');
  await t.page.click('#start');
  await t.ready(1);
  await t.wait(1200);

  // 1) 背景オフ(カメラの映像そのまま)
  await t.page.click('#world');
  await t.wait(900);
  await t.shot('f1_world_off_trex');
  await t.ev(`__nk.selectItem(__nk.itemById('firetruck'), false)`); await t.wait(900);
  await t.shot('f2_world_off_firetruck');
  await t.ev(`__nk.selectItem(__nk.itemById('chef'), false)`); await t.wait(900);
  await t.shot('f3_world_off_chef');
  log('hint', await t.ev(`document.getElementById('hint').textContent`));
  await t.page.click('#world');
  await t.wait(1200);

  // 2) タップで うごく
  await t.ev(`__nk.selectItem(__nk.itemById('trex'), false)`); await t.wait(700);
  await t.page.touchscreen.tap(206, 300);
  await t.wait(450);
  await t.shot('f4_tap_trex');
  log('afterTap', await t.ev(`({ open: +__nk.engine.views[0].open.toFixed(2), fx: __nk.engine.fx.list.length })`));
  await t.wait(1500);

  // 3) 撮影 → 写真の板 → 保存
  await t.ev(`__nk.selectItem(__nk.itemById('rocket'), false)`); await t.wait(1500);
  await t.page.click('#shutter');
  await t.page.waitForSelector('#sheet:not([hidden])', { timeout: 8000 });
  await t.wait(500);
  await t.shot('f5_sheet');
  const info = await t.ev(`(async () => { const b = __nk.S.blob; const img = await createImageBitmap(b); return { type: b.type, size: b.size, w: img.width, h: img.height, name: __nk.S.blobName, share: !document.getElementById('share').hidden }; })()`);
  log('photo', info);
  const b64 = await t.ev(`(async () => { const buf = await __nk.S.blob.arrayBuffer(); let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); })()`);
  fs.writeFileSync(path.join(t.outDir, 'f5_photo.jpg'), Buffer.from(b64, 'base64'));
  const dl = t.page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await t.page.click('#save');
  const d = await dl;
  log('download', d ? d.suggestedFilename() : null);
  await t.wait(300);
  await t.page.click('#again');

  // 4) まねっこ(表情の値を上書きして 5つ通す)
  await t.page.click('#modeGame');
  await t.wait(700);
  await t.shot('f6_game_intro');
  await t.ev(`__nk.startGame(['open','smile','brow','tilt','peek'])`);
  await t.wait(600);
  await t.shot('f7_game_pose1');
  const steps = [['open', '{ open: 1 }'], ['smile', '{ smile: 0.9 }'], ['brow', '{ brow: 0.9 }'], ['tilt', '{ roll: 0.5 }']];
  for (const [id, ov] of steps) {
    await t.page.waitForFunction((x) => window.__nk.game.pose && window.__nk.game.pose.id === x && window.__nk.game.phase === 'show', id, { timeout: 15000 });
    await t.wait(350);
    if (id === 'brow') await t.shot('f8_game_pose3');
    await t.ev(`__nk.engine.override = ${ov}`);
    await t.page.waitForFunction(() => window.__nk.game.phase === 'done', null, { timeout: 8000 });
    if (id === 'open') { await t.wait(250); await t.shot('f9_game_success'); }
    await t.ev(`__nk.engine.override = null`);
  }
  // いないいないばあ: 顔を かくす = 追跡を 止める
  await t.page.waitForFunction(() => window.__nk.game.pose.id === 'peek' && window.__nk.game.phase === 'show', null, { timeout: 15000 });
  await t.ev(`(() => { const tk = __nk.engine.tracker; tk._detect = tk.detect; tk.detect = () => {}; })()`);
  await t.wait(1500);
  log('peekText', await t.ev(`document.getElementById('prompt').textContent`));
  await t.shot('f10_game_peek');
  await t.ev(`(() => { const tk = __nk.engine.tracker; tk.detect = tk._detect; })()`);
  await t.page.waitForSelector('#sheet:not([hidden])', { timeout: 20000 });
  await t.wait(600);
  await t.shot('f11_game_result');
  log('game', await t.ev(`({ stars: __nk.game.stars, shots: __nk.game.shots.length, title: document.getElementById('sheetTitle').textContent })`));
  const c64 = await t.ev(`(async () => { const buf = await __nk.S.blob.arrayBuffer(); let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); })()`);
  fs.writeFileSync(path.join(t.outDir, 'f11_collage.jpg'), Buffer.from(c64, 'base64'));
  await t.page.click('#again');
  await t.wait(400);
  await t.page.click('#modePlay');
  await t.wait(600);

  // 5) 写真モード
  await t.page.setInputFiles('#file', path.join(__dirname, '../../testdata/scenes/kid.png'));
  await t.wait(2500);
  await t.ev(`__nk.selectItem(__nk.itemById('lion'), false)`); await t.wait(1500);
  await t.shot('f12_photo_mode');
  log('photoMode', await t.ev(`({ kind: __nk.engine.source.kind, n: __nk.engine.views.length, source: document.getElementById('app').dataset.source, hint: document.getElementById('hint').textContent })`));
  await t.page.click('#pick');   // カメラに もどる
  await t.wait(1500);
  log('backToCam', await t.ev(`({ kind: __nk.engine.source.kind, n: __nk.engine.views.length })`));
  // 6) もどる
  await t.page.click('#back');
  await t.wait(400);
  log('home', await t.ev(`({ screen: document.getElementById('app').dataset.screen, stream: !!__nk.S.stream, running: __nk.S.running })`));
};
