// 汎用スクリーンショット: node tools/shot.cjs <url-path> <out.png> [width] [height] [waitExpr]
const { chromium } = require('playwright');
const path = require('path');
const { start } = require('./serve.cjs');
(async () => {
  const [urlPath, out, w = '1200', h = '900', waitExpr = 'window.__done === true'] = process.argv.slice(2);
  const server = await start(8766, path.join(__dirname, '..'));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 400)); });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e.stack || e).slice(0, 800)));
  await page.goto('http://127.0.0.1:8766/' + urlPath);
  await page.waitForFunction(waitExpr, null, { timeout: 60000 }).catch((e) => console.log('wait timeout'));
  await page.screenshot({ path: out, fullPage: true });
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
