const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const findings=[];
  try{
    for(const width of [1280,390]){
      const context=await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390}),page=await context.newPage();
      await page.goto((process.env.HALO_TEST_URL||'http://127.0.0.1:4173')+'/halo/?world=1');
      if(width===390){await page.getByRole('button',{name:'Controls & Accessibility'}).click();await page.getByRole('dialog',{name:'Controls and accessibility'}).getByLabel('Enable touch World on this device').check();await page.getByRole('button',{name:'Close'}).click();}
      await page.getByRole('button',{name:'Enter Halo World'}).click();await page.waitForFunction(()=>document.body.dataset.mode==='world');
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      for(const state of ['plaza','destination','settings']){
        if(state==='destination'){await page.locator('.world-destinations summary').click();await page.locator('.world-destinations button').filter({hasText:'Creative'}).click();}
        if(state==='settings'){await page.getByRole('button',{name:'Back to plaza'}).click();await page.locator('#world-controls').click();}
        const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
        for(const violation of result.violations)findings.push({width,state,id:violation.id,nodes:violation.nodes.map(node=>node.target.join(' '))});
      }
      await context.close();
    }
    assert.deepEqual(findings,[]);
    console.log('PASS World accessibility: axe WCAG 2.2 AA tags for desktop/mobile plaza, destination and settings');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
