const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

async function startCompanion() {
  const child = spawn(process.execPath, ['companion/server.mjs'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const code = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Companion start timed out')), 5000);
    child.stdout.on('data', chunk => {
      const match = String(chunk).match(/Pairing code: (\d{6})/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
    child.on('error', reject);
    child.on('exit', status => reject(new Error(`Companion exited ${status}`)));
  });
  return { child, code };
}

(async () => {
  if (process.platform !== 'win32') return console.log('SKIP companion browser: Windows required');
  const server = http.createServer(async (req, res) => {
    try {
      let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
      if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      await page.goto('http://localhost:4173/halo/');
      await assert.doesNotReject(() => page.getByText('Disconnected', { exact: true }).waitFor());
      const before = await page.evaluate(() => localStorage.getItem('halo.workspace.v1'));
      let companion = await startCompanion();
      try {
        await page.getByLabel('Code from companion window', { exact: true }).fill(companion.code);
        await page.getByRole('button', { name: 'Pair', exact: true }).click();
        await page.getByText(/Connected · verified/).waitFor();
        assert.match(await page.locator('#companion-device').innerText(), /Windows/);
        await page.getByRole('button', { name: 'Revoke pairing' }).click();
        await page.getByText('Revoked', { exact: true }).waitFor();
        assert.equal(await page.evaluate(() => localStorage.getItem('halo.workspace.v1')), before);
        await page.getByLabel('Code from companion window', { exact: true }).fill(companion.code);
        await page.getByRole('button', { name: 'Pair', exact: true }).click();
        await page.getByText(/Pairing failed/).waitFor();
      } finally { companion.child.kill(); }
      await context.close();
      console.log(`PASS companion browser ${width}px: pair, verified status, revoke, stale code denied, workspace unchanged`);
    }
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
