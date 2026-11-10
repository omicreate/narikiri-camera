// 紹介用の録画: はじめの画面 → なりきりを順に → まねっこ
module.exports = async (t) => {
  const pick = async (id, hold = 1300, open = 1500) => {
    await t.ev(`(() => { const it = __nk.itemById('${id}'); __nk.setCat(it.cat, false); __nk.selectItem(it, true); })()`);
    await t.wait(hold);
    if (open) { await t.ev(`__nk.engine.override = { open: 1 }`); await t.wait(open); await t.ev(`__nk.engine.override = null`); await t.wait(500); }
  };
  await t.open('');
  await t.wait(1600);
  await t.page.click('#start');
  await t.ready(2);
  await t.ev(`(() => { document.getElementById('fps').style.display = 'none'; __nk.engine.segEvery = 2; __nk.sound.setMuted(true); })()`);
  await t.wait(1200);
  for (const id of ['trex', 'lion', 'panda', 'brachio', 'firetruck', 'train', 'rocket', 'firefighter', 'chef', 'astronaut']) await pick(id);
  await t.page.click('#modeGame');
  await t.wait(1800);
  await t.ev(`__nk.startGame(['open', 'smile'])`);
  for (const [id, ov] of [['open', '{ open: 1 }'], ['smile', '{ smile: 0.9 }']]) {
    await t.page.waitForFunction((x) => window.__nk.game.pose && window.__nk.game.pose.id === x && window.__nk.game.phase === 'show', id, { timeout: 15000 });
    await t.wait(1300);
    await t.ev(`__nk.engine.override = ${ov}`);
    await t.page.waitForFunction(() => window.__nk.game.phase === 'done', null, { timeout: 8000 });
    await t.ev(`__nk.engine.override = null`);
  }
  await t.page.waitForSelector('#sheet:not([hidden])', { timeout: 20000 });
  await t.wait(2500);
};
