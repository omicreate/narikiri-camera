// ページが window.__out に入れた画像(dataURL)を ファイルに書き出す: node tools/dump.cjs <url-path> <outDir>
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const { start } = require('./serve.cjs');
(async () => {
  const [urlPath, outDir] = process.argv.slice(2);
  const server = await start(8769, path.join(__dirname, '..'));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 400 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e.stack || e).slice(0, 600)));
  await page.goto('http://127.0.0.1:8769/' + urlPath);
  await page.waitForFunction('window.__done === true', null, { timeout: 60000 });
  const out = await page.evaluate('window.__out');
  for (const [k, v] of Object.entries(out)) fs.writeFileSync(path.join(outDir, k), Buffer.from(v.split(',')[1], 'base64'));
  console.log(Object.keys(out).join(' '));
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
