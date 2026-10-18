const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs', 'previews', 'current');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});

(async () => {
  await fs.mkdir(output, { recursive: true });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${server.address().port}/halo/`);
    await page.getByRole('button', { name: '＋ New project', exact: true }).click();
    await page.getByLabel('Project name', { exact: true }).fill('Midnight Sessions');
    await page.getByLabel('Description', { exact: true }).fill('Demo project for this screenshot');
    await page.getByRole('button', { name: 'Create project ↗', exact: true }).click();
    await page.getByRole('button', { name: '← All projects', exact: true }).click();
    await page.reload();
    await page.screenshot({ path: path.join(output, 'halo-overview.png'), fullPage: true });
    await page.getByRole('button', { name: 'Open Jarvis portal', exact: true }).click();
    await page.screenshot({ path: path.join(output, 'halo-jarvis.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: '◉ Overview', exact: true }).click();
    await page.screenshot({ path: path.join(output, 'halo-mobile.png'), fullPage: true });
    await page.close();
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
