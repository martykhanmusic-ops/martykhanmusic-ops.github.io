import http from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRelay,validatePacket,isPrivateIPv4} from '../live-listen/relay/server.mjs';

export function pcm(){const b=Buffer.alloc(24+8*16);b.write('HALO');b.writeUInt32LE(1,4);b.writeUInt32LE(48000,8);b.writeUInt32LE(16,12);for(let i=24;i<b.length;i+=4)b.writeFloatLE(.1,i);return b;}
test('Live Listen enforces host/origin, pairing, scoped tokens, bounded PCM, rotation and expiry',async()=>{
  let clock=Date.now();const relay=createRelay({now:()=>clock});
  await new Promise(resolve=>relay.server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${relay.server.address().port}`;
  const call=(route,token,method='GET',body,extra={})=>fetch(base+route,{method,body,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(route==='/audio'?{'X-Halo-Producer':'test'}:{}),...extra}});
  try{
    assert.equal((await call('/pair','','POST',relay.pairCode,{Origin:'https://evil.test'})).status,403);
    assert.equal(await new Promise(resolve=>{http.get(base,{headers:{Host:'evil.test'}},response=>{response.resume();resolve(response.statusCode);});}),403);
    const admin=(await(await call('/pair','','POST',relay.pairCode,{Origin:base})).json()).token;
    assert.equal((await call('/pair','','POST',relay.pairCode,{Origin:base})).status,403);
    assert.equal((await call('/audio',relay.producerToken,'POST',pcm())).status,409);
    const room=await(await call('/room',admin,'POST')).json();assert.match(room.qr,/^data:image\/png;base64,/);
    assert.equal((await call('/revoke',room.token,'POST')).status,403);
    assert.equal((await call('/audio',room.token,'POST',pcm())).status,403);
    assert.equal((await call('/audio',relay.producerToken,'POST',pcm(),{Origin:base})).status,403);
    const bad=pcm();bad.writeFloatLE(NaN,24);assert.equal((await call('/audio',relay.producerToken,'POST',bad)).status,400);
    assert.equal((await call('/audio',relay.producerToken,'POST',pcm())).status,200);
    const audio=await call('/audio?after=0',room.token);assert.equal(audio.status,200);assert.deepEqual(Buffer.from(await audio.arrayBuffer()),pcm());
    clock+=501;assert.equal((await call('/audio?after=0',room.token)).status,204);
    const second=await(await call('/room',admin,'POST')).json();assert.equal((await call('/status',room.token)).status,403);
    assert.equal((await call('/audio?after=0',second.token)).status,204);
    clock+=3600001;assert.equal((await call('/status',second.token)).status,403);
    const third=await(await call('/room',admin,'POST')).json();await call('/revoke',admin,'POST');assert.equal((await call('/audio?after=0',third.token)).status,403);
    assert.equal((await call('/audio',relay.producerToken,'POST',pcm())).status,409);
    for(const host of ['0.0.0.0','8.8.8.8','127.0.0.1','::1','example.com'])assert.equal(isPrivateIPv4(host),false);
    assert.equal(isPrivateIPv4('192.168.1.207'),true);assert.throws(()=>validatePacket(Buffer.alloc(4)));
  }finally{relay.server.closeAllConnections();await new Promise(resolve=>relay.server.close(resolve));}
});
