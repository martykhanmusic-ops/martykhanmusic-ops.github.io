const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

async function startCompanion(args = []) {
  const child = spawn(process.execPath, ['companion/server.mjs', ...args], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
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
        await page.locator('#companion-pair input').fill(companion.code);
        await page.getByRole('button', { name: 'Pair', exact: true }).click();
        await page.getByText(/Connected · verified/).waitFor();
        assert.match(await page.locator('#companion-device').innerText(), /Windows/);
        const nextCode = new Promise(resolve => companion.child.stdout.once('data', chunk => resolve(String(chunk).match(/New pairing code: (\d{6})/)[1])));
        await page.getByRole('button', { name: 'Revoke pairing' }).click();
        await page.getByText('Revoked', { exact: true }).waitFor();
        assert.equal(await page.evaluate(() => localStorage.getItem('halo.workspace.v1')), before);
        await page.locator('#companion-pair input').fill(companion.code);
        await page.getByRole('button', { name: 'Pair', exact: true }).click();
        await page.getByText(/Pairing failed/).waitFor();
        await page.locator('#companion-pair input').fill(await nextCode);
        await page.getByRole('button', { name: 'Pair', exact: true }).click();
        await page.getByText(/Connected · verified/).waitFor();
        companion.child.kill();
        await new Promise(resolve => companion.child.once('exit', resolve));
        await page.getByRole('button', { name: 'Refresh status' }).click();
        await page.getByText(/Unavailable/).waitFor();
      } finally { companion.child.kill(); }
      await context.close();
      console.log(`PASS companion browser ${width}px: pair, verified status, revoke, stale code denied, reconnect, unavailable recovery, workspace unchanged`);
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:4173/halo/');
    const companion = await startCompanion(['--root', path.join(root, 'docs'), '--app', 'File Explorer.lnk', '--processes', '--audio']);
    try {
      await page.locator('#companion-pair input').fill(companion.code);
      await page.getByRole('button', { name: 'Pair', exact: true }).click();
      await page.getByText(/Connected · verified/).waitFor();
      await page.getByRole('button', { name: 'Process status' }).click();
      await page.getByText(/ProcessName/).waitFor();
      await page.getByRole('button', { name: 'Audio devices' }).click();
      await page.getByText(/devices/).waitFor();
      await page.getByRole('button', { name: 'List files' }).click();
      await page.getByText(/HALO_LOCAL_BRIDGE.md/).waitFor();
      await page.getByRole('button', { name: 'Discover applications' }).click();
      await page.locator('#companion-app-list option').first().waitFor({ state: 'attached' });
      assert.ok(await page.locator('#companion-app-list option').count() >= 1);
      await page.getByText('Permissions and audit').click();
      await page.getByRole('button', { name: 'Remove processes access' }).click();
      await page.getByRole('button', { name: 'Process status' }).waitFor({ state: 'hidden' });
      assert.equal(await page.getByRole('button', { name: 'Process status' }).isHidden(), true);
      console.log('PASS companion browser grants: live operations, scoped removal and UI state');
    } finally { companion.child.kill(); await context.close(); }
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
