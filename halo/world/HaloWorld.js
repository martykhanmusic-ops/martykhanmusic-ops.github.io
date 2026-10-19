import { createScene } from './WorldScene.js';
import { AvatarController, moveAvatar, SPAWN } from './AvatarController.js';
import { nearestDestination } from './InteractionManager.js';
import { WorldPerformanceManager } from './WorldPerformanceManager.js';
import { destinations } from './DestinationRegistry.js';
import {mountTouchControls} from './TouchControls.js';
export function mountWorld(root,{onFailure,position=SPAWN,onInteract=()=>{},onJarvis=()=>{},getJarvisState=()=> 'idle',onProximity=()=>{},controls}){
  const viewport=root.querySelector('.world-viewport'),prompt=root.querySelector('#world-prompt');
  const openJarvis=()=>{if(paused||disposed)return;input.clear();onJarvis();};
  const scene=createScene(viewport,destinations,openJarvis,controls),input=new AvatarController(root,controls),performance=new WorldPerformanceManager();
  prompt.textContent='Walk to Projects · ↑/↓ move, ←/→ turn · WASD strafe · Space jump · Shift run.';
  let current={...position},frame=0,last=0,paused=true,disposed=false,nearby=null,requestedRunning=false,orbit=0,dragging=false,lastStateCheck=0,jarvisState='idle',insidePortal=null,gamepadInteractHeld=false,moveTarget=null,pointerStart=null;
  const activateNearby=()=>{if(paused||disposed||!nearby)return;input.clear();if(nearby.id==='jarvis')openJarvis();else onInteract(nearby);};
  const removeTouch=controls?.mobileWorld&&matchMedia('(pointer: coarse)').matches?mountTouchControls(root,input,controls,activateNearby):()=>{};
  function tick(time){
    if(paused||disposed)return;
    const elapsed=last?(time-last)/1000:0;last=time;
    if(elapsed>0 && performance.sample(elapsed*1000)){onFailure('World is running slowly. Returned to Desktop to protect responsiveness.');return;}
    const keys=input.keys;
    if(moveTarget){if(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].some(code=>keys.has(code)))moveTarget=null;else{const dx=moveTarget.x-current.x,dz=moveTarget.z-current.z,h=current.heading;if(Math.hypot(dx,dz)<.5)moveTarget=null;else{const forward=dx*Math.sin(h)+dz*Math.cos(h),strafe=-dx*Math.cos(h)+dz*Math.sin(h);if(forward>.3)keys.add('KeyW');if(forward<-.3)keys.add('KeyS');if(strafe>.3)keys.add('KeyD');if(strafe<-.3)keys.add('KeyA');}}}
    current=moveAvatar(current,keys,elapsed,scene.obstacles,12.5,{walkSpeed:controls?.speed,turnSpeed:controls?.turnSpeed,acceleration:controls?.acceleration});scene.render(current,Math.min(elapsed,.05),controls?.reducedMotion||document.documentElement.dataset.haloMotion==='still'||matchMedia('(prefers-reduced-motion: reduce)').matches,orbit);
    const closest=nearestDestination(current,destinations);
    const jarvisDistance=Math.hypot(current.x,current.z);
    const destination=jarvisDistance<=2.8&&(!closest||jarvisDistance<Math.hypot(current.x-closest.location.x,current.z-closest.location.z))?{id:'jarvis',label:'Jarvis'}:closest;
    if(time-lastStateCheck>500){jarvisState=getJarvisState();lastStateCheck=time;}
    scene.setJarvisState(jarvisState==='idle'&&destination?.id==='jarvis'?'nearby':jarvisState);
    if(destination?.id!==nearby?.id){nearby=destination;onProximity(nearby);prompt.textContent=nearby?`${nearby.label}${nearby.availability==='planned'?' · Planned':''} · Press E to interact`:'Walk to Projects · ↑/↓ move, ←/→ turn · WASD strafe · Space jump · Shift run.';}
    let gamepadInteract=false;try{gamepadInteract=Array.from(navigator.getGamepads?.()||[]).some(pad=>pad?.buttons?.[1]?.pressed);}catch{}
    if(gamepadInteract&&!gamepadInteractHeld)activateNearby();gamepadInteractHeld=gamepadInteract;
    root.dataset.avatarX=current.x.toFixed(3);root.dataset.avatarZ=current.z.toFixed(3);root.dataset.avatarY=(current.y??0).toFixed(3);root.dataset.avatarHeading=current.heading.toFixed(3);root.dataset.cameraOrbit=orbit.toFixed(3);root.dataset.nearby=nearby?.id??'';
    const crossed=destinations.find(entry=>Math.hypot(current.x-entry.location.x,current.z-entry.location.z)<1.05);
    if(!crossed)insidePortal=null;
    else if(insidePortal!==crossed.id){insidePortal=crossed.id;input.clear();onInteract(crossed);}
    frame=requestAnimationFrame(tick);
  }
  const interact=event=>{if(event.code===(controls?.bindings?.interact||'KeyE')&&nearby&&event.target===root){event.preventDefault();activateNearby();}};
  root.addEventListener('keydown',interact);
  const pointerDown=event=>{if(event.target===scene.canvas){dragging=true;pointerStart={x:event.clientX,y:event.clientY};scene.canvas.setPointerCapture(event.pointerId);}};
  const pointerMove=event=>{if(dragging&&!controls?.fixedCamera&&pointerStart&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>8)orbit=Math.max(-1.2,Math.min(1.2,orbit-event.movementX*(controls?.invertCamera?-1:1)*(controls?.sensitivity??.004)));};
  const pointerUp=event=>{if(dragging&&pointerStart&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)<8&&!controls?.mobileWorld){const target=scene.groundPoint(event.clientX,event.clientY);if(target&&Math.hypot(target.x,target.z)<12&&scene.obstacles.every(o=>Math.hypot(target.x-o.x,target.z-o.z)>o.radius+.5)){moveTarget=target;prompt.textContent='Walking to selected point · press a movement key to cancel.';}}dragging=false;pointerStart=null;};
  scene.canvas.addEventListener('pointerdown',pointerDown);scene.canvas.addEventListener('pointermove',pointerMove);scene.canvas.addEventListener('pointerup',pointerUp);scene.canvas.addEventListener('pointercancel',pointerUp);
  const contextLost=event=>{event.preventDefault();onFailure('World graphics context was lost. Your Desktop session is intact.');};
  scene.canvas.addEventListener('webglcontextlost',contextLost);
  function stop(){paused=true;cancelAnimationFrame(frame);input.clear();last=0;performance.reset();}
  function pause(){requestedRunning=false;stop();}
  function resume(){requestedRunning=true;if(disposed||document.hidden)return;paused=false;last=0;performance.reset();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}
  const visibility=()=>{if(document.hidden)stop();else if(requestedRunning)resume();};document.addEventListener('visibilitychange',visibility);
  return {pause,resume,getPosition:()=>({...current}),getNearby:()=>nearby,
    dispose(){if(disposed)return;disposed=true;pause();root.removeEventListener('keydown',interact);document.removeEventListener('visibilitychange',visibility);scene.canvas.removeEventListener('webglcontextlost',contextLost);scene.canvas.removeEventListener('pointerdown',pointerDown);scene.canvas.removeEventListener('pointermove',pointerMove);scene.canvas.removeEventListener('pointerup',pointerUp);scene.canvas.removeEventListener('pointercancel',pointerUp);removeTouch();input.dispose();scene.dispose();}
  };
}
