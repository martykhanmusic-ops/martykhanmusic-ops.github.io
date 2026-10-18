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
      await page.route('**/local-llm/models', route => route.fulfill({ json: { models: [{ name: 'fixture:local' }] } }));
      await page.route('**/local-llm/draft', async route => {
        const body = route.request().postDataJSON();
        assert.equal(body.stream, false);
        assert.equal(body.model, 'fixture:local');
        await route.fulfill({ json: { message: { content: '{"action":"add_task","input":"Record vocals"}' } } });
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '＋ New project', exact: true }).click();
      await page.getByLabel('Project name', { exact: true }).fill('LLM fixture');
      await page.getByRole('button', { name: 'Create project ↗', exact: true }).click();
      await page.getByRole('button', { name: '✧ Jarvis' }).click();
      await page.getByRole('button', { name: 'Find models' }).click();
      await page.getByLabel('Request', { exact: true }).fill('Add a vocal task');
      await page.getByRole('button', { name: 'Suggest draft' }).click();
      await page.getByText('Draft copied into the Jarvis form.').waitFor();
      assert.equal(await page.locator('#plan-action').inputValue(), 'add_task');
      assert.equal(await page.locator('#plan-input').inputValue(), 'Record vocals');
      assert.equal(await page.locator('.job-card').count(), 0);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).projects[0].tasks.length), 0);
      await page.getByRole('button', { name: 'Generate plan ↗' }).click();
      assert.equal(await page.locator('.job-card').count(), 1);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).projects[0].tasks.length), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS local LLM ${width}px: model draft fills reviewed form without execution`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
