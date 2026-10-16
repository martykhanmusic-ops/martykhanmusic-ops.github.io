const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
  try {
    for(const width of [1440,390]) {
      const context=await browser.newContext({viewport:{width,height:900}});
      const page=await context.newPage(), errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      await page.goto((process.env.HALO_TEST_URL || 'http://127.0.0.1:4173')+'/halo/');
      await page.getByRole('button',{name:'＋ New project',exact:true}).click();
      await page.getByLabel('Project name',{exact:true}).fill('Master core');
      await page.getByRole('button',{name:'Create project ↗',exact:true}).click();
      await page.getByLabel('Working notes').fill('Unique note constellation');
      await page.getByRole('button',{name:'Save project',exact:true}).click();
      await page.getByLabel('New task',{exact:true}).fill('Unique task nebula');
      await page.getByRole('button',{name:'Add',exact:true}).click();
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('halo.workspace.v1')));
      const editor=page.getByLabel('Working notes');
      await editor.fill('Unsaved draft must survive rejected navigation');
      page.once('dialog',d=>d.dismiss());
      await page.getByRole('button',{name:'← All projects',exact:true}).click();
      assert.equal(await editor.inputValue(),'Unsaved draft must survive rejected navigation');
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('halo.workspace.v1')).projects[0].notes),'Unique note constellation');
      await editor.fill('Unique note constellation');
      await page.getByRole('button',{name:'Save project',exact:true}).click();
      await page.getByRole('button',{name:'← All projects',exact:true}).click();
      for(const term of ['constellation','nebula']) {
        await page.getByLabel('Search projects, notes & tasks').fill(term);
        assert.equal(await page.getByRole('button',{name:'Open project ↗',exact:true}).count(),1);
      }
      await page.getByRole('button',{name:'Resume project ↗',exact:true}).click();
      await page.reload();
      assert.equal(await page.getByLabel('Working notes').inputValue(),'Unique note constellation');
      assert.equal(await page.getByRole('checkbox',{name:'Unique task nebula',exact:true}).count(),1);
      const download=page.waitForEvent('download');
      await page.locator('#backup').click();
      const backup=await download;
      const stream=await backup.createReadStream();let raw='';for await(const chunk of stream)raw+=chunk;
      const exported=JSON.parse(raw);
      assert.equal(exported.projects[0].id,saved.projects[0].id);
      assert.equal(exported.projects[0].notes,saved.projects[0].notes);
      await page.getByLabel('Working notes').fill('Saved after backup');
      await page.getByRole('button',{name:'Save project',exact:true}).click();
      page.once('dialog',d=>d.accept());
      await page.locator('#backup-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(raw)});
      await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Workspace restored'));
      assert.equal(await page.getByLabel('Working notes').inputValue(),'Unique note constellation');
      const final=await page.evaluate(()=>JSON.parse(localStorage.getItem('halo.workspace.v1')));
      assert.equal(final.projects.length,1);assert.equal(final.projects[0].id,saved.projects[0].id);
      assert.equal(final.activeProjectId,saved.projects[0].id);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.deepEqual(errors,[]);
      await context.close();
      console.log(`PASS master core ${width}px: original data identity, rejected dirty navigation, saved-only reload, cross-record search, backup export/restore, resume, no overflow/console/page errors.`);
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
