const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {existsSync}=require('node:fs');
const origin=process.env.HALO_TEST_URL||'http://127.0.0.1:4173';
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try{
    const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[],requests=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
    await page.goto(`${origin}/halo/`);assert.equal(await page.locator('#enter-world').count(),0);
    assert.equal(requests.some(url=>url.includes('three.module')||url.includes('HaloWorld.js')),false);
    await page.goto(`${origin}/halo/?world=1`);await page.getByRole('button',{name:'Enter Halo World',exact:true}).click();
    await page.waitForFunction(()=>document.body.dataset.mode==='world');
    assert.equal(await page.locator('.world-viewport canvas').count(),1);
    await page.keyboard.down('KeyW');await page.waitForTimeout(1000);await page.keyboard.up('KeyW');
    assert.ok(Number(await page.locator('.world-root').getAttribute('data-avatar-z'))<7);
    await page.keyboard.down('KeyA');await page.waitForTimeout(1500);await page.keyboard.up('KeyA');
    assert.ok(Number(await page.locator('.world-root').getAttribute('data-avatar-x'))<0);
    await page.getByRole('button',{name:'Return to Desktop',exact:true}).click();
    assert.equal(await page.locator('.world-viewport canvas').count(),0);assert.equal(await page.locator('.shell').isVisible(),true);
    await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Enter Halo World',exact:true}).click();
    assert.equal(await page.locator('.world-root').count(),0);assert.match(await page.locator('#status').textContent(),/requires a desktop keyboard/);
    assert.deepEqual(errors,[]);await context.close();
    console.log('PASS World M1: default-off lazy loading, WebGL plaza, keyboard movement, disposal, Desktop return, mobile fallback; no page errors.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
