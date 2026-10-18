const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto((process.env.HALO_TEST_URL||'http://127.0.0.1:4173')+'/halo/?world=1');
    await page.evaluate(()=>{window.__pad={axes:[0,0],buttons:Array.from({length:8},()=>({pressed:false}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__pad]});});
    await page.getByRole('button',{name:'Enter Halo World'}).click();await page.waitForFunction(()=>document.body.dataset.mode==='world');
    await page.evaluate(()=>{window.__pad.axes[0]=1;});
    await page.waitForFunction(()=>document.querySelector('.world-root')?.dataset.nearby==='more');
    await page.evaluate(()=>{window.__pad.axes[0]=0;window.__pad.buttons[1].pressed=true;});
    await page.getByText(/This portal is planned; no application has opened/).waitFor();
    await page.evaluate(()=>{window.__pad.buttons[1].pressed=false;});
    await page.getByRole('button',{name:'Back to plaza'}).click();
    await page.getByRole('button',{name:'Return to Desktop'}).click();
    assert.deepEqual(errors,[]);
    console.log('PASS World gamepad: mapped axes move toward More and single button opens truthful portal preview');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
