// 見た目の確認用: 場面ごとに 指定の なりきりを 口をあけた状態と ふつうの状態で撮る
module.exports = async (t) => {
  await t.open('&autostart=1');
  await t.ready(+(process.env.FACES || 1));
  await t.ev(`document.getElementById('fps').style.display = 'none'`);
  await t.wait(1500);
  for (const spec of (process.env.SPEC || 'trex:1').split(',')) {
    const [id, open] = spec.split(':');
    await t.ev(`(() => { const it = __nk.itemById('${id}'); __nk.setCat(it.cat, false); __nk.selectItem(it, false); __nk.engine.override = null; })()`);
    await t.wait(1700);
    if (open === '1') { await t.ev(`__nk.engine.override = { open: 1 }`); await t.wait(+(process.env.OWAIT || 700)); }
    await t.shot((process.env.PREFIX || '') + id + (open === '1' ? '_open' : ''));
    await t.ev(`__nk.engine.override = null`);
    await t.wait(350);
  }
  console.log(JSON.stringify(await t.ev(`(() => { const e = __nk.engine; return { W: e.W, H: e.H, n: e.views.length, fms: Math.round(e.frameMs) }; })()`)));
};
