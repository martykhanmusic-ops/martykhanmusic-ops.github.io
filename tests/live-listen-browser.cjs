const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
(async()=>{
  const {createRelay}=await import('../live-listen/relay/server.mjs');
  const browser=await chromium.launch({executablePath:process.env.HALO_CHROMIUM_PATH,headless:true});
  try{for(const width of [1440,390]){
    const profile=await fs.mkdtemp(path.join(os.tmpdir(),'halo-relay-test-'));
    const directory=path.join(profile,'Halo','LiveListen');await fs.mkdir(directory,{recursive:true});
    const relay=createRelay({onProducerToken:token=>fs.writeFile(path.join(directory,'producer-token'),token)});
    await new Promise((resolve,reject)=>{relay.server.once('error',reject);relay.server.listen(4176,'127.0.0.1',resolve);});
    const page=await browser.newPage({viewport:{width,height:900}});let child;
    try{
      await page.goto('http://127.0.0.1:4176/');await page.locator('#pair-code').fill(relay.pairCode);await page.getByRole('button',{name:'Pair producer controls'}).click();
      await page.locator('#create').click();await page.waitForFunction(()=>document.getElementById('invite').value.includes('/#'));
      assert.equal(await page.locator('#qr').isVisible(),true);
      const listener=await browser.newPage({viewport:{width,height:900}});await listener.goto(await page.locator('#invite').inputValue());
      assert.equal(new URL(listener.url()).hash,'');await listener.locator('#listen').click();await listener.getByText('Connected. Waiting for captured audio.',{exact:true}).waitFor();
      child=spawn(path.resolve('dist/live-listen-build/Release/HaloRelayTestProducer.exe'),[],{env:{...process.env,LOCALAPPDATA:profile},windowsHide:true});
      const exited=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error(`producer ${code}`)));});
      await Promise.race([listener.getByText('Receiving captured audio.',{exact:true}).waitFor(),exited.then(async()=>{const state=await page.evaluate(async()=>{const token=document.getElementById('room-token').value;return(await fetch('/status',{headers:{Authorization:`Bearer ${token}`}})).json();});throw Error(`Producer ended before browser received audio; relay=${JSON.stringify(state)}, listener=${await listener.locator('#status').textContent()}`);})]);
      const health=await page.evaluate(async()=>{const token=document.getElementById('room-token').value;return(await fetch('/status',{headers:{Authorization:`Bearer ${token}`}})).json();});assert.ok(health.frames>0);
      await page.locator('#revoke').click();await listener.getByText('Permission denied or room revoked.',{exact:true}).waitFor();
      assert.equal(await listener.locator('#listen').isEnabled(),true);
      await exited;await listener.close();
      // CSP is intentionally kept enabled for this real relay test.
      // CSP correctly forbids injected scripts; layout is checked independently.
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
      console.log(`PASS native WinHTTP generated-tone → relay → browser ${width}px; pairing, QR, audio scheduling, revocation, no overflow. Not physical DAW/iPhone evidence.`);
    }finally{if(child&&child.exitCode===null)child.kill();await page.close();relay.server.closeAllConnections();await new Promise(resolve=>relay.server.close(resolve));assert.equal(path.dirname(profile),os.tmpdir());assert.ok(path.basename(profile).startsWith('halo-relay-test-'));await fs.rm(profile,{recursive:true,force:true});}
  }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
