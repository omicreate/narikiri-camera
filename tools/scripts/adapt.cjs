// 本番と同じ「重いときは自動で軽くする」動きを入れたまま 走らせて、人物が映りつづけるかを見る
module.exports = async (t) => {
  await t.open('&autostart=1');
  await t.ready(2); await t.wait(800);
  await t.ev(`__nk.engine.adaptive = true`);
  for (let i = 0; i < 9; i++) {
    await t.wait(5000);
    console.log('t' + (i + 1) * 5 + ': ' + JSON.stringify(await t.ev(`(() => { const e = __nk.engine, k = e.tracker; return { segEvery: e.segEvery, q: +e.quality.toFixed(2), W: e.W, H: e.H, hasMask: k.hasMask, maskAgeMs: Math.round(performance.now() - k.maskAt), mx: +k.maskMax.toFixed(2), n: e.views.length, fms: Math.round(e.frameMs), broken: k.segBroken }; })()`)));
    if (i === 3 || i === 8) await t.shot('adapt_' + (i + 1) * 5);
  }
};
