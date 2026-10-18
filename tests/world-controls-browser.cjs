const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto((process.env.HALO_TEST_URL||'http://127.0.0.1:4173')+'/halo/?world=1');
    await page.getByRole('button',{name:'Controls & Accessibility'}).click();
    const dialog=page.getByRole('dialog',{name:'Controls and accessibility'});
    await dialog.getByRole('button',{name:'interact: KeyE'}).click();
    await page.keyboard.press('KeyF');
    await dialog.getByRole('button',{name:'interact: KeyF'}).waitFor();
    await dialog.getByLabel('High contrast World HUD').check();
    await dialog.getByLabel('Simplified World HUD').check();
    await dialog.getByRole('button',{name:'Close'}).click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('halo.world.controls.v1')).bindings.interact),'KeyF');
    await page.getByRole('button',{name:'Enter Halo World'}).click();
    await page.waitForFunction(()=>document.body.dataset.mode==='world');
    assert.equal(await page.locator('.world-root').getAttribute('data-high-contrast'),'true');
    assert.equal(await page.locator('.world-root').getAttribute('data-simplified-hud'),'true');
    await page.locator('.world-destinations summary').click();
    const destinations=page.locator('.world-destinations button');
    assert.equal(await destinations.count(),8);
    await destinations.filter({hasText:'Creative'}).click();
    await page.getByText(/This portal is planned; no application has opened/).waitFor();
    await page.getByRole('button',{name:'Back to plaza'}).click();
    await page.locator('#world-controls').click();
    await dialog.getByRole('button',{name:'Reset controls'}).click();
    await dialog.getByRole('button',{name:'interact: KeyE'}).waitFor();
    await dialog.getByRole('button',{name:'Close'}).click();
    await page.getByRole('button',{name:'Return to Desktop'}).click();
    await page.keyboard.press('KeyJ');
    await page.getByRole('log',{name:'Jarvis conversation'}).waitFor();
    assert.deepEqual(errors,[]);
    console.log('PASS World controls: persisted key remap/reset, accessible 2D destination list, truthful planned status, Desktop return');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
