// 全なりきりを 順に着せて撮る。ITEMS=trex,lion のように絞れる。OPEN=1 で口をあけた状態も撮る
module.exports = async (t) => {
  await t.open('&autostart=1');
  await t.ready(+(process.env.FACES || 1));
  await t.wait(1500);
  const ids = (process.env.ITEMS || 'trex,tricera,brachio,lion,rabbit,panda,firetruck,train,rocket,firefighter,chef,astronaut').split(',');
  for (const id of ids) {
    await t.ev(`(() => { const it = __nk.itemById('${id}'); __nk.setCat(it.cat, false); __nk.selectItem(it, false); __nk.engine.override = null; })()`);
    await t.wait(+(process.env.WAIT || 1600));
    await t.shot(id);
    if (process.env.OPEN) {
      await t.ev(`__nk.engine.override = { open: 1 }`);
      await t.wait(+(process.env.OWAIT || 900));
      await t.shot(id + '_open');
      await t.ev(`__nk.engine.override = null`);
      await t.wait(300);
    }
  }
  console.log(JSON.stringify(await t.ev(`(() => { const e = __nk.engine; return { W: e.W, H: e.H, n: e.views.length, src: [e.source.w, e.source.h], fms: Math.round(e.frameMs), face: Math.round(e.tracker.stats.face), seg: Math.round(e.tracker.stats.seg) }; })()`)));
};
