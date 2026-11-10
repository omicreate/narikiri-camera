// はしの場合: はじめの画面から写真で始める / よこ向き / 大きい画面
const path = require('path');
module.exports = async (t) => {
  const log = (k, v) => console.log(k + ': ' + JSON.stringify(v));
  await t.open('');
  await t.page.setInputFiles('#file', path.join(__dirname, '../../testdata/scenes/duo2.png'));
  await t.page.waitForFunction(() => window.__nk.S.mlReady && window.__nk.engine.views.length >= 2, null, { timeout: 90000 });
  await t.ev(`__nk.selectItem(__nk.itemById('firefighter'), false)`); await t.wait(1800);
  await t.shot('g1_home_photo_firefighter');
  await t.page.touchscreen.tap(206, 250); await t.wait(600);
  await t.shot('g2_photo_tap');
  await t.ev(`__nk.selectItem(__nk.itemById('chef'), false)`); await t.wait(1500);
  await t.shot('g3_photo_chef');
  log('photoStart', await t.ev(`({ kind: __nk.engine.source.kind, n: __nk.engine.views.length, alpha: __nk.engine.views.map(v => v.alpha), tracks: __nk.engine.tracker.tracks.length })`));
  // よこ向き
  await t.page.setViewportSize({ width: 892, height: 412 }); await t.wait(1500);
  await t.ev(`__nk.selectItem(__nk.itemById('lion'), false)`); await t.wait(1500);
  await t.shot('g4_landscape');
  log('landscape', await t.ev(`({ W: __nk.engine.W, H: __nk.engine.H, safe: __nk.engine.safe })`));
  // 大きい画面(パソコン)
  await t.page.setViewportSize({ width: 1280, height: 800 }); await t.wait(1500);
  await t.ev(`__nk.selectItem(__nk.itemById('train'), false)`); await t.wait(1500);
  await t.shot('g5_desktop');
  log('desktop', await t.ev(`({ W: __nk.engine.W, H: __nk.engine.H, safe: __nk.engine.safe })`));
};
