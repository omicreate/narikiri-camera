// カメラを 許可しなかったときの 画面を確かめる
const { chromium } = require('playwright');
const path = require('path');
const { start } = require('./serve.cjs');
(async () => {
  const out = process.argv[2];
  const server = await start(8771, path.join(__dirname, '..'));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true, args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--deny-permission-prompts'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
  await page.goto('http://127.0.0.1:8771/index.html?debug=1&delegate=CPU');
  await page.click('#start');
  await page.waitForSelector('#error:not([hidden])', { timeout: 20000 });
  await page.waitForTimeout(400);
  console.log(JSON.stringify(await page.evaluate(`({ title: document.getElementById('errTitle').textContent, text: document.getElementById('errText').textContent, loading: document.getElementById('loading').hidden })`)));
  await page.screenshot({ path: out });
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
