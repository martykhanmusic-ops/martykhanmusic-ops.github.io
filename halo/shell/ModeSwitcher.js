import {connectApplicationSession} from '../shared/ApplicationSessionBridge.js';
import {destinations,destinationRoute} from '../world/DestinationRegistry.js';
import {createWorkstation} from '../world/WorldWorkstation.js';
import {createPortalInteraction} from '../world/PortalInteraction.js';
import {loadControls} from '../world/Controls.js';
import {createWorldControlsPanel} from '../world/WorldControlsPanel.js';
export function installModeSwitcher(){
  if(document.querySelector('#enter-world')||!document.querySelector('.shell'))return;
  const shell=document.querySelector('.shell'),dock=document.querySelector('.floating-dock');
  const button=document.createElement('button');button.id='enter-world';button.className='world-mode-entry';button.textContent='Enter Halo World';
  document.querySelector('.topbar').append(button);
  let instance=null,root=null,generation=0,position,previousFocus,session,portalMachine;
  const controls=loadControls();
  document.documentElement.style.setProperty('--jarvis-caption-scale',controls.captionScale);
  const settingsButton=document.createElement('button');settingsButton.type='button';settingsButton.className='world-settings-entry';settingsButton.textContent='Controls & Accessibility';document.querySelector('.topbar').append(settingsButton);
  const settings=createWorldControlsPanel(()=>controls,next=>{Object.assign(controls,next);document.documentElement.style.setProperty('--jarvis-caption-scale',controls.captionScale);if(root){root.dataset.highContrast=String(controls.highContrast);root.dataset.simplifiedHud=String(controls.simplifiedHud);root.dataset.showHints=String(controls.showHints);root.style.setProperty('--world-text-scale',controls.textScale);root.querySelector('.world-touch-controls')?.setAttribute('data-side',controls.touchSide);}},()=>instance?.pause(),()=>{if(root&&instance){root.focus();instance.resume();}else settingsButton.focus();});
  settingsButton.onclick=settings.show;
  document.addEventListener('keydown',event=>{if(event.code!==controls.bindings.jarvis||event.altKey||event.ctrlKey||event.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName)||document.querySelector('.world-settings[open]'))return;event.preventDefault();if(root&&session){desktop();session.openRoute({view:'jarvis'});}else document.querySelector('nav [data-view="jarvis"]')?.click();});
  const workstation=createWorkstation(shell);
  document.addEventListener('focusin',event=>{
    if(event.target!==button&&(shell.contains(event.target)||dock?.contains(event.target)))previousFocus=event.target;
  });
  function interaction(destination){
    if(!root||workstation.isOpen()||root.querySelector('.world-actions')||!portalMachine?.transition('preview',destination.id))return;
    instance.pause();root.querySelector('.world-actions')?.remove();
    const panel=document.createElement('section');panel.className='world-actions';panel.setAttribute('aria-label',`${destination.label} interaction`);
    const title=document.createElement('h2');title.textContent=destination.label;panel.append(title);
    if(destination.availability!=='available'){
      const unavailable=document.createElement('p');unavailable.textContent=`${destination.preview}. This portal is planned; no application has opened.`;
      const back=document.createElement('button');back.textContent='Back to plaza';back.onclick=()=>{portalMachine.transition('returning');portalMachine.transition('idle');panel.remove();root.focus();instance.resume();};
      panel.append(unavailable,back);root.append(panel);back.focus();return;
    }
    const open=document.createElement('button');open.textContent='Open App';panel.append(open);
    open.onclick=()=>{if(!portalMachine.transition('requested'))return;portalMachine.transition('transitioning');const route=destinationRoute(destination,session.getState());desktop();const opened=session.openRoute(route);if(opened)portalMachine.transition('open');portalMachine.transition('returning');portalMachine.transition('idle');};
    const state=session.getState();
    if(destination.workstationAdapter && state.activeProjectId){
      const use=document.createElement('button');use.textContent='Use in World';panel.append(use);
      use.onclick=()=>{if(!portalMachine.transition('requested'))return;portalMachine.transition('transitioning');if(workstation.open(root,destination,session,()=>{portalMachine.transition('returning');portalMachine.transition('idle');root.focus();instance.resume();})){portalMachine.transition('open');panel.remove();}else{portalMachine.transition('returning');portalMachine.transition('idle');const status=panel.querySelector('p')||document.createElement('p');status.textContent='Select a saved project on Desktop before using a workstation.';panel.append(status);}};
    }else{const hint=document.createElement('p');hint.textContent='Open App to create or select a project before using the workstation.';panel.append(hint);}
    const cancel=document.createElement('button');cancel.textContent='Back to plaza';panel.append(cancel);
    cancel.onclick=()=>{portalMachine.transition('returning');portalMachine.transition('idle');panel.remove();root.focus();instance.resume();};
    root.append(panel);if(!controls.portalConfirmation)open.click();else open.focus();
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
    if(matchMedia('(max-width: 699px), (pointer: coarse)').matches&&!controls.mobileWorld){desktop('Halo World requires a desktop keyboard unless touch World is enabled under Controls & Accessibility. All features remain available in Desktop.');return;}
    if(!previousFocus)previousFocus=document.activeElement;const ticket=++generation;button.disabled=true;
    if(!document.querySelector('[data-world-styles]')){const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('../world/world-mode.css',import.meta.url).href;style.dataset.worldStyles='';document.head.append(style);}
    root=document.createElement('section');root.className='world-root';root.tabIndex=0;root.setAttribute('aria-label','Halo World');root.innerHTML='<div class="world-viewport"></div><div class="world-hud"><div class="world-info"><h1>Halo World</h1><p>Experimental central plaza · local session only</p><p>Use your saved controls · Space jump · Shift run · E interact by default</p><details class="world-destinations"><summary>Destinations without 3D movement</summary><div></div></details></div><button id="world-controls">Controls & Accessibility</button><button id="exit-world">Return to Desktop</button></div><div id="world-prompt" class="world-status" role="status">Loading the plaza…</div>';
    document.body.append(root);root.dataset.highContrast=String(controls.highContrast);root.dataset.simplifiedHud=String(controls.simplifiedHud);root.dataset.showHints=String(controls.showHints);root.style.setProperty('--world-text-scale',controls.textScale);root.querySelector('#exit-world').onclick=()=>desktop();root.querySelector('#world-controls').onclick=settings.show;
    const destinationList=root.querySelector('.world-destinations div');
    for(const destination of destinations){const entry=document.createElement('button');entry.type='button';entry.textContent=`${destination.label}${destination.availability==='planned'?' · Planned':''}`;entry.onclick=()=>interaction(destination);destinationList.append(entry);}
    portalMachine=createPortalInteraction(({state,portalId})=>{if(root){root.dataset.portalState=state;root.dataset.portalId=portalId||'';}});
    root.dataset.portalState='idle';
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
      const jarvisAccessible=document.createElement('button');jarvisAccessible.textContent='Jarvis destination (2D)';jarvisAccessible.onclick=()=>{desktop();session.openRoute({view:'jarvis'});};root.querySelector('.world-info').append(jarvisAccessible);
      instance=mountWorld(root,{position,controls,onFailure:desktop,onInteract:interaction,onProximity:destination=>portalMachine.proximity(destination?.id==='jarvis'?null:destination?.id),
        onJarvis:()=>{desktop();session.openRoute({view:'jarvis'});},
        getJarvisState:()=>{
          const jobs=session.getState().jobs||[];
          if(jobs.some(job=>job.status==='running'))return 'executing';
          if(jobs.some(job=>job.status==='awaiting_approval'))return 'waiting';
          const latest=jobs[0];
          if(latest&&Date.now()-Date.parse(latest.updatedAt)<10000)return latest.status==='completed'?'completed':latest.status==='failed'?'error':'idle';
          return 'idle';
        }});
      if(ticket!==generation){instance.dispose();instance=null;return;}
      shell.hidden=true;shell.inert=true;if(dock){dock.hidden=true;dock.inert=true;}
      document.body.dataset.mode='world';button.disabled=false;root.focus();instance.resume();
    }catch(error){if(ticket===generation)desktop('Halo World could not initialize graphics. Desktop and your unsaved session are still available.');}
  });
}
