module.exports = async (t) => {
  await t.open('');
  await t.wait(800);
  await t.shot('home');
  await t.page.click('#start');
  await t.ready(1);
  await t.wait(2500);
  await t.shot('trex');
  console.log(JSON.stringify(await t.ev(`(() => { const e = __nk.engine, v = e.views[0]; return { W: e.W, H: e.H, n: e.views.length, U: Math.round(v.U), cx: Math.round(v.cx), cy: Math.round(v.cy), roll: +v.roll.toFixed(2), jaw: +v.jaw.toFixed(2), smile: +v.smile.toFixed(2), mask: e.tracker.hasMask, delegate: e.tracker.delegate, face: Math.round(e.tracker.stats.face), seg: Math.round(e.tracker.stats.seg), src: [e.source.w, e.source.h], mirror: e.mirror }; })()`)));
};
