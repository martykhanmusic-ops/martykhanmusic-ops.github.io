import http from 'node:http';
import https from 'node:https';
import {isIP} from 'node:net';
import QRCode from 'qrcode';
import {randomBytes,randomInt,timingSafeEqual} from 'node:crypto';
import {readFile,writeFile,mkdir,chmod} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const token=()=>randomBytes(32).toString('hex');
const here=path.dirname(fileURLToPath(import.meta.url));
export function createRelay({producerToken=token(),pairCode=String(randomInt(100000,1000000)),now=Date.now,listener=null,onProducerToken=async()=>{}}={}) {
  if(listener&&(!isPrivateIPv4(listener.host)||!Number.isInteger(listener.port)||listener.port<1024||listener.port>65535||!listener.key||!listener.cert))throw Error('Listener needs a private IPv4 address, port and TLS key/certificate.');
  let admin=null,room=null,serial=0,attempts=0,changingRoom=false;
  const deadline=now()+300000;
  const handle=async(req,res,remote=false)=>{
    const port=server.address().port;
    const hosts=remote?[`${listener.host}:${listener.port}`]:[`127.0.0.1:${port}`,`localhost:${port}`];
    const origins=hosts.map(host=>`${remote?'https':'http'}://${host}`);
    const origin=req.headers.origin;
    const send=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(value===undefined?'':JSON.stringify(value));};
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    if(!hosts.includes(req.headers.host)||(!remote&&!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)))return send(403,{error:'Host denied.'});
    if(origin&&!origins.includes(origin))return send(403,{error:'Origin denied.'});
    if(req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'Cross-site denied.'});
    const auth=req.headers.authorization?.replace(/^Bearer /,'');
    const route=req.url;
    if(remote&&(req.method!=='GET'|| !['/','/player.js','/player.css','/status'].includes(route)&&!route?.startsWith('/audio?after=')))return send(403,{error:'Listener access only.'});
    if(room&&now()>=room.expires)room=null;
    try {
      if(req.method==='GET'&&['/','/player.js','/player.css'].includes(route)){
        const file=route==='/'?'index.html':route.slice(1);
        res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
        return res.end(await readFile(path.join(here,file)));
      }
      if(req.method==='POST'&&route==='/pair'){
        if(!origin||attempts>=5||now()>deadline||admin)return send(403,{error:'Pairing closed. Restart relay for a fresh code.'});
        const body=await readBody(req,128);attempts++;
        if(!equal(body.toString(),pairCode))return send(403,{error:'Pairing code denied.'});
        admin=token();return send(200,{token:admin});
      }
      if(req.method==='POST'&&route==='/room'&&equal(auth,admin)){
        if(changingRoom)return send(409,{error:'Room change in progress.'});
        changingRoom=true;room=null;producerToken=token();
        try{await onProducerToken(producerToken);}finally{changingRoom=false;}
        room={token:token(),expires:now()+3600000,packets:[],lastAudio:0,frames:0};
        const url=`${listener?`https://${listener.host}:${listener.port}`:`http://127.0.0.1:${port}`}/#${room.token}`;
        return send(200,{token:room.token,expires:room.expires,url,remote:!!listener,qr:await QRCode.toDataURL(url,{width:280,margin:2})});
      }
      if(req.method==='POST'&&route==='/revoke'&&equal(auth,admin)){if(changingRoom)return send(409,{error:'Room change in progress.'});room=null;producerToken=token();return send(200,{revoked:true});}
      if(req.method==='GET'&&route==='/status'&&(!remote&&equal(auth,admin)||equal(auth,room?.token)))return send(200,{active:!!room,receiving:!!room?.lastAudio&&now()-room.lastAudio<1000,frames:room?.frames||0,expires:room?.expires||null});
      if(req.method==='POST'&&route==='/audio'&&equal(auth,producerToken)){
        // Native producer only. A browser never receives the producer credential.
        if(origin)return send(403,{error:'Native producer required.'});
        if(!room)return send(409,{error:'No active room.'});
        const producer=req.headers['x-halo-producer'];
        if(typeof producer!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(producer))return send(400,{error:'Producer identity required.'});
        if(room.producer&&room.producer!==producer)return send(409,{error:'Another producer owns this room. Open a new room to switch.'});
        const active=room;
        const packet=await readBody(req,32792);
        if(room!==active)return send(409,{error:'Room revoked.'});
        validatePacket(packet);
        if(room.producer&&room.producer!==producer)return send(409,{error:'Producer conflict.'});
        room.producer=producer;
        room.lastAudio=now();room.frames+=packet.readUInt32LE(12);
        room.packets.push({id:++serial,time:now(),packet});
        room.packets=room.packets.filter(p=>now()-p.time<500).slice(-16);
        return send(200,{accepted:true});
      }
      if(req.method==='GET'&&route?.startsWith('/audio?after=')&&equal(auth,room?.token)){
        const after=Number(route.slice('/audio?after='.length));
        if(!Number.isSafeInteger(after)||after<0)return send(400,{error:'Invalid cursor.'});
        room.packets=room.packets.filter(p=>now()-p.time<500);
        const next=room.packets.find(p=>p.id>after);
        if(!next)return send(204);
        res.writeHead(200,{'Content-Type':'application/octet-stream','X-Halo-Cursor':String(next.id)});return res.end(next.packet);
      }
      return send(403,{error:'Permission denied or room revoked.'});
    }catch(error){if(!res.headersSent)send(400,{error:error.message});else res.end();}
  };
  const server=http.createServer((req,res)=>handle(req,res));
  const listenerServer=listener?https.createServer({key:listener.key,cert:listener.cert,minVersion:'TLSv1.2'},(req,res)=>handle(req,res,true)):null;
  server.requestTimeout=3000;server.headersTimeout=3000;
  if(listenerServer){listenerServer.requestTimeout=3000;listenerServer.headersTimeout=3000;}
  return {server,listenerServer,get producerToken(){return producerToken;},pairCode};
}
export function isPrivateIPv4(host){if(isIP(host)!==4)return false;const [a,b]=host.split('.').map(Number);return a===10||a===192&&b===168||a===172&&b>=16&&b<=31;}
async function readBody(req,max){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>max)throw Error('Request too large.');chunks.push(chunk);}return Buffer.concat(chunks);}
export function validatePacket(packet){
  if(packet.length<24||packet.toString('ascii',0,4)!=='HALO'||packet.readUInt32LE(4)!==1)throw Error('Invalid PCM packet.');
  const rate=packet.readUInt32LE(8),count=packet.readUInt32LE(12);
  if(rate<8000||rate>192000||count<1||count>4096||packet.length!==24+count*8)throw Error('Invalid PCM format.');
  for(let i=24;i<packet.length;i+=4)if(!Number.isFinite(packet.readFloatLE(i)))throw Error('Non-finite audio.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.platform!=='win32')throw Error('This producer setup requires Windows.');
  const options=Object.fromEntries(process.argv.slice(2).map(item=>{const split=item.indexOf('=');if(split<0)throw Error('Options require --name=value.');return [item.slice(0,split),item.slice(split+1)];}));
  if(Object.keys(options).some(key=>!['--listen-host','--cert','--key'].includes(key)))throw Error('Unknown option.');
  let listener=null;
  if(Object.keys(options).length){if(!options['--listen-host']||!options['--cert']||!options['--key'])throw Error('Supply --listen-host, --cert and --key together.');listener={host:options['--listen-host'],port:8443,cert:await readFile(options['--cert']),key:await readFile(options['--key'])};}
  // Rotate the producer credential each launch, in the current user's profile.
  const directory=path.join(process.env.LOCALAPPDATA,'Halo','LiveListen');
  await mkdir(directory,{recursive:true});
  const relay=createRelay({listener,onProducerToken:value=>writeFile(path.join(directory,'producer-token'),value,{mode:0o600})});
  await new Promise((resolve,reject)=>{relay.server.once('error',reject);relay.server.listen(4176,'127.0.0.1',resolve);});
  await writeFile(path.join(directory,'producer-token'),relay.producerToken,{mode:0o600});
  await chmod(path.join(directory,'producer-token'),0o600);
  if(listener)await new Promise((resolve,reject)=>{relay.listenerServer.once('error',reject);relay.listenerServer.listen(listener.port,listener.host,resolve);});
  console.log('Halo Live Listen: http://127.0.0.1:4176\nPairing code (5 minutes): '+relay.pairCode+'\n'+(listener?'HTTPS listener enabled on the selected private interface.':'Loopback only. No iPhone network endpoint is enabled.'));
}
