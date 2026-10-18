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
      await page.route('**/public-data/*?name=*', route => {
        const url = new URL(route.request().url());
        assert.equal(url.searchParams.get('name'), '<Artist>');
        const kind = url.pathname.split('/').at(-1);
        route.fulfill({ json: kind === 'artists' ? { artists: [{ id: '0383dadf-2a4e-4d10-a46a-e9e041da8eb3', name: '<Artist>', type: 'Person', country: 'US' }] } : kind === 'recordings' ? { recordings: [{ id: '0383dadf-2a4e-4d10-a46a-e9e041da8eb3', title: '<Song>', 'artist-credit': [{ name: 'Singer' }] }] } : { 'release-groups': [{ id: '0383dadf-2a4e-4d10-a46a-e9e041da8eb3', title: '<Album>', 'primary-type': 'Album' }] } });
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByLabel('Search term').fill('<Artist>');
      for (const [kind, title, path] of [['artists','<Artist>','artist'],['recordings','<Song>','recording'],['releases','<Album>','release-group']]) {
        await page.getByLabel('Search type').selectOption(kind);
        await page.getByRole('button', { name: 'Search music' }).click();
        await page.getByText(`1 ${kind} found.`).waitFor();
        assert.equal(await page.locator('#music-results script').count(), 0);
        assert.equal(await page.locator('#music-results a').textContent(), title);
        assert.equal(await page.locator('#music-results a').getAttribute('href'), `https://musicbrainz.org/${path}/0383dadf-2a4e-4d10-a46a-e9e041da8eb3`);
      }
      assert.equal(await page.evaluate(() => localStorage.getItem('halo.workspace.v1')), null);
      await page.unroute('**/public-data/*?name=*');
      await page.route('**/public-data/*?name=*', route => route.fulfill({ status: 503, body: 'unavailable' }));
      await page.getByRole('button', { name: 'Search music' }).click();
      await page.getByText('MusicBrainz is unavailable.').waitFor();
      assert.equal(await page.locator('#music-results a').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS music reference ${width}px: artists/recordings/releases, no store effect, unavailable state`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
