// アプリを 疑似カメラつきの ヘッドレスChromeで動かす試験台
// 使い方: node tools/run_app.cjs <scene> <script.cjs> [outDir] [dsf]
// BASE_URL=https://.../ を渡すと、手元のフォルダの代わりに 公開ページを開いて試す
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const { start } = require('./serve.cjs');

(async () => {
  const [scene, scriptFile, outDir = '/tmp', dsf = '1'] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const video = path.join(__dirname, '../testdata/scenes', scene + '.mjpeg');
  const base = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/?$/, '/') : 'http://127.0.0.1:8768/';
  const server = process.env.BASE_URL ? null : await start(8768, path.join(__dirname, '..'));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined, headless: true,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=' + video, '--autoplay-policy=no-user-gesture-required'],
  });
  const rec = process.env.VIDEO_DIR ? { recordVideo: { dir: process.env.VIDEO_DIR, size: { width: 412, height: 892 } } } : {};
  const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: +dsf, permissions: ['camera'], hasTouch: true, isMobile: true, ...rec });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/favicon|404|XNNPACK|^INFO/.test(t)) { errors.push(t); console.log('[console.error]', t.slice(0, 300)); } });
  page.on('pageerror', (e) => { errors.push(String(e)); console.log('[pageerror]', String(e.stack || e).slice(0, 700)); });
  page.on('requestfailed', (r) => console.log('[requestfailed]', r.url().slice(-80)));
  const api = {
    page, errors, outDir,
    open: async (query = '') => {
      await page.goto(base + 'index.html?debug=1&delegate=' + (process.env.DELEGATE || 'CPU') + '&cam=720x1280' + query);
    },
    ready: async (faces = 1, timeout = 90000) => {
      await page.waitForFunction((n) => window.__nk && window.__nk.S.mlReady && window.__nk.engine.views.length >= n, faces, { timeout });
    },
    ev: (js) => page.evaluate(js),
    wait: (ms) => page.waitForTimeout(ms),
    shot: async (name) => { const p = path.join(outDir, name + '.png'); await page.screenshot({ path: p }); return p; },
  };
  try { await require(path.resolve(scriptFile))(api); } catch (e) { console.log('[script error]', String(e.stack || e).slice(0, 900)); await api.shot('script_error').catch(() => {}); }
  console.log('errors:', errors.length);
  await ctx.close();
  await browser.close(); if (server) server.close();
})().catch((e) => { console.error(e); process.exit(1); });
