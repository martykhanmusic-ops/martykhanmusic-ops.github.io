const { chromium } = require('playwright');
const { existsSync } = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto((process.env.HALO_TEST_URL || 'http://localhost:4174') + '/halo/');
    await page.getByLabel('Search term').fill('Prince');
    for (const kind of ['artists', 'recordings', 'releases']) {
      await page.getByLabel('Search type').selectOption(kind);
      await page.getByRole('button', { name: 'Search music' }).click();
      await page.getByText(new RegExp(`${kind} found\\. Reference only`)).waitFor({ timeout: 20000 });
      assert.ok(await page.locator('#music-results .artist-row').count() > 0);
      await page.waitForTimeout(1300);
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('halo.workspace.v1')), null);
    assert.deepEqual(errors, []);
    console.log('PASS live MusicBrainz artist, recording and release lookup through packaged Halo launcher');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
