// Default OFF. No World scene, stylesheet, bridge or 3D dependency is requested
// unless explicitly opted in. Initialization failures never prevent Desktop.
import { worldEnabled } from '../world/flags.js';
if (worldEnabled(location, {getItem:key=>localStorage.getItem(key)})) {
  const start=()=>import('./ModeSwitcher.js').then(module=>module.installModeSwitcher()).catch(()=>{
    const status=document.querySelector('#status'); if(status) status.textContent='Halo World could not load. Desktop is still available.';
  });
  if(document.readyState==='complete') start(); else window.addEventListener('load',start,{once:true});
}
