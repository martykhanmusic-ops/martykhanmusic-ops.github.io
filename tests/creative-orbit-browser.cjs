const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '＋ New project', exact: true }).click();
      await page.locator('#project-form input[name=name]').fill('My record');
      await page.locator('#project-form button.primary').click();
      await page.locator('#add-task input[name=title]').fill('Record the hook');
      await page.locator('#add-task button').click();
      await page.locator('#session-form input[name=focus]').fill('Sketch the chorus');
      await page.getByRole('button', { name: 'Start session' }).click();
      await page.getByText('SESSION ACTIVE').waitFor();
      await page.reload();
      await page.getByText('SESSION ACTIVE').waitFor();
      await page.locator('#session-form textarea[name=recap]').fill('Drums arranged; vocals next.');
      await page.getByRole('button', { name: 'Finish session' }).click();
      await page.getByText(/Drums arranged; vocals next/).waitFor();
      await page.getByRole('button', { name: '← All projects' }).click();
      await page.getByRole('heading', { name: 'Record the hook' }).waitFor();
      await page.getByRole('heading', { name: 'Ready to resume' }).waitFor();
      await page.getByText('Drums arranged; vocals next.').waitFor();
      await page.getByRole('button', { name: 'Go to session' }).click();
      await page.locator('#session-stage').waitFor();
      const state = await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')));
      assert.equal(state.projects.length, 1);
      assert.equal(state.projects[0].sessions[0].recap, 'Drums arranged; vocals next.');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS creative orbit ${width}px: session start, reload, recap, home resume, one store, no overflow/errors`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
