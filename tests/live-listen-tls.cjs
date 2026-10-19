// Generates temporary test certificates; never installs trust or opens a LAN socket.
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),https=require('node:https');
const {execFileSync}=require('node:child_process');const assert=require('node:assert/strict');
(async()=>{const {createRelay}=await import('../live-listen/relay/server.mjs');const folder=await fs.mkdtemp(path.join(os.tmpdir(),'halo-tls-test-'));let relay;
try{
 const key=path.join(folder,'key.pem'),cert=path.join(folder,'cert.pem');
 execFileSync('C:/Program Files/Git/usr/bin/openssl.exe',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-keyout',key,'-out',cert,'-subj','/CN=localhost','-addext','subjectAltName=IP:127.0.0.1'],{stdio:'ignore',windowsHide:true});
 const ca=await fs.readFile(cert);relay=createRelay({listener:{host:'192.168.1.207',port:18443,key:await fs.readFile(key),cert:ca}});
 await new Promise(resolve=>relay.server.listen(0,'127.0.0.1',resolve));await new Promise(resolve=>relay.listenerServer.listen(18443,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${relay.server.address().port}`;
 const admin=(await(await fetch(base+'/pair',{method:'POST',body:relay.pairCode,headers:{Origin:base}})).json()).token;
 const room=await(await fetch(base+'/room',{method:'POST',headers:{Authorization:`Bearer ${admin}`}})).json();
 const get=(url,token,method='GET',origin='https://192.168.1.207:18443')=>new Promise((resolve,reject)=>{const req=https.request({host:'127.0.0.1',port:18443,path:url,method,ca,headers:{Host:'192.168.1.207:18443',Authorization:`Bearer ${token}`,Origin:origin}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end();});
 assert.equal(await get('/status',room.token),200);assert.equal(await get('/status',admin),403);
 for(const endpoint of ['/pair','/room','/revoke','/audio'])assert.equal(await get(endpoint,admin,'POST'),403);
 assert.equal(await get('/status',room.token,'GET','https://evil.test'),403);
 await fetch(base+'/revoke',{method:'POST',headers:{Authorization:`Bearer ${admin}`}});assert.equal(await get('/audio?after=0',room.token),403);
 console.log('PASS HTTPS listener: certificate validated, listening token works, all producer/admin paths denied, bad origin denied, revocation enforced. Bound only to loopback for this test.');
}finally{if(relay){relay.server.closeAllConnections();relay.listenerServer.closeAllConnections();await Promise.all([new Promise(r=>relay.server.close(r)),new Promise(r=>relay.listenerServer.close(r))]);}assert.equal(path.dirname(folder),os.tmpdir());assert.ok(path.basename(folder).startsWith('halo-tls-test-'));await fs.rm(folder,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exit(1)});
