// Self-contained local static server avoids stale external test-server sessions.
const http=require('node:http');
const {readFile,stat}=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204).end();return;}
  try{
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(data);
  }catch{res.writeHead(404).end();}
});
(async()=>{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin=`http://127.0.0.1:${server.address().port}`;
  try{
    const suites=process.argv.slice(2);
    for(const suite of suites.length?suites:['tests/world-browser.cjs','tests/world-session-browser.cjs','tests/world-lifecycle-browser.cjs','tests/world-workstation-browser.cjs']){
      await new Promise((resolve,reject)=>{
        const child=spawn(process.execPath,[suite],{cwd:root,stdio:'inherit',env:{...process.env,HALO_TEST_URL:origin}});
        child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error(`${suite} failed (${code})`)));
      });
    }
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.message);process.exit(1);});
