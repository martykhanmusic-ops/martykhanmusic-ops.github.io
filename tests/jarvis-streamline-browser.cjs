const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let connected = true, hold = false, requests = 0;
      await page.route('**/local-llm/models', route => connected ? route.fulfill({ json: { models: [{ name: 'qwen3:4b' }] } }) : route.fulfill({ status: 503, body: 'offline' }));
      await page.route('**/voicebox/health', route => route.fulfill({ json: { status: 'ok' } }));
      await page.route('**/local-llm/chat', async route => {
        requests++;
        const body = route.request().postDataJSON();
        assert.equal(body.stream, true);
        assert.equal(body.model, 'qwen3:4b');
        assert.match(body.messages[0].content, /Second album/);
        if (hold) await new Promise(resolve => setTimeout(resolve, 1200));
        const chunks = [
          { message: { content: '<think>internal' }, done: false },
          { message: { content: '</think>Hello' }, done: false },
          { message: { content: ' from Jarvis.' }, done: false },
          { message: { content: '' }, done: true }
        ].map(value => JSON.stringify(value)).join('\n') + '\n';
        try { await route.fulfill({ contentType: 'application/x-ndjson', body: chunks }); } catch { /* aborted request */ }
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      for (const name of ['First album', 'Second album']) {
        await page.getByRole('button', { name: '＋ New project', exact: true }).click();
        await page.locator('#project-form input[name=name]').fill(name);
        await page.locator('#project-form button.primary').click();
        if (name === 'First album') await page.locator('nav [data-view="dashboard"]').click();
      }
      await page.getByRole('button', { name: '✧ Open Jarvis' }).click();
      await page.locator('#chat-models').click();
      await page.getByText(/Ollama ready/).waitFor();
      await page.getByText(/Voicebox ready/).waitFor();
      const firstId = await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).projects.find(p => p.name === 'First album').id);
      await page.locator('#chat-project').selectOption(firstId);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).activeProjectId), firstId);
      const secondId = await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).projects.find(p => p.name === 'Second album').id);
      await page.locator('#chat-project').selectOption(secondId);
      await page.getByLabel('Your message').fill('Hello');
      await page.getByLabel('Your message').press('Enter');
      await page.getByText('Hello from Jarvis.').waitFor();
      assert.equal(await page.getByText('internal').count(), 0);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).chat.length), 2);
      hold = true;
      await page.getByLabel('Your message').fill('Stop this');
      await page.getByLabel('Your message').press('Enter');
      await page.locator('#chat-stop').click();
      await page.getByText(/Reply stopped/).waitFor();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).chat.length), 2);
      assert.equal(await page.getByLabel('Your message').inputValue(), 'Stop this');
      connected = false;
      await page.locator('#chat-models').click();
      await page.getByText(/Ollama disconnected/).waitFor();
      connected = true;
      await page.locator('#chat-models').click();
      await page.getByText(/Ollama ready/).waitFor();
      assert.equal(requests, 2);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS Jarvis streamline ${width}px: project scope, stream, stop, recovery, no unsaved effect`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
