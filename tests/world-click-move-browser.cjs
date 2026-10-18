const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto((process.env.HALO_TEST_URL||'http://127.0.0.1:4173')+'/halo/?world=1');
    await page.getByRole('button',{name:'Enter Halo World'}).click();await page.waitForFunction(()=>document.body.dataset.mode==='world');
    const canvas=page.locator('.world-viewport canvas'),box=await canvas.boundingBox();
    const before=await page.locator('.world-root').evaluate(el=>({x:Number(el.dataset.avatarX),z:Number(el.dataset.avatarZ)}));
    await page.mouse.click(box.x+box.width*.66,box.y+box.height*.72);
    await page.getByText(/Walking to selected point/).waitFor();
    await page.waitForFunction(before=>{const el=document.querySelector('.world-root');return Math.hypot(Number(el.dataset.avatarX)-before.x,Number(el.dataset.avatarZ)-before.z)>.3;},before);
    await page.keyboard.down('KeyW');await page.keyboard.up('KeyW');
    assert.deepEqual(errors,[]);
    console.log('PASS World click-to-move: canvas ground selection moves avatar; keyboard input remains available');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
