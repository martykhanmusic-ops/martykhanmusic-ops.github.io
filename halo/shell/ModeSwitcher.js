import {connectApplicationSession} from '../shared/ApplicationSessionBridge.js';
import {destinations,destinationRoute} from '../world/DestinationRegistry.js';
import {createWorkstation} from '../world/WorldWorkstation.js';
export function installModeSwitcher(){
  if(document.querySelector('#enter-world')||!document.querySelector('.shell'))return;
  const shell=document.querySelector('.shell'),dock=document.querySelector('.floating-dock');
  const button=document.createElement('button');button.id='enter-world';button.className='world-mode-entry';button.textContent='Enter Halo World';
  document.querySelector('.topbar').append(button);
  let instance=null,root=null,generation=0,position,previousFocus,session;
  const workstation=createWorkstation(shell);
  document.addEventListener('focusin',event=>{
    if(event.target!==button&&(shell.contains(event.target)||dock?.contains(event.target)))previousFocus=event.target;
  });
  function interaction(destination){
    if(!root||workstation.isOpen()||destination.availability!=='available')return;
    instance.pause();root.querySelector('.world-actions')?.remove();
    const panel=document.createElement('section');panel.className='world-actions';panel.setAttribute('aria-label',`${destination.label} interaction`);
    const title=document.createElement('h2');title.textContent=destination.label;panel.append(title);
    const open=document.createElement('button');open.textContent='Open App';panel.append(open);
    open.onclick=()=>{const route=destinationRoute(destination,session.getState());desktop();session.openRoute(route);};
    const state=session.getState();
    if(destination.workstationAdapter && state.activeProjectId){
      const use=document.createElement('button');use.textContent='Use in World';panel.append(use);
      use.onclick=()=>{if(workstation.open(root,destination,session,()=>{root.focus();instance.resume();})){panel.remove();}else{const status=panel.querySelector('p')||document.createElement('p');status.textContent='Select a saved project on Desktop before using a workstation.';panel.append(status);}};
    }else{const hint=document.createElement('p');hint.textContent='Open App to create or select a project before using the workstation.';panel.append(hint);}
    const cancel=document.createElement('button');cancel.textContent='Back to plaza';panel.append(cancel);
    cancel.onclick=()=>{panel.remove();root.focus();instance.resume();};
    root.append(panel);open.focus();
  }
  function desktop(message=''){
    workstation.park();
    generation++;if(instance){position=instance.getPosition();instance.dispose();instance=null;}
    root?.remove();root=null;shell.hidden=false;shell.inert=false;if(dock){dock.hidden=false;dock.inert=false;}
    button.disabled=false;document.body.dataset.mode='desktop';
    if(message){const status=document.querySelector('#status');status.textContent=message;status.classList.add('error');}
    (previousFocus?.isConnected?previousFocus:button).focus();
  }
  button.addEventListener('click',async()=>{
    if(root)return;
    if(matchMedia('(max-width: 699px), (pointer: coarse)').matches){desktop('Halo World currently requires a desktop keyboard. All features remain available in Desktop.');return;}
    if(!previousFocus)previousFocus=document.activeElement;const ticket=++generation;button.disabled=true;
    if(!document.querySelector('[data-world-styles]')){const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('../world/world-mode.css',import.meta.url).href;style.dataset.worldStyles='';document.head.append(style);}
    root=document.createElement('section');root.className='world-root';root.tabIndex=0;root.setAttribute('aria-label','Halo World');root.innerHTML='<div class="world-viewport"></div><div class="world-hud"><div class="world-info"><h1>Halo World</h1><p>Experimental central plaza · local session only</p><p>↑/↓ move · ←/→ turn · WASD strafe · Space jump · Shift run · E interact</p></div><button id="exit-world">Return to Desktop</button></div><div id="world-prompt" class="world-status" role="status">Loading the plaza…</div>';
    document.body.append(root);root.querySelector('#exit-world').onclick=()=>desktop();
    root.addEventListener('keydown',event=>{
      if(event.code!=='Escape'||workstation.isOpen()||!instance)return;
      event.preventDefault();
      const action=root.querySelector('.world-actions');
      if(action){action.querySelector('button:last-of-type')?.click();return;}
      const paused=root.querySelector('.world-pause');
      if(paused){paused.remove();root.focus();instance.resume();return;}
      instance.pause();
      const panel=document.createElement('section');panel.className='world-actions world-pause';panel.setAttribute('aria-label','World paused');
      const title=document.createElement('h2');title.textContent='World paused';
      const resume=document.createElement('button');resume.textContent='Resume World';resume.onclick=()=>{panel.remove();root.focus();instance.resume();};
      panel.append(title,resume);root.append(panel);resume.focus();
    });
    try{
      // Probe before constructing Three so unsupported GPUs fail without engine
      // errors or any dependency on successful initialization of Desktop.
      const probe=document.createElement('canvas');const gl=probe.getContext('webgl2')||probe.getContext('webgl');
      if(!gl)throw new Error('WebGL is not supported.');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      const {mountWorld}=await import('../world/HaloWorld.js');if(ticket!==generation)return;
      session=connectApplicationSession();
      const accessible=document.createElement('button');accessible.textContent='Projects destination';accessible.onclick=()=>interaction(destinations[0]);root.querySelector('.world-info').append(accessible);
      instance=mountWorld(root,{position,onFailure:desktop,onInteract:interaction});
      if(ticket!==generation){instance.dispose();instance=null;return;}
      shell.hidden=true;shell.inert=true;if(dock){dock.hidden=true;dock.inert=true;}
      document.body.dataset.mode='world';button.disabled=false;root.focus();instance.resume();
    }catch(error){if(ticket===generation)desktop('Halo World could not initialize graphics. Desktop and your unsaved session are still available.');}
  });
}
