// Run manually against a Halo launcher with a local Ollama model installed.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto((process.env.HALO_TEST_URL || 'http://localhost:4174') + '/halo/');
    await page.getByRole('button', { name: '＋ New project', exact: true }).click();
    await page.getByLabel('Project name', { exact: true }).fill('Live local model check');
    await page.getByRole('button', { name: 'Create project ↗', exact: true }).click();
    await page.getByRole('button', { name: '✧ Jarvis' }).click();
    await page.getByRole('button', { name: 'Find models' }).click();
    await page.waitForFunction(() => document.querySelector('#llm-model')?.value === 'qwen3:0.6b');
    await page.getByLabel('Request', { exact: true }).fill('Add a task to record a vocal take');
    await page.getByRole('button', { name: 'Suggest draft' }).click();
    await page.getByText('Draft copied into the Jarvis form.').waitFor({ timeout: 180000 });
    assert.equal(await page.locator('#plan-action').inputValue(), 'add_task');
    assert.match(await page.locator('#plan-input').inputValue(), /vocal take/i);
    assert.equal(await page.locator('.job-card').count(), 0);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).projects[0].tasks.length), 0);
    await page.getByRole('button', { name: 'Generate plan ↗' }).click();
    assert.equal(await page.locator('.job-card').count(), 1);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).projects[0].tasks.length), 0);
    assert.deepEqual(errors, []);
    console.log('PASS live local LLM: installed qwen3:0.6b filled review form; no automatic plan or task');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
