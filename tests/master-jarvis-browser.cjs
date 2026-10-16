const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {existsSync}=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
 try{for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto((process.env.HALO_TEST_URL||'http://127.0.0.1:4173')+'/halo/');
  await page.getByRole('button',{name:'＋ New project',exact:true}).click();
  await page.getByLabel('Project name',{exact:true}).fill('Jarvis recovery');
  await page.getByRole('button',{name:'Create project ↗',exact:true}).click();
  await page.getByRole('button',{name:'✧ Open Jarvis',exact:true}).click();
  await page.locator('#plan-input').fill('Cancelled task');
  await page.getByRole('button',{name:'Generate plan ↗',exact:true}).click();
  await page.getByRole('button',{name:'Cancel job',exact:true}).click();
  await page.reload();
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('halo.workspace.v1')));
  assert.equal((await state()).jobs[0].status,'cancelled');assert.equal((await state()).projects[0].tasks.length,0);
  await page.locator('#plan-input').fill('Recovered task');
  await page.getByRole('button',{name:'Generate plan ↗',exact:true}).click();
  // Hold the real adapter's pre-commit delay to simulate a tab closing after
  // the persisted running transition, before any effect is committed.
  await page.evaluate(()=>{const original=window.setTimeout;window.setTimeout=(fn,ms,...args)=>ms===100?0:original(fn,ms,...args);});
  await page.getByRole('button',{name:'Run job',exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('halo.workspace.v1')).jobs[0].status==='running');
  await page.reload();
  let snapshot=await state();assert.equal(snapshot.jobs[0].status,'failed');assert.equal(snapshot.projects[0].tasks.length,0);
  assert.equal(snapshot.jobs[0].logs.at(-1).event,'interrupted');
  await page.getByRole('button',{name:'Review & retry',exact:true}).click();
  assert.equal((await state()).jobs[0].status,'pending');
  await page.getByRole('button',{name:'Run job',exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('halo.workspace.v1')).jobs[0].status==='completed');
  await page.reload();snapshot=await state();
  assert.equal(snapshot.projects[0].tasks.length,1);assert.equal(snapshot.projects[0].tasks[0].title,'Recovered task');
  assert.deepEqual(snapshot.jobs[0].logs.map(l=>l.event),['planned','started','interrupted','retry','started','verified']);
  await page.locator('.job-card').first().getByRole('button',{name:'Open linked project',exact:true}).click();
  assert.equal(await page.getByRole('checkbox',{name:'Recovered task',exact:true}).count(),1);
  assert.equal(await page.getByRole('checkbox',{name:'Cancelled task',exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
  await context.close();console.log(`PASS master Jarvis ${width}px: cancel/reopen without effects, interrupted real adapter/reload, explicit retry, one verified shared task, persistent audit, no console/page errors or overflow.`);
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
