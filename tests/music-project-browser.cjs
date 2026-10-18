const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let approvals = 0, opens = 0, stale = true;
      const verified = { kind: 'daw-project', root: 'C:\\Users\\owner\\Documents\\Ableton', relative: 'Session/song.als', name: 'song.als', bytes: 123, modifiedAt: '2026-01-01T00:00:00.000Z', verifiedAt: new Date().toISOString() };
      await page.route('http://127.0.0.1:4174/files/music-stat', route => route.fulfill({ json: verified }));
      await page.route('http://127.0.0.1:4174/apps', route => route.fulfill({ json: { apps: [{ id: 'ableton live 12 suite.lnk', name: 'Ableton Live 12 Suite' }, { id: 'fl studio 2026.lnk', name: 'FL Studio 2026' }] } }));
      await page.route('http://127.0.0.1:4174/apps/project-approval', route => {
        approvals++;
        const body = route.request().postDataJSON();
        assert.equal(body.id, 'ableton live 12 suite.lnk');
        assert.equal(body.relative, verified.relative);
        assert.equal(body.expected.root, verified.root);
        assert.equal(body.expected.bytes, verified.bytes);
        return route.fulfill(stale ? { status: 409, json: { error: 'Linked project file changed; re-link it before opening' } } : { json: { approvalRequired: true, app: 'Ableton Live 12 Suite', relative: verified.relative, verifiedAt: new Date().toISOString() } });
      });
      await page.route('http://127.0.0.1:4174/apps/project-open', route => {
        opens++;
        const body = route.request().postDataJSON();
        assert.equal(body.id, 'ableton live 12 suite.lnk');
        assert.equal(body.relative, verified.relative);
        return route.fulfill(body.code === '123456' ? { json: { launchRequested: true, app: 'Ableton Live 12 Suite', relative: verified.relative, verifiedAt: new Date().toISOString() } } : { status: 403, json: { error: 'Local project-open approval denied' } });
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '＋ New project', exact: true }).click();
      await page.locator('#project-form input[name=name]').fill('Ableton project');
      await page.locator('#project-form button.primary').click();
      await page.evaluate(() => sessionStorage.setItem('halo.companion.token', 'paired-test-token'));
      await page.locator('#music-hub-form input[name=relative]').fill(verified.relative);
      await page.locator('#music-hub-form button').click();
      await page.getByText(/Verified file linked/).waitFor();
      const saved = await page.evaluate(() => localStorage.getItem('halo.workspace.v1'));
      await page.getByRole('button', { name: 'Discover approved DAWs' }).click();
      await page.locator('#music-daw-select').selectOption('fl studio 2026.lnk');
      await page.locator('#music-project-select').selectOption({ index: 1 });
      await page.getByRole('button', { name: 'Request project-open code' }).click();
      await page.getByText(/Select the approved Ableton/).waitFor();
      assert.equal(approvals, 0);
      await page.locator('#music-daw-select').selectOption('ableton live 12 suite.lnk');
      await page.getByRole('button', { name: 'Request project-open code' }).click();
      await page.getByText(/Linked project file changed/).waitFor();
      assert.equal(await page.locator('#music-project-open').isDisabled(), true);
      stale = false;
      await page.getByRole('button', { name: 'Request project-open code' }).click();
      await page.getByText(/Enter the one-time code shown/).last().waitFor();
      await page.locator('#music-project-code').fill('111111');
      await page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Open linked project in Ableton' }).click();
      await page.getByText(/Local project-open approval denied/).waitFor();
      assert.equal(opens, 1);
      await page.getByRole('button', { name: 'Request project-open code' }).click();
      await page.locator('#music-project-code').fill('123456');
      await page.once('dialog', dialog => dialog.dismiss());
      await page.getByRole('button', { name: 'Open linked project in Ableton' }).click();
      assert.equal(opens, 1);
      await page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Open linked project in Ableton' }).click();
      await page.getByText(/Ableton project-open request accepted/).waitFor();
      assert.equal(opens, 2);
      assert.equal(await page.evaluate(() => localStorage.getItem('halo.workspace.v1')), saved);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS Ableton project ${width}px: exact link, stale denial, fresh code, cancel/confirm, unchanged workspace`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
