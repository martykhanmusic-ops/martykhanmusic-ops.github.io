const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '＋ New project', exact: true }).click();
      await page.getByLabel('Project name', { exact: true }).fill('Framework fixture');
      await page.getByRole('button', { name: 'Create project ↗', exact: true }).click();
      await page.getByLabel('New task', { exact: true }).fill('Keep shared task');
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      const workspaceBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).projects);
      const directory = page.locator('#application-directory');
      assert.equal(await directory.getByText('Workspace Status').count(), 1);
      await directory.getByRole('button', { name: 'Open' }).click();
      await page.getByText(/Grant workspace-read/).waitFor();
      await directory.getByRole('checkbox', { name: 'Allow workspace-read' }).check();
      await directory.getByRole('button', { name: 'Open' }).click();
      await page.locator('#application-panel').getByText('1 saved project(s)').waitFor();
      assert.equal(await page.locator('#main').isHidden(), true);
      await page.getByLabel('Show completed task count').uncheck();
      await page.getByLabel('Application theme').selectOption('light');
      await page.getByRole('button', { name: 'Suspend', exact: true }).click();
      assert.equal(await page.locator('#main').isVisible(), true);
      await directory.getByRole('button', { name: 'Resume' }).click();
      assert.equal(await page.getByLabel('Show completed task count').isChecked(), false);
      assert.equal(await page.getByLabel('Application theme').inputValue(), 'light');
      await page.getByRole('button', { name: 'Close application' }).click();
      await page.reload();
      await directory.getByRole('button', { name: 'Open' }).click();
      assert.equal(await page.getByLabel('Show completed task count').isChecked(), false);
      assert.equal(await page.getByLabel('Application theme').inputValue(), 'light');
      await page.getByRole('button', { name: 'Close application' }).click();
      await directory.getByRole('checkbox', { name: 'Allow workspace-read' }).uncheck();
      await directory.getByRole('button', { name: 'Open' }).click();
      await page.getByText(/Grant workspace-read/).waitFor();
      await directory.getByRole('checkbox', { name: 'Allow workspace-read' }).check();
      await directory.getByRole('button', { name: 'Open' }).click();
      await page.locator('#application-panel').getByText('1 saved project(s)').waitFor();
      await directory.getByRole('checkbox', { name: 'Allow workspace-read' }).uncheck();
      assert.equal(await page.locator('#application-panel').isHidden(), true);
      assert.equal(await page.locator('#main').isVisible(), true);
      await page.getByRole('button', { name: '✧ Jarvis' }).click();
      await page.getByRole('heading', { name: 'Talk to Jarvis.' }).waitFor();
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).projects), workspaceBefore);
      assert.ok(await page.evaluate(() => localStorage.getItem('halo.applications.v1')));
      assert.equal(errors.length, 0, errors.join('\n'));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false);
      await context.close();
      console.log(`PASS framework ${width}px: discover, grant, open, save state/theme, suspend/resume, reload, Jarvis, no duplicate workspace or errors`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
