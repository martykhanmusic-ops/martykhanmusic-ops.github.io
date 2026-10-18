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
      await page.addInitScript(() => {
        window.__alerts = [];
        window.__permission = 'denied';
        window.Notification = class {
          static get permission() { return window.__permission; }
          static async requestPermission() { return window.__permission; }
          constructor(title, options) { window.__alerts.push({ title, body: options.body }); }
        };
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '✧ Jarvis' }).click();
      await page.locator('#reminder-form [name=title]').fill('Record chorus');
      await page.locator('#reminder-form [name=due]').fill(await page.evaluate(() => {
        const d = new Date(Date.now() + 65000);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      }));
      await page.getByRole('button', { name: 'Save reminder' }).click();
      await page.getByText('Reminder saved.').waitFor();
      assert.equal(await page.locator('.reminder-row').count(), 1);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).jobs.length), 0);
      await page.getByRole('button', { name: 'Enable browser alerts' }).click();
      await page.getByText('Browser alerts were not enabled.').waitFor();
      await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('halo.workspace.v1'));
        state.reminders[0].dueAt = new Date(Date.now() - 1000).toISOString();
        localStorage.setItem('halo.workspace.v1', JSON.stringify(state));
      });
      await page.reload();
      await page.getByRole('button', { name: '✧ Jarvis' }).click();
      await page.locator('#reminder-badge').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#reminder-badge').textContent(), '1 reminder due');
      assert.equal(await page.evaluate(() => window.__alerts.length), 0);
      await page.evaluate(() => { window.__permission = 'granted'; });
      await page.getByRole('button', { name: 'Enable browser alerts' }).click();
      await page.getByText('Browser alerts enabled').waitFor();
      assert.deepEqual(await page.evaluate(() => window.__alerts), [{ title: 'Halo reminder', body: 'Record chorus' }]);
      assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).reminders[0].alertedAt));
      await page.reload();
      await page.getByRole('button', { name: '✧ Jarvis' }).click();
      assert.equal(await page.evaluate(() => window.__alerts.length), 0);
      await page.getByRole('button', { name: 'Done' }).click();
      assert.equal(await page.locator('#reminder-badge').isHidden(), true);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).reminders[0].status), 'done');
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Remove' }).click();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).reminders.length), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS reminders ${width}px: save, denial, due, alert, reload, done, remove`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
