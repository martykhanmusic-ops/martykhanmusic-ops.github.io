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
    await page.getByLabel('Artist name').fill('Prince');
    await page.getByRole('button', { name: 'Search artists' }).click();
    await page.getByText(/artist matches\. Reference only/).waitFor({ timeout: 20000 });
    assert.ok(await page.locator('#artist-results .artist-row').count() > 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('halo.workspace.v1')), null);
    assert.deepEqual(errors, []);
    console.log('PASS live MusicBrainz artist lookup through packaged Halo launcher');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
