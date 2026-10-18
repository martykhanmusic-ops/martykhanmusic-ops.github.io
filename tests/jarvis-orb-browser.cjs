const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        const stream = { getTracks: () => [{ stop() {} }] };
        Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => stream } });
        window.MediaRecorder = class {
          constructor() { this.state = 'inactive'; this.mimeType = 'audio/webm'; }
          static isTypeSupported() { return true; }
          start() { this.state = 'recording'; }
          stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) }); this.onstop?.(); }
        };
        window.Audio = class { play() { return Promise.resolve(); } pause() {} set src(value) {} };
      });
      let modelCalls = 0, chatCalls = 0;
      await page.route('**/local-llm/models', route => { modelCalls++; return route.fulfill({ json: { models: [{ name: 'qwen3:0.6b' }] } }); });
      await page.route('**/local-llm/chat', route => {
        const body = route.request().postDataJSON();
        assert.equal(body.model, 'qwen3:0.6b');
        assert.equal(body.messages.at(-1).content, 'Record a vocal take');
        chatCalls++;
        return route.fulfill({ json: { message: { content: 'Start with the chorus.' } } });
      });
      await page.route('**/voicebox/**', route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith('/transcribe')) return route.fulfill({ json: { text: 'Record a vocal take' } });
        if (path.endsWith('/speak')) return route.fulfill({ json: { id: '11111111-1111-1111-1111-111111111111' } });
        if (path.includes('/history/')) return route.fulfill({ json: { status: 'completed' } });
        if (path.includes('/audio/')) return route.fulfill({ contentType: 'audio/wav', body: 'RIFF' });
        return route.fulfill({ json: { status: 'healthy' } });
      });
      const origin = (process.env.HALO_TEST_URL || 'http://127.0.0.1:4173').replace('127.0.0.1', 'localhost');
      await page.goto(origin + '/halo/');
      await page.getByRole('button', { name: '✧ Jarvis' }).click();
      await page.getByText('Connected to qwen3:0.6b.').waitFor();
      assert.equal(await page.locator('#application-directory').isVisible(), false);
      assert.equal(await page.locator('.companion-panel').isVisible(), false);
      assert.ok(modelCalls >= 1);
      await page.getByRole('button', { name: '● Talk to Jarvis' }).click();
      await page.getByRole('button', { name: '■ Stop listening' }).click();
      await page.waitForFunction(() => document.querySelector('#chat-input')?.value === 'Record a vocal take');
      assert.equal(await page.getByLabel('Your message').inputValue(), 'Record a vocal take');
      assert.equal(chatCalls, 0);
      await page.getByLabel('Your message').press('Enter');
      await page.getByText('Start with the chorus.').waitFor();
      assert.equal(chatCalls, 1);
      await page.getByRole('button', { name: 'Hear latest reply' }).click();
      await page.locator('#orb-voice-status').getByText('Speaking through Voicebox.').waitFor();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('halo.workspace.v1')).jobs.length), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      if (width === 1440) await page.screenshot({ path: 'dist/jarvis-orb-desktop.png', fullPage: false });
      await page.close();
      console.log(`PASS Jarvis orb ${width}px: auto local model, voice-to-reviewed-chat, Enter send, speak reply, no tool effect`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
