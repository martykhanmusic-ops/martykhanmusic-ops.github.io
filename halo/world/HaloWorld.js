import { createScene } from './WorldScene.js';
import { AvatarController, moveAvatar, SPAWN } from './AvatarController.js';
import { nearestDestination } from './InteractionManager.js';
import { WorldPerformanceManager } from './WorldPerformanceManager.js';
import { destinations } from './DestinationRegistry.js';
export function mountWorld(root,{onFailure,position=SPAWN,onInteract=()=>{}}){
  const viewport=root.querySelector('.world-viewport'),prompt=root.querySelector('#world-prompt');
  const scene=createScene(viewport,destinations),input=new AvatarController(root),performance=new WorldPerformanceManager();
  let current={...position},frame=0,last=0,paused=true,disposed=false,nearby=null;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(time){
    if(paused||disposed)return;
    const elapsed=last?(time-last)/1000:0;last=time;
    if(elapsed>0 && performance.sample(elapsed*1000)){onFailure('World is running slowly. Returned to Desktop to protect responsiveness.');return;}
    current=moveAvatar(current,input.keys,elapsed,scene.obstacles);scene.render(current,Math.min(elapsed,.05),reducedMotion);
    const destination=nearestDestination(current,destinations);
    if(destination?.id!==nearby?.id){nearby=destination;prompt.textContent=nearby?`${nearby.label} · Press E to interact`:'Walk to the Projects pavilion. WASD / arrows · Shift to run.';}
    root.dataset.avatarX=current.x.toFixed(3);root.dataset.avatarZ=current.z.toFixed(3);root.dataset.nearby=nearby?.id??'';
    frame=requestAnimationFrame(tick);
  }
  const interact=event=>{if(event.code==='KeyE'&&nearby&&event.target===root){event.preventDefault();input.clear();onInteract(nearby);}};
  root.addEventListener('keydown',interact);
  const contextLost=event=>{event.preventDefault();onFailure('World graphics context was lost. Your Desktop session is intact.');};
  scene.canvas.addEventListener('webglcontextlost',contextLost);
  function pause(){paused=true;cancelAnimationFrame(frame);input.clear();last=0;performance.reset();}
  function resume(){if(disposed||document.hidden)return;paused=false;last=0;performance.reset();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}
  const visibility=()=>document.hidden?pause():resume();document.addEventListener('visibilitychange',visibility);
  return {pause,resume,getPosition:()=>({...current}),getNearby:()=>nearby,
    dispose(){if(disposed)return;disposed=true;pause();root.removeEventListener('keydown',interact);document.removeEventListener('visibilitychange',visibility);scene.canvas.removeEventListener('webglcontextlost',contextLost);input.dispose();scene.dispose();}
  };
}
