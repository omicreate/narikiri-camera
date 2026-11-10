// スマホの一部の GPU と同じく「切り抜き結果の読み戻し(RED/FLOAT)が空で返る」状況をまねて、画面がどうなるかを見る
// 使い方: DELEGATE=GPU node tools/run_app.cjs duo tools/scripts/sim_readback.cjs out/sim
//   既定(切り抜き=CPU)なら 人物が映る。 Q='&seg=GPU' WAIT=16000 を足すと 切り抜きも GPU になり、安全網(カメラをそのまま映す)が働く。
module.exports = async (t) => {
  if (!process.env.NOSIM) await t.page.addInitScript(() => {
    const P = WebGL2RenderingContext.prototype, orig = P.readPixels;
    window.__blocked = 0;
    P.readPixels = function (x, y, w, h, format, type, ...rest) {
      if (format === 0x1903 && type === 0x1406) { window.__blocked++; return; }   // RED / FLOAT
      return orig.call(this, x, y, w, h, format, type, ...rest);
    };
  });
  await t.open('&autostart=1' + (process.env.Q || ''));
  await t.ready(+(process.env.FACES || 1)); await t.wait(+(process.env.WAIT || 3500));
  await t.shot(process.env.NAME || 'sim');
  console.log(JSON.stringify(await t.ev(`(() => { const e = __nk.engine, k = e.tracker; return { blocked: window.__blocked, hasMask: k.hasMask, delegate: k.delegate, segDelegate: k.segDelegate, segBroken: k.segBroken, maskMax: k.maskMax, n: e.views.length, segEvery: e.segEvery, fms: Math.round(e.frameMs), seg: Math.round(k.stats.seg), face: Math.round(k.stats.face) }; })()`)));
};
