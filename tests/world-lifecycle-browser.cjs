const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {existsSync}=require('node:fs');
const origin=process.env.HALO_TEST_URL||'http://127.0.0.1:4173';
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const errors=[];
  async function context(script){const c=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});if(script)await c.addInitScript(script);const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return {c,p};}
  async function enter(p){await p.getByRole('button',{name:'Enter Halo World',exact:true}).click();await p.waitForFunction(()=>document.body.dataset.mode==='world');}
  try{
    // The same editor node, draft, selection and focus survive repeated sessions.
    const {c,p}=await context();await p.goto(`${origin}/halo/?world=1`);
    await p.getByRole('button',{name:'＋ New project',exact:true}).click();await p.locator('#project-form input[name="name"]').fill('Lifecycle');await p.getByRole('button',{name:'Create project ↗',exact:true}).click();
    await p.getByLabel('Working notes').fill('Saved base');await p.getByRole('button',{name:'Save project',exact:true}).click();
    await p.getByLabel('Working notes').fill('Unsaved draft kept in the original DOM');
    await p.getByLabel('Working notes').evaluate(el=>{el.setSelectionRange(3,11);window.originalEditor=el;});
    const saved=await p.evaluate(()=>localStorage.getItem('halo.workspace.v1'));
    for(let i=0;i<4;i++){
      await enter(p);await p.getByRole('button',{name:'Return to Desktop',exact:true}).click();
      assert.equal(await p.getByLabel('Working notes').evaluate(el=>el===window.originalEditor&&el===document.activeElement),true);
      assert.equal(await p.getByLabel('Working notes').inputValue(),'Unsaved draft kept in the original DOM');
      assert.equal(await p.locator('canvas').count(),0);assert.equal(await p.locator('.shell').count(),1);
    }
    assert.equal(await p.evaluate(()=>localStorage.getItem('halo.workspace.v1')),saved);
    await enter(p);
    await p.locator('canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');gl.getExtension('WEBGL_lose_context').loseContext();});
    await p.waitForFunction(()=>document.body.dataset.mode==='desktop');assert.match(await p.locator('#status').textContent(),/context was lost/);
    assert.equal(await p.getByLabel('Working notes').inputValue(),'Unsaved draft kept in the original DOM');
    await enter(p);p.once('dialog',dialog=>dialog.accept());await p.reload();
    assert.equal(await p.locator('.world-root').count(),0);assert.equal(await p.getByLabel('Working notes').inputValue(),'Saved base');
    // Cancelling a pending lazy import must not create a late canvas or mount.
    const race=await context();let release;const held=new Promise(resolve=>{release=resolve;});
    await race.p.route('**/world/vendor/three.module.js',async route=>{await held;await route.continue();});
    await race.p.goto(`${origin}/halo/?world=1`);await race.p.getByRole('button',{name:'Enter Halo World',exact:true}).click();
    await race.p.getByRole('button',{name:'Return to Desktop',exact:true}).click();release();await race.p.waitForTimeout(400);
    assert.equal(await race.p.locator('canvas').count(),0);assert.equal(await race.p.locator('.shell').isVisible(),true);await race.c.close();
    // Unsupported WebGL never hides/changes the original Desktop.
    const noGpu=await context(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/.test(kind)?null:get.call(this,kind,...args);};});
    await noGpu.p.goto(`${origin}/halo/?world=1`);await noGpu.p.getByRole('button',{name:'Enter Halo World',exact:true}).click();
    await noGpu.p.waitForFunction(()=>document.body.dataset.mode==='desktop');assert.equal(await noGpu.p.locator('.shell').isVisible(),true);assert.equal(await noGpu.p.locator('canvas').count(),0);await noGpu.c.close();
    // Measured slow timestamps exercise the sustained-low-performance fallback;
    // this is a simulated frame condition, not a hardware benchmark.
    const slow=await context(()=>{const frame=window.requestAnimationFrame;window.requestAnimationFrame=cb=>frame.call(window,time=>cb(time*10));});
    await slow.p.goto(`${origin}/halo/?world=1`);await enter(slow.p);await slow.p.waitForFunction(()=>document.body.dataset.mode==='desktop');
    assert.match(await slow.p.locator('#status').textContent(),/running slowly/);assert.equal(await slow.p.locator('canvas').count(),0);await slow.c.close();
    assert.deepEqual(errors,[]);await c.close();
    console.log('PASS World M3: unchanged saved state, original unsaved editor/focus, repeated disposal, actual context loss, reload, cancelled import race, unsupported WebGL and simulated slow-frame fallback; no page errors.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
