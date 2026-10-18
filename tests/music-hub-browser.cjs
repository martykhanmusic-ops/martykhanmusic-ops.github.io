const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let allowed = true;
      await page.route('http://127.0.0.1:4174/files/music-stat', route => {
        assert.equal(route.request().headers().authorization, 'Bearer paired-test-token');
        return route.fulfill(allowed ? { json: { kind: 'audio', root: 'C:\\Music', relative: 'take.wav', name: 'take.wav', bytes: 4, modifiedAt: '2026-01-01T00:00:00.000Z', verifiedAt: new Date().toISOString() } } : { status: 403, json: { error: 'File access revoked' } });
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '＋ New project', exact: true }).click();
      await page.locator('#project-form input[name=name]').fill('Music project');
      await page.locator('#project-form button.primary').click();
      await page.locator('#music-hub-form input[name=relative]').fill('take.wav');
      await page.locator('#music-hub-form button').click();
      await page.locator('#music-hub-status').getByText(/Pair the Windows companion/).waitFor();
      await page.evaluate(() => sessionStorage.setItem('halo.companion.token', 'paired-test-token'));
      await page.locator('#music-hub-form button').click();
      await page.getByText(/Verified file linked/).waitFor();
      assert.equal(await page.locator('.music-resource').count(), 1);
      await page.locator('[data-resource-field=notes]').fill('Vocal take');
      await page.getByRole('button', { name: 'Save details' }).click();
      await page.reload();
      assert.equal(await page.locator('[data-resource-field=notes]').inputValue(), 'Vocal take');
      await page.getByRole('button', { name: 'Add review task' }).click();
      await page.getByText('Review take.wav').waitFor();
      allowed = false;
      await page.getByRole('button', { name: 'Recheck file' }).click();
      await page.getByText('File access revoked').waitFor();
      assert.equal(await page.locator('.music-resource').count(), 1);
      await page.getByRole('button', { name: 'Remove link' }).click();
      await page.once('dialog', dialog => dialog.accept());
      // A second click exercises the confirmed removal after the default dismissal.
      await page.getByRole('button', { name: 'Remove link' }).click();
      await page.getByText('No linked music files yet.').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS music library ${width}px: disconnected, verified link, persistence, task, denied recheck, removal`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
