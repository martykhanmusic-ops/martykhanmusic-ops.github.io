const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {existsSync}=require('node:fs');
const origin=process.env.HALO_TEST_URL||'http://127.0.0.1:4173';
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try{
    const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    const click=name=>page.getByRole('button',{name,exact:true}).click();
    await page.goto(`${origin}/halo/?world=1`);
    await click('＋ New project');await page.locator('#project-form input[name="name"]').fill('World session');await click('Create project ↗');
    await page.getByLabel('Working notes').fill('Original saved note');await click('Save project');
    const projectId=await page.evaluate(()=>JSON.parse(localStorage.getItem('halo.workspace.v1')).activeProjectId);
    await click('Enter Halo World');await page.waitForFunction(()=>document.body.dataset.mode==='world');
    await page.keyboard.down('KeyW');await page.waitForFunction(()=>Number(document.querySelector('.world-root')?.dataset.avatarZ)<2.8);await page.keyboard.up('KeyW');
    await page.keyboard.down('KeyA');await page.waitForFunction(()=>document.querySelector('.world-root')?.dataset.nearby==='projects');await page.keyboard.up('KeyA');
    await page.screenshot({path:'/tmp/halo-world-m2.png'});
    await page.keyboard.press('KeyE');await click('Open App');
    assert.equal(await page.locator('.world-root').count(),0);
    assert.equal(await page.getByLabel('Working notes').inputValue(),'Original saved note');
    await page.getByLabel('Working notes').fill('Saved through the original Desktop editor');await click('Save project');
    await click('Enter Halo World');await page.waitForFunction(()=>document.body.dataset.mode==='world');await click('Return to Desktop');
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('halo.workspace.v1')));
    assert.equal(state.activeProjectId,projectId);assert.equal(state.projects.length,1);
    assert.equal(state.projects[0].notes,'Saved through the original Desktop editor');
    assert.deepEqual(errors,[]);await context.close();
    console.log('PASS World M2: walk to destination, proximity prompt, existing route, real edit/save, return World/Desktop, same persisted project; no page errors.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
