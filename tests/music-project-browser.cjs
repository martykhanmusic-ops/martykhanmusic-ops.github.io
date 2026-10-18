const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true });
  try {
    for (const [appId, appName, relative, wrongApp] of [
      ['ableton live 12 suite.lnk', 'Ableton Live 12 Suite', 'Session/song.als', 'fl studio 2026.lnk'],
      ['fl studio 2026.lnk', 'FL Studio 2026', 'Session/song.flp', 'ableton live 12 suite.lnk']
    ]) for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let approvals = 0, opens = 0, stale = true;
      const verified = { kind: 'daw-project', root: 'C:\\Users\\owner\\Documents\\DAW', relative, name: relative.split('/').at(-1), bytes: 123, modifiedAt: '2026-01-01T00:00:00.000Z', verifiedAt: new Date().toISOString() };
      await page.route('http://127.0.0.1:4174/files/music-stat', route => route.fulfill({ json: verified }));
      await page.route('http://127.0.0.1:4174/apps', route => route.fulfill({ json: { apps: [{ id: 'ableton live 12 suite.lnk', name: 'Ableton Live 12 Suite' }, { id: 'fl studio 2026.lnk', name: 'FL Studio 2026' }] } }));
      await page.route('http://127.0.0.1:4174/apps/project-approval', route => {
        approvals++;
        const body = route.request().postDataJSON();
        assert.equal(body.id, appId);
        assert.equal(body.relative, verified.relative);
        assert.equal(body.expected.root, verified.root);
        assert.equal(body.expected.bytes, verified.bytes);
        return route.fulfill(stale ? { status: 409, json: { error: 'Linked project file changed; re-link it before opening' } } : { json: { approvalRequired: true, app: appName, relative: verified.relative, verifiedAt: new Date().toISOString() } });
      });
      await page.route('http://127.0.0.1:4174/apps/project-open', route => {
        opens++;
        const body = route.request().postDataJSON();
        assert.equal(body.id, appId);
        assert.equal(body.relative, verified.relative);
        return route.fulfill(body.code === '123456' ? { json: { launchRequested: true, app: appName, relative: verified.relative, verifiedAt: new Date().toISOString() } } : { status: 403, json: { error: 'Local project-open approval denied' } });
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '＋ New project', exact: true }).click();
      await page.locator('#project-form input[name=name]').fill(`${appName} project`);
      await page.locator('#project-form button.primary').click();
      await page.evaluate(() => sessionStorage.setItem('halo.companion.token', 'paired-test-token'));
      await page.locator('#music-hub-form input[name=relative]').fill(verified.relative);
      await page.locator('#music-hub-form button').click();
      await page.getByText(/Verified file linked/).waitFor();
      const saved = await page.evaluate(() => localStorage.getItem('halo.workspace.v1'));
      await page.getByRole('button', { name: 'Discover approved DAWs' }).click();
      await page.locator('#music-daw-select').selectOption(wrongApp);
      assert.equal(await page.locator('#music-project-select option').count(), 1);
      await page.getByRole('button', { name: 'Request project-open code' }).click();
      await page.getByText(/Select an approved Ableton or FL Studio/).waitFor();
      assert.equal(approvals, 0);
      await page.locator('#music-daw-select').selectOption(appId);
      await page.locator('#music-project-select').selectOption({ index: 1 });
      await page.getByRole('button', { name: 'Request project-open code' }).click();
      await page.getByText(/Linked project file changed/).waitFor();
      assert.equal(await page.locator('#music-project-open').isDisabled(), true);
      stale = false;
      await page.getByRole('button', { name: 'Request project-open code' }).click();
      await page.getByText(/Enter the one-time code shown/).last().waitFor();
      await page.locator('#music-project-code').fill('111111');
      await page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Open linked project in selected DAW' }).click();
      await page.getByText(/Local project-open approval denied/).waitFor();
      assert.equal(opens, 1);
      await page.getByRole('button', { name: 'Request project-open code' }).click();
      await page.locator('#music-project-code').fill('123456');
      await page.once('dialog', dialog => dialog.dismiss());
      await page.getByRole('button', { name: 'Open linked project in selected DAW' }).click();
      assert.equal(opens, 1);
      await page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Open linked project in selected DAW' }).click();
      await page.getByText(new RegExp(`${appName} project-open request accepted`)).waitFor();
      assert.equal(opens, 2);
      assert.equal(await page.evaluate(() => localStorage.getItem('halo.workspace.v1')), saved);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS ${appName} project ${width}px: exact link, stale denial, fresh code, cancel/confirm, unchanged workspace`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
