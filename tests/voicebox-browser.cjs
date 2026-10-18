const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || undefined, headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [], calls = [];
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
        window.Audio = class { constructor() {} play() { return Promise.resolve(); } pause() {} set src(value) {} };
        window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak(utterance) { window.__browserSpeech = utterance.text; }, cancel() {} } });
      });
      await page.route('**/voicebox/**', async route => {
        const url = new URL(route.request().url()); calls.push(`${route.request().method()} ${url.pathname}`);
        const body = url.pathname.endsWith('/health') ? { status: 'healthy' }
          : url.pathname.endsWith('/transcribe') ? { text: 'Record a vocal take', duration: 2 }
          : url.pathname.endsWith('/speak') ? { id: '11111111-1111-1111-1111-111111111111' }
          : url.pathname.includes('/history/') ? { status: 'completed' } : null;
        await route.fulfill(body ? { status: 200, contentType: 'application/json', body: JSON.stringify(body) } : { status: 200, contentType: 'audio/wav', body: 'RIFF' });
      });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.getByRole('button', { name: '＋ New project', exact: true }).click();
      await page.getByLabel('Project name', { exact: true }).fill('Voice project');
      await page.getByRole('button', { name: 'Create project ↗', exact: true }).click();
      await page.getByRole('button', { name: '✧ Jarvis' }).click();
      await page.getByRole('button', { name: 'Check Voicebox' }).click();
      await page.locator('#voice-status').getByText('Voicebox is connected on this computer.').waitFor();
      await page.getByRole('button', { name: '● Record' }).click();
      await page.locator('#voice-status').getByText('Listening. Press Stop when you finish.').waitFor();
      await page.getByRole('button', { name: '■ Stop recording' }).click();
      await page.getByLabel('Voice text').waitFor();
      await page.locator('#voice-status').getByText('Transcript ready. Review it before using it in a plan.').waitFor();
      assert.equal(await page.getByLabel('Voice text').inputValue(), 'Record a vocal take');
      assert.equal(await page.locator('[data-job]').count(), 0);
      await page.getByRole('button', { name: 'Use as task title' }).click();
      assert.equal(await page.locator('#plan-input').inputValue(), 'Record a vocal take');
      await page.getByRole('button', { name: 'Generate plan ↗' }).click();
      assert.equal(await page.locator('[data-job]').count(), 1);
      assert.equal(await page.getByText('No execution plans in this view.').count(), 0);
      await page.getByLabel('Voice text').fill('Your plan is ready for review.');
      await page.getByRole('button', { name: 'Speak with Voicebox', exact: true }).click();
      await page.locator('#voice-status').getByText('Speaking through Voicebox.').waitFor();
      await page.getByRole('button', { name: 'Browser voice fallback' }).click();
      await page.locator('#voice-status').getByText('Speaking with the browser voice.').waitFor();
      assert.equal(await page.evaluate(() => window.__browserSpeech), 'Your plan is ready for review.');
      assert.ok(calls.includes('POST /voicebox/transcribe'));
      assert.ok(calls.includes('POST /voicebox/speak'));
      assert.ok(calls.includes('GET /voicebox/audio/11111111-1111-1111-1111-111111111111'));
      assert.deepEqual(errors, []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.close();
      console.log(`PASS Jarvis Voicebox ${width}px: record/transcribe/review/plan, explicit speech, no automatic action or overflow`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
