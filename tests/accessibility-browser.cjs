const { chromium } = require('playwright');
const { existsSync } = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HALO_CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
  const findings = [];
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173') + '/halo/');
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      async function audit(view, theme, visualPackage) {
        const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }));
        for (const violation of result.violations) findings.push({ width, theme, visualPackage, view, id: violation.id, impact: violation.impact, nodes: violation.nodes.map(node => ({ target: node.target.join(' '), summary: node.failureSummary })) });
      }
      for (const visualPackage of ['orbital', 'classic']) {
        if (visualPackage === 'classic') {
          await page.getByRole('button', { name: 'Appearance' }).click();
          await page.getByLabel('Classic').check();
          await page.getByRole('button', { name: 'Apply appearance' }).click();
          await page.waitForTimeout(250);
        }
        for (const theme of ['dark', 'light']) {
          if (await page.locator('html').getAttribute('data-theme') !== theme) await page.getByRole('button', { name: 'Switch color theme' }).click();
          await page.waitForTimeout(250);
          await audit('overview', theme, visualPackage);
        await page.getByRole('button', { name: '＋ New project', exact: true }).click();
        await audit('new-project-dialog', theme, visualPackage);
        await page.getByLabel('Project name', { exact: true }).fill('Access test');
        await page.getByRole('button', { name: 'Create project ↗', exact: true }).click();
        await audit('project', theme, visualPackage);
        await page.getByRole('button', { name: '✧ Jarvis' }).click();
        await audit('jarvis', theme, visualPackage);
        await page.getByRole('button', { name: 'Appearance' }).click();
        await audit('appearance-dialog', theme, visualPackage);
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: '◉ Overview' }).click();
        }
      }
      await page.reload();
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.className), 'skip');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
      await page.getByRole('button', { name: 'Appearance' }).focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#visual-dialog').evaluate(el => el.open), true);
      for (let index = 0; index < 8; index++) {
        await page.keyboard.press('Tab');
        const active = await page.evaluate(() => ({ inside: document.querySelector('#visual-dialog').contains(document.activeElement), tag: document.activeElement?.tagName, id: document.activeElement?.id }));
        assert.equal(active.inside || active.tag === 'BODY', true, JSON.stringify({ index, active }));
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#visual-dialog').evaluate(el => el.open), false);
      await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
      assert.equal(await page.evaluate(() => matchMedia('(forced-colors: active)').matches && matchMedia('(prefers-reduced-motion: reduce)').matches), true);
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('nav [aria-current="page"]')).borderTopStyle), 'solid');
      await audit('forced-colors-overview', await page.locator('html').getAttribute('data-theme'), 'classic');
      await page.close();
    }
    if (findings.length) throw new Error(JSON.stringify(findings, null, 2));
    console.log('PASS accessibility: axe, keyboard, forced colors and reduced motion across Orbital/Classic, themes and 1440/390px');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
