const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const KEY = 'halo.workspace.v1';

async function scenario(browser, viewport) {
  const context = await browser.newContext({viewport});
  const page = await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  const click=name=>page.getByRole('button',{name,exact:true}).click();
  async function create(name) {
    await click('＋ New project');
    await page.locator('#project-form input[name="name"]').fill(name);
    await click('Create project ↗');
  }
  async function completed(id) {
    await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem(key)).jobs.find(j=>j.id===id)?.status==='completed',{key:KEY,id});
  }
  try {
    await page.goto('http://127.0.0.1:4173/halo/');
    await create('Project A');
    await page.getByLabel('New task',{exact:true}).fill('Record A'); await click('Add');
    let snapshot=await state(); const a=snapshot.activeProjectId, task=snapshot.projects[0].tasks[0].id;
    await click('Plan completion');
    assert.equal(await page.locator('#job-project-filter').inputValue(),a);
    assert.match(await page.locator('.job-card').textContent(),/Record A/);
    await click('Run job'); assert.match(await page.locator('#status').textContent(),/permission is disabled/);
    await page.locator('[data-permission="complete_task"]').check();
    await click('View task: Record A');
    assert.equal(await page.getByRole('checkbox',{name:'Record A',exact:true}).evaluate(el=>el===document.activeElement),true);
    const job=(await state()).jobs[0].id;
    // Run from Halo's project panel; subscription must update the same task,
    // without a reload or navigation through the command center.
    await click('Run job'); await completed(job);
    assert.equal(await page.getByRole('checkbox',{name:'Record A',exact:true}).isChecked(),true);
    assert.equal(await page.locator('#task-count').textContent(),'1 of 1 tasks complete');
    assert.equal(await page.locator('#project-jobs .badge').textContent(),'completed');
    await page.reload();
    assert.equal(await page.getByRole('checkbox',{name:'Record A',exact:true}).isChecked(),true);
    await page.locator('#edit-project input[name="name"]').fill('Renamed A'); await click('Save project');
    assert.equal(await page.locator('#project-jobs .eyebrow').textContent(),'Renamed A');
    assert.match(await page.locator('#project-jobs ol').textContent(),/Project A/);
    await click('← All projects'); await create('Project B');
    const b=(await state()).activeProjectId;
    await click('Plan with Jarvis');
    assert.equal(await page.locator('#job-project-filter').inputValue(),b);
    assert.equal(await page.locator('.job-card').count(),0);
    await page.locator('#plan-input').fill('Mix B'); await click('Generate plan ↗');
    const createJob=(await state()).jobs[0].id;
    await click('Run job'); await completed(createJob);
    await click('View task: Mix B');
    assert.equal(await page.getByRole('checkbox',{name:'Mix B',exact:true}).isChecked(),false);
    assert.equal(await page.locator('#project-jobs .job-card').count(),1);
    await click('Plan with Jarvis');
    await page.locator('#job-project-filter').selectOption(a);
    assert.equal(await page.locator('.job-card').count(),1);
    await click('Open linked project');
    assert.equal(await page.locator('#project-title').textContent(),'Renamed A');
    await click('Plan with Jarvis'); await page.locator('#plan-action').selectOption('delete_completed'); await click('Generate plan ↗');
    const deleteJob=(await state()).jobs[0].id;
    await click('Approve deletion plan'); assert.match(await page.locator('#status').textContent(),/Enable the deletion tool/);
    await page.locator('[data-permission="delete_completed"]').check(); await click('Approve deletion plan');
    await page.locator(`[data-job="${deleteJob}"]`).getByRole('button',{name:'Open linked project',exact:true}).click();
    await page.locator(`[data-job="${deleteJob}"]`).getByRole('button',{name:'Run job',exact:true}).click(); await completed(deleteJob);
    assert.equal(await page.getByRole('checkbox',{name:'Record A',exact:true}).count(),0);
    snapshot=await state(); assert.equal(snapshot.projects.find(p=>p.id===b).tasks.length,1);
    assert.equal(snapshot.jobs.find(j=>j.id===job).targetIds[0],task);
    // Navigate back to B and schedule a note append while controlling browser
    // time, so editing the open draft before execution is deterministic.
    await click('Plan with Jarvis'); await page.locator('#plan-form select[name="projectId"]').selectOption(b);
    await page.locator('#plan-action').selectOption('append_note'); await page.locator('#plan-input').fill('Jarvis note'); await click('Generate plan ↗');
    const noteJob=(await state()).jobs[0].id;
    await page.locator(`[data-job="${noteJob}"]`).getByRole('button',{name:'Open linked project',exact:true}).click();
    await page.clock.install(); await page.clock.pauseAt(new Date());
    await page.locator(`[data-job="${noteJob}"]`).getByRole('button',{name:'Run job',exact:true}).click();
    await page.getByLabel('Working notes').fill('Unsaved local draft');
    await page.clock.runFor(200); await completed(noteJob);
    assert.equal(await page.getByLabel('Working notes').inputValue(),'Unsaved local draft');
    await click('Save project');
    assert.match(await page.locator('#status').textContent(),/Project changed since this editor opened/);
    assert.equal((await state()).projects.find(p=>p.id===b).notes,'Jarvis note');
    page.once('dialog',dialog=>dialog.accept()); await click('Reload saved project');
    assert.equal(await page.getByLabel('Working notes').inputValue(),'Jarvis note');
    assert.equal(await page.locator('#project-jobs .job-card').count(),2);
    await page.clock.resume(); await page.reload();
    assert.equal(await page.getByLabel('Working notes').inputValue(),'Jarvis note');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`/tmp/halo-integration-${viewport.width}.png`,fullPage:true});
    assert.deepEqual(errors,[]);
    console.log(`PASS integration ${viewport.width}px: task planning/completion, linked result focus, live Halo updates, project isolation/rename/filter, approved deletion, background draft conflict, reload and history; no overflow or page errors.`);
  } finally { await context.close(); }
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
  try { for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) await scenario(browser,viewport); }
  finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
