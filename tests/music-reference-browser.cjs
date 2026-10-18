const { chromium } = require('playwright');
const { existsSync } = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/public-data/artists?name=*', route => {
        assert.equal(new URL(route.request().url()).searchParams.get('name'), '<Artist>');
        route.fulfill({ json: { artists: [{ id: '0383dadf-2a4e-4d10-a46a-e9e041da8eb3', name: '<Artist>', type: 'Person', country: 'US' }] } });
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByLabel('Artist name').fill('<Artist>');
      await page.getByRole('button', { name: 'Search artists' }).click();
      await page.getByText('1 artist matches.').waitFor();
      assert.equal(await page.locator('#artist-results script').count(), 0);
      assert.equal(await page.locator('#artist-results a').textContent(), '<Artist>');
      assert.equal(await page.locator('#artist-results a').getAttribute('href'), 'https://musicbrainz.org/artist/0383dadf-2a4e-4d10-a46a-e9e041da8eb3');
      assert.equal(await page.evaluate(() => localStorage.getItem('halo.workspace.v1')), null);
      await page.unroute('**/public-data/artists?name=*');
      await page.route('**/public-data/artists?name=*', route => route.fulfill({ status: 503, body: 'unavailable' }));
      await page.getByRole('button', { name: 'Search artists' }).click();
      await page.getByText('MusicBrainz is unavailable.').waitFor();
      assert.equal(await page.locator('#artist-results a').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS music reference ${width}px: safe result, no store effect, unavailable state`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
