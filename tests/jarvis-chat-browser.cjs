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
      await page.route('**/local-llm/models', route => route.fulfill({ json: { models: [{ name: 'fixture:local' }, { name: 'remote-cloud' }] } }));
      let calls = 0;
      await page.route('**/local-llm/chat', async route => {
        const body = route.request().postDataJSON();
        assert.equal(body.model, 'fixture:local');
        assert.equal(body.stream, true);
        assert.equal(body.messages.at(-1).content, calls ? 'And then?' : 'How do I start?');
        if (calls) assert.ok(body.messages.some(message => message.role === 'assistant' && message.content.includes('Start with the chorus.')));
        calls++;
        await route.fulfill({ json: { message: { content: calls === 1 ? '<script>not executable</script> Start with the chorus.' : 'Then write a verse.' } } });
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '✧ Jarvis' }).click();
      await page.getByRole('button', { name: 'Retry connection' }).click();
      assert.equal(await page.locator('#chat-model option').count(), 1);
      await page.getByLabel('Your message').fill('How do I start?');
      await page.getByRole('button', { name: 'Send message' }).click();
      await page.getByText('Reply saved in your Halo workspace.').waitFor();
      assert.equal(calls, 1);
      assert.equal(await page.locator('.chat-message').count(), 2);
      assert.equal(await page.locator('#chat-log script').count(), 0);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).jobs.length), 0);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).projects.length), 0);
      await page.getByLabel('Your message').fill('And');
      await page.getByLabel('Your message').press('Shift+Enter');
      assert.equal(await page.getByLabel('Your message').inputValue(), 'And\n');
      assert.equal(calls, 1);
      await page.getByLabel('Your message').fill('And then?');
      await page.getByLabel('Your message').evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: true })));
      assert.equal(calls, 1);
      await page.getByLabel('Your message').press('Enter');
      await page.getByText('Then write a verse.').waitFor();
      assert.equal(calls, 2);
      assert.equal(await page.locator('.chat-message').count(), 4);
      await page.getByRole('button', { name: 'Copy latest reply to voice box' }).click();
      assert.equal(await page.locator('#voice-text').inputValue(), 'Then write a verse.');
      await page.reload();
      await page.getByRole('button', { name: '✧ Jarvis' }).click();
      assert.equal(await page.locator('.chat-message').count(), 4);
      page.once('dialog', dialog => dialog.dismiss());
      await page.getByRole('button', { name: 'Clear chat' }).click();
      assert.equal(await page.locator('.chat-message').count(), 4);
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Clear chat' }).click();
      assert.equal(await page.locator('.chat-message').count(), 0);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).chat.length), 0);
      await page.route('**/local-llm/chat', route => route.fulfill({ status: 503, body: 'unavailable' }));
      await page.getByRole('button', { name: 'Retry connection' }).click();
      await page.getByLabel('Your message').fill('Keep this unsent draft');
      await page.getByRole('button', { name: 'Send message' }).click();
      await page.getByText('Local model returned HTTP 503.').waitFor();
      assert.equal(await page.getByLabel('Your message').inputValue(), 'Keep this unsent draft');
      assert.equal(await page.locator('.chat-message').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS Jarvis chat ${width}px: local response, safe text, reload, no tool effect`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
