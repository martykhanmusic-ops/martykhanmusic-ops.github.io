const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '＋ New project', exact: true }).click();
      await page.getByLabel('Project name', { exact: true }).fill('Appearance test');
      await page.getByRole('button', { name: 'Create project ↗', exact: true }).click();
      const before = await page.evaluate(() => localStorage.getItem('halo.workspace.v1'));
      await page.getByRole('button', { name: 'Appearance' }).click();
      await page.getByLabel('Classic').check();
      assert.equal(await page.locator('html').getAttribute('data-visual-package'), 'classic');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('html').getAttribute('data-visual-package'), 'orbital');
      assert.equal(await page.evaluate(() => localStorage.getItem('halo.visual-package.v1')), null);
      await page.getByRole('button', { name: 'Appearance' }).click();
      await page.getByLabel('Classic').check();
      await page.getByRole('button', { name: 'Apply appearance' }).click();
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('data-visual-package'), 'classic');
      await page.getByRole('button', { name: 'Appearance' }).click();
      await page.getByLabel('Orbital').check();
      await page.getByRole('button', { name: 'Apply appearance' }).click();
      assert.equal(await page.locator('html').getAttribute('data-visual-package'), 'orbital');
      assert.equal(await page.evaluate(() => localStorage.getItem('halo.workspace.v1')), before);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS visual package ${width}px: preview, Escape rollback, apply, reload, workspace preservation`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
