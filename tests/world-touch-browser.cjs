const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto((process.env.HALO_TEST_URL||'http://127.0.0.1:4173')+'/halo/?world=1');
    await page.getByRole('button',{name:'Controls & Accessibility'}).click();
    const dialog=page.getByRole('dialog',{name:'Controls and accessibility'});
    await dialog.getByLabel('Enable touch World on this device').check();
    await dialog.getByLabel('Touch controls side').selectOption('right');
    await dialog.getByRole('button',{name:'Close'}).click();
    await page.getByRole('button',{name:'Enter Halo World'}).click();
    await page.waitForFunction(()=>document.body.dataset.mode==='world');
    const pad=page.locator('.world-touch-controls');await pad.waitFor();assert.equal(await pad.getAttribute('data-side'),'right');
    const joystick=page.locator('.world-touch-joystick'),box=await joystick.boundingBox();
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
    await page.mouse.move(box.x+box.width/2,box.y+8,{steps:8});
    await page.waitForFunction(()=>Number(document.querySelector('.world-root')?.dataset.avatarZ)<6.7);
    await page.mouse.up();
    await page.locator('.world-destinations summary').click();
    await page.locator('.world-destinations button').filter({hasText:'Creative'}).click();
    await page.getByText(/This portal is planned; no application has opened/).waitFor();
    await page.getByRole('button',{name:'Back to plaza'}).click();
    await page.getByRole('button',{name:'Return to Desktop'}).click();
    assert.deepEqual(errors,[]);await context.close();
    console.log('PASS World touch: opt-in mobile World, movable touch control, 2D destination, honest planned status and Desktop return');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
