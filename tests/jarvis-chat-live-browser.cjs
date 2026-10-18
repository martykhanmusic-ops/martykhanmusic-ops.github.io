// Manual live check against the Windows launcher and installed local Ollama model.
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
    await page.getByRole('button', { name: '✧ Jarvis' }).click();
    if (await page.getByRole('button', { name: 'Find chat models' }).isVisible()) await page.getByRole('button', { name: 'Find chat models' }).click();
    await page.waitForFunction(() => document.querySelector('#chat-model')?.value === 'qwen3:0.6b');
    await page.getByLabel('Your message').fill('In one sentence, suggest how to start writing a song.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.getByText('Reply saved in your Halo workspace.').waitFor({ timeout: 180000 });
    const reply = await page.locator('.chat-assistant p').textContent();
    assert.ok(reply && reply.trim().length > 8);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')));
    assert.equal(saved.chat.length, 2);
    assert.equal(saved.jobs.length, 0);
    assert.equal(saved.projects.length, 0);
    await page.reload();
    assert.equal(await page.locator('.chat-message').count(), 2);
    assert.deepEqual(errors, []);
    console.log(`PASS live Jarvis chat: qwen3:0.6b replied, saved/reloaded, no job or project (reply length ${reply.length})`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
