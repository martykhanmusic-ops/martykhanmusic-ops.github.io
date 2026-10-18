const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let allowed = true, launches = 0, approvals = 0;
      await page.route('http://127.0.0.1:4174/apps', route => {
        assert.equal(route.request().headers().authorization, 'Bearer paired-test-token');
        return route.fulfill(allowed ? { json: { apps: [
          { id: 'ableton live 12 suite.lnk', name: 'Ableton Live 12 Suite' },
          { id: 'fl studio 2026.lnk', name: 'FL Studio 2026' },
          { id: 'fl studio 2026.lnk', name: 'FL Studio 2026' },
          { id: 'file explorer.lnk', name: 'File Explorer' }
        ] } } : { status: 403, json: { error: 'Application access revoked' } });
      });
      await page.route('http://127.0.0.1:4174/apps/approval', route => {
        approvals++;
        const id = route.request().postDataJSON().id;
        assert.ok(['ableton live 12 suite.lnk', 'fl studio 2026.lnk'].includes(id));
        return route.fulfill({ json: { approvalRequired: true, app: id.startsWith('ableton') ? 'Ableton Live 12 Suite' : 'FL Studio 2026' } });
      });
      await page.route('http://127.0.0.1:4174/apps/launch', route => {
        launches++;
        const { id, code } = route.request().postDataJSON();
        assert.equal(id, 'fl studio 2026.lnk');
        return route.fulfill(code === '123456' ? { json: { launched: true, app: 'FL Studio 2026', verifiedAt: new Date().toISOString() } } : { status: 403, json: { error: 'Local launch approval denied' } });
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '＋ New project', exact: true }).click();
      await page.locator('#project-form input[name=name]').fill('DAW project');
      await page.locator('#project-form button.primary').click();
      const before = await page.evaluate(() => localStorage.getItem('halo.workspace.v1'));
      await page.getByRole('button', { name: 'Discover approved DAWs' }).click();
      await page.getByText(/Pair the Windows companion first/).waitFor();
      await page.evaluate(() => sessionStorage.setItem('halo.companion.token', 'paired-test-token'));
      await page.getByRole('button', { name: 'Discover approved DAWs' }).click();
      await page.getByText('2 approved DAW shortcut(s) found.', { exact: false }).waitFor();
      assert.equal(await page.locator('#music-daw-select option').count(), 3);
      await page.locator('#music-daw-select').selectOption('ableton live 12 suite.lnk');
      await page.getByRole('button', { name: 'Request launch code' }).click();
      await page.getByText(/Enter the one-time code shown/).waitFor();
      assert.equal(launches, 0);
      await page.locator('#music-daw-select').selectOption('fl studio 2026.lnk');
      assert.equal(await page.locator('#music-daw-launch').isDisabled(), true);
      await page.getByRole('button', { name: 'Request launch code' }).click();
      await page.locator('#music-daw-code').fill('111111');
      await page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Launch selected DAW' }).click();
      await page.getByText(/Local launch approval denied/).waitFor();
      assert.equal(launches, 1);
      await page.getByRole('button', { name: 'Request launch code' }).click();
      await page.locator('#music-daw-code').fill('123456');
      await page.once('dialog', dialog => dialog.dismiss());
      await page.getByRole('button', { name: 'Launch selected DAW' }).click();
      assert.equal(launches, 1);
      await page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Launch selected DAW' }).click();
      await page.getByText(/FL Studio 2026 launch request verified/).waitFor();
      assert.equal(launches, 2);
      assert.equal(approvals, 3);
      assert.equal(await page.evaluate(() => localStorage.getItem('halo.workspace.v1')), before);
      allowed = false;
      await page.getByRole('button', { name: 'Discover approved DAWs' }).click();
      await page.getByText(/Application access revoked/).waitFor();
      assert.equal(await page.locator('#music-daw-select option').count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS DAW approval ${width}px: allowlist, selection change, denial, confirmation, verified response, revocation, no workspace write`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
