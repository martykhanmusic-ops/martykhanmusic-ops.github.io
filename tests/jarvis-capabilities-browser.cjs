const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/local-llm/models', route => route.fulfill({ json: { models: [{ name: 'qwen3:0.6b' }, { name: 'qwen3:4b' }] } }));
      let chatCalls = 0, draftCalls = 0;
      await page.route('**/local-llm/chat', route => {
        const body = route.request().postDataJSON();
        assert.equal(body.model, 'qwen3:4b');
        assert.match(body.messages.at(-1).content, /Attached file chorus\.txt/);
        assert.match(body.messages.at(-1).content, /Vocal hook in A minor/);
        chatCalls++;
        return route.fulfill({ json: { message: { content: '<think>Private reasoning</think>The note describes a vocal hook.' } } });
      });
      await page.route('**/local-llm/draft', route => {
        const body = route.request().postDataJSON();
        assert.equal(body.model, 'qwen3:4b');
        assert.equal(body.messages.at(-1).content, 'What is this note about?');
        draftCalls++;
        return route.fulfill({ json: { message: { content: '{"action":"add_task","input":"Record the vocal hook"}' } } });
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '＋ New project', exact: true }).click();
      await page.locator('#project-form input[name=name]').fill('Album');
      await page.locator('#project-form button.primary').click();
      await page.getByRole('button', { name: '✧ Open Jarvis' }).click();
      await page.getByRole('button', { name: 'Find chat models' }).click();
      await page.locator('#chat-attachment').setInputFiles({ name: 'chorus.txt', mimeType: 'text/plain', buffer: Buffer.from('Vocal hook in A minor') });
      await page.getByLabel('Your message').fill('What is this note about?');
      await page.getByLabel('Your message').press('Enter');
      await page.getByText('The note describes a vocal hook.').waitFor();
      assert.equal(await page.getByText('Private reasoning').count(), 0);
      assert.equal(chatCalls, 1);
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')));
      assert.equal(saved.chat[0].text, 'What is this note about?');
      assert.equal(JSON.stringify(saved).includes('Vocal hook in A minor'), false);
      assert.equal(saved.jobs.length, 0);
      await page.locator('#chat-attachment').setInputFiles({ name: 'unsafe.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') });
      await page.getByLabel('Your message').fill('Check this');
      await page.getByLabel('Your message').press('Enter');
      await page.getByText(/Attach a \.txt, \.md, \.csv or \.json file under 6 KB/).waitFor();
      assert.equal(chatCalls, 1);
      assert.equal(await page.getByLabel('Your message').inputValue(), 'Check this');
      await page.getByRole('button', { name: 'Draft a reviewed plan' }).click();
      await page.getByText('Draft prepared for review. Nothing has run.').waitFor();
      assert.equal(draftCalls, 1);
      assert.equal(await page.locator('#plan-action').inputValue(), 'add_task');
      assert.equal(await page.locator('#plan-input').inputValue(), 'Record the vocal hook');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).jobs.length), 0);
      await page.getByRole('button', { name: 'Generate plan ↗' }).click();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).jobs[0].status), 'pending');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).projects[0].tasks.length), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS Jarvis capabilities ${width}px: local text attachment, bounded persistence, reviewed plan, no automatic effect`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
