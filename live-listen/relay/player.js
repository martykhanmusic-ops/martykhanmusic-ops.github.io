const $=id=>document.getElementById(id);
let admin='',room='',context=null,gain=null,playing=false,cursor=0,nextTime=0,run=0,lastSequence=null;
const sources=new Set();
const status=text=>{$('status').textContent=text;};
async function request(route,token,method='GET',body){
  const response=await fetch(route,{method,headers:token?{Authorization:`Bearer ${token}`}:{},body,cache:'no-store',signal:AbortSignal.timeout(2500)});
  if(!response.ok)throw Error(response.status===403?'Permission denied or room revoked.':`Relay unavailable (${response.status}).`);
  return response;
}
$('pair-form').addEventListener('submit',async event=>{event.preventDefault();try{admin=(await(await request('/pair','','POST',$('pair-code').value)).json()).token;$('pair-code').value='';$('create').disabled=false;status('Producer paired. Open a room when ready.');}catch(error){status(error.message);}});
$('create').onclick=async()=>{try{stop();const data=await(await request('/room',admin,'POST')).json();room=data.token;$('room-token').value=room;$('invite').value=data.url;$('qr').src=data.qr;$('qr').hidden=false;$('network').textContent=data.remote?'Scan on your iPhone on the same private network. Safari must trust the configured TLS certificate.':'Local PC link only. HTTPS listener is not configured.';$('revoke').disabled=false;status('Room open for one hour. Enable Send to local relay in the VST3, then start listening.');}catch(error){status(error.message);}};
$('revoke').onclick=async()=>{try{await request('/revoke',admin,'POST');stop();room='';$('room-token').value='';$('invite').value='';$('qr').hidden=true;$('qr').removeAttribute('src');$('revoke').disabled=true;status('Room revoked. All listener credentials are invalid.');}catch(error){stop();status(error.message);}};
function stop(){playing=false;run++;for(const source of sources){try{source.stop();}catch{}}sources.clear();if(context)context.close().catch(()=>{});context=null;$('stop').disabled=true;$('listen').disabled=false;}
$('stop').onclick=()=>{stop();status('Listening stopped.');};
$('volume').oninput=()=>{if(gain)gain.gain.value=Number($('volume').value);};
$('listen').onclick=async()=>{
  stop();room=$('room-token').value.trim();if(!/^[a-f0-9]{64}$/.test(room)){status('Enter a valid room token.');return;}
  const generation=++run;const active=new AudioContext();context=active;gain=active.createGain();gain.gain.value=Number($('volume').value);gain.connect(active.destination);
  try{await active.resume();if(generation!==run)return;await request('/status',room);if(generation!==run)return;playing=true;cursor=0;lastSequence=null;nextTime=active.currentTime;$('stop').disabled=false;$('listen').disabled=true;status('Connected. Waiting for captured audio.');poll(generation);}catch(error){if(generation===run){stop();status(error.message);}}
};
async function poll(generation){
  let silentSince=performance.now();
  while(playing&&generation===run){
    try{
      const response=await request(`/audio?after=${cursor}`,room);
      if(generation!==run)return;
      if(response.status===204){if(performance.now()-silentSince>1000)status('Connected; no recent audio. Check the DAW and VST3 capture switch.');await new Promise(resolve=>setTimeout(resolve,25));continue;}
      const bytes=await response.arrayBuffer();if(generation!==run)return;
      const view=new DataView(bytes),rate=view.getUint32(8,true),count=view.getUint32(12,true),sequence=view.getBigUint64(16,true);
      if(bytes.byteLength!==24+count*8||count>4096||rate<8000||rate>192000)throw Error('Invalid audio format.');
      cursor=Number(response.headers.get('X-Halo-Cursor'));
      const gap=lastSequence!==null&&sequence!==lastSequence;lastSequence=sequence+BigInt(count);
      if(nextTime-context.currentTime>.25){for(const source of sources){try{source.stop();}catch{}}sources.clear();nextTime=context.currentTime;}
      const buffer=context.createBuffer(2,count,rate);
      for(let channel=0;channel<2;channel++){const target=buffer.getChannelData(channel);for(let i=0;i<count;i++)target[i]=Math.max(-1,Math.min(1,view.getFloat32(24+i*8+channel*4,true)));}
      const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);sources.add(source);source.onended=()=>sources.delete(source);
      nextTime=Math.max(nextTime,context.currentTime+.04);source.start(nextTime);nextTime+=count/rate;silentSince=performance.now();
      status(gap?'Receiving audio; a capture gap was detected.':'Receiving captured audio.');$('metrics').textContent=`${rate} Hz · local queued audio ${Math.round((nextTime-context.currentTime)*1000)} ms (not end-to-end latency)`;
    }catch(error){if(generation===run){stop();status(error.message);}return;}
  }
}
if(/^#[a-f0-9]{64}$/.test(location.hash)){$('room-token').value=location.hash.slice(1);history.replaceState(null,'',location.pathname);}
addEventListener('pagehide',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){stop();status('Listening stopped while this page was hidden.');}});

if(location.protocol==='https:')document.querySelector('section').hidden=true;
