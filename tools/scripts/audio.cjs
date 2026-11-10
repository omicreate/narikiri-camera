// 効果音が 例外なく鳴り、信号が出ているかを はかる(耳での確認の代わり)
module.exports = async (t) => {
  await t.open('');
  await t.page.click('#start');
  await t.ready(1);
  const res = await t.ev(`(async () => {
    const s = __nk.sound, ctx = s.ctx;
    const an = ctx.createAnalyser(); an.fftSize = 2048; s.master.connect(an);
    const buf = new Float32Array(an.fftSize);
    const names = ['roar','fire','siren','whistle','chug','rocket','boing','pop','munch','shutter','success','fanfare','star','stomp','water','beep','call','tick','soft'];
    const out = { state: ctx.state };
    for (const n of names) {
      s.last = {};
      const ok = s.play(n);
      let peak = 0; const t0 = performance.now();
      while (performance.now() - t0 < 420) { an.getFloatTimeDomainData(buf); for (let i = 0; i < buf.length; i += 4) peak = Math.max(peak, Math.abs(buf[i])); await new Promise((r) => setTimeout(r, 30)); }
      out[n] = [ok, +peak.toFixed(3)];
      await new Promise((r) => setTimeout(r, n === 'fanfare' || n === 'siren' || n === 'rocket' ? 1500 : 500));
    }
    try { s.speak('おくちを あーん!'); out.speak = 'called'; } catch (e) { out.speak = String(e); }
    return out;
  })()`);
  console.log(JSON.stringify(res));
};
