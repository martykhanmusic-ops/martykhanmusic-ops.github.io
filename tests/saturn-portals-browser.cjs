const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/?world=1');
    await page.getByRole('button', { name: '＋ New project', exact: true }).click();
    await page.locator('#project-form input[name=name]').fill('Saturn project');
    await page.locator('#project-form button.primary').click();
    await page.locator('nav [data-view="jarvis"]').click();
    const ring = page.getByRole('navigation', { name: 'Saturn portals' });
    assert.equal(await ring.locator('.saturn-portal').count(), 8);
    await ring.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await ring.locator('[aria-pressed="true"]').getAttribute('data-portal'), 'music');
    await page.keyboard.press('Enter');
    await page.getByText(/Music Shelf is planned/).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).view), 'jarvis');
    await ring.locator('[data-portal="projects"]').click();
    await page.getByLabel('Working notes').waitFor();
    await page.getByRole('button', { name: 'Enter Halo World' }).click();
    await page.waitForFunction(() => document.body.dataset.mode === 'world');
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => document.querySelector('.world-root')?.dataset.nearby === 'more');
    await page.keyboard.up('KeyD');
    await page.keyboard.press('KeyE');
    await page.getByText(/This portal is planned; no application has opened/).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).view), 'project');
    await page.getByRole('button', { name: 'Back to plaza' }).click();
    await page.getByRole('button', { name: 'Return to Desktop' }).click();
    assert.deepEqual(errors, []);
    await page.close();
    console.log('PASS Saturn portals: shared eight-entry ring, keyboard selection, honest planned status, real Projects route, World planned doorway');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
