import { createScene } from './WorldScene.js';
import { AvatarController, moveAvatar, SPAWN } from './AvatarController.js';
import { nearestDestination } from './InteractionManager.js';
import { WorldPerformanceManager } from './WorldPerformanceManager.js';
import { destinations } from './DestinationRegistry.js';
export function mountWorld(root,{onFailure,position=SPAWN,onInteract=()=>{}}){
  const viewport=root.querySelector('.world-viewport'),prompt=root.querySelector('#world-prompt');
  const scene=createScene(viewport,destinations),input=new AvatarController(root),performance=new WorldPerformanceManager();
  prompt.textContent='Walk to Projects · ↑/↓ move, ←/→ turn · WASD strafe · Space jump · Shift run.';
  let current={...position},frame=0,last=0,paused=true,disposed=false,nearby=null,requestedRunning=false,orbit=0,dragging=false;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(time){
    if(paused||disposed)return;
    const elapsed=last?(time-last)/1000:0;last=time;
    if(elapsed>0 && performance.sample(elapsed*1000)){onFailure('World is running slowly. Returned to Desktop to protect responsiveness.');return;}
    current=moveAvatar(current,input.keys,elapsed,scene.obstacles);scene.render(current,Math.min(elapsed,.05),reducedMotion,orbit);
    const destination=nearestDestination(current,destinations);
    if(destination?.id!==nearby?.id){nearby=destination;prompt.textContent=nearby?`${nearby.label} · Press E to interact`:'Walk to Projects · ↑/↓ move, ←/→ turn · WASD strafe · Space jump · Shift run.';}
    root.dataset.avatarX=current.x.toFixed(3);root.dataset.avatarZ=current.z.toFixed(3);root.dataset.avatarY=(current.y??0).toFixed(3);root.dataset.avatarHeading=current.heading.toFixed(3);root.dataset.cameraOrbit=orbit.toFixed(3);root.dataset.nearby=nearby?.id??'';
    frame=requestAnimationFrame(tick);
  }
  const interact=event=>{if(event.code==='KeyE'&&nearby&&event.target===root){event.preventDefault();input.clear();onInteract(nearby);}};
  root.addEventListener('keydown',interact);
  const pointerDown=event=>{if(event.target===scene.canvas){dragging=true;scene.canvas.setPointerCapture(event.pointerId);}};
  const pointerMove=event=>{if(dragging)orbit=Math.max(-1.2,Math.min(1.2,orbit-event.movementX*.004));};
  const pointerUp=()=>{dragging=false;};
  scene.canvas.addEventListener('pointerdown',pointerDown);scene.canvas.addEventListener('pointermove',pointerMove);scene.canvas.addEventListener('pointerup',pointerUp);scene.canvas.addEventListener('pointercancel',pointerUp);
  const contextLost=event=>{event.preventDefault();onFailure('World graphics context was lost. Your Desktop session is intact.');};
  scene.canvas.addEventListener('webglcontextlost',contextLost);
  function stop(){paused=true;cancelAnimationFrame(frame);input.clear();last=0;performance.reset();}
  function pause(){requestedRunning=false;stop();}
  function resume(){requestedRunning=true;if(disposed||document.hidden)return;paused=false;last=0;performance.reset();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}
  const visibility=()=>{if(document.hidden)stop();else if(requestedRunning)resume();};document.addEventListener('visibilitychange',visibility);
  return {pause,resume,getPosition:()=>({...current}),getNearby:()=>nearby,
    dispose(){if(disposed)return;disposed=true;pause();root.removeEventListener('keydown',interact);document.removeEventListener('visibilitychange',visibility);scene.canvas.removeEventListener('webglcontextlost',contextLost);scene.canvas.removeEventListener('pointerdown',pointerDown);scene.canvas.removeEventListener('pointermove',pointerMove);scene.canvas.removeEventListener('pointerup',pointerUp);scene.canvas.removeEventListener('pointercancel',pointerUp);input.dispose();scene.dispose();}
  };
}
