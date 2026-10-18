const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/?world=1');
    await page.getByRole('button', { name: 'Enter Halo World' }).click();
    await page.waitForFunction(() => document.body.dataset.mode === 'world');
    assert.equal(await page.getByRole('button', { name: 'Talk to Jarvis' }).count(), 1);
    await page.keyboard.down('KeyW');
    await page.waitForFunction(() => document.querySelector('.world-root')?.dataset.nearby === 'jarvis');
    await page.keyboard.up('KeyW');
    assert.match(await page.locator('#world-prompt').textContent(), /Jarvis · Press E/);
    assert.equal(await page.getByRole('button', { name: 'Talk to Jarvis' }).getAttribute('data-state'), 'nearby');
    await page.keyboard.press('KeyE');
    await page.getByRole('heading', { name: 'Talk to Jarvis.' }).waitFor();
    assert.equal(await page.locator('.world-root').count(), 0);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).view), 'jarvis');
    await page.getByRole('button', { name: 'Enter Halo World' }).click();
    await page.waitForFunction(() => document.body.dataset.mode === 'world');
    await page.getByRole('button', { name: 'Talk to Jarvis' }).click();
    await page.getByRole('heading', { name: 'Talk to Jarvis.' }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).jobs.length), 0);
    assert.deepEqual(errors, []);
    await page.close();
    console.log('PASS World Jarvis: central orb, proximity/E and click open one real Jarvis session without a job');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
