export const SPAWN = Object.freeze({x:0,z:7,heading:Math.PI});
export function moveAvatar(position,keys,elapsed,obstacles=[],limit=12.5) {
  let x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  let z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
  const length=Math.hypot(x,z),speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?5.5:3;
  if(length) {x=x/length*speed*Math.min(Math.max(elapsed,0),.05);z=z/length*speed*Math.min(Math.max(elapsed,0),.05);}
  const allowed=(a,b)=>Math.hypot(a,b)<=limit&&!obstacles.some(o=>Math.hypot(a-o.x,b-o.z)<o.radius+.35);
  const next={...position};
  if(allowed(next.x+x,next.z)) next.x+=x;
  if(allowed(next.x,next.z+z)) next.z+=z;
  if(length) next.heading=Math.atan2(x,z);
  return {...next,moving:!!length};
}
export class AvatarController {
  constructor(target) {
    this.keys=new Set(); this.target=target;
    this.down=event=>{if(/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName)) return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(event.code)){event.preventDefault();this.keys.add(event.code);}};
    this.up=event=>this.keys.delete(event.code);this.blur=()=>this.keys.clear();
    target.addEventListener('keydown',this.down);window.addEventListener('keyup',this.up);window.addEventListener('blur',this.blur);
  }
  clear(){this.keys.clear();}
  dispose(){this.target.removeEventListener('keydown',this.down);window.removeEventListener('keyup',this.up);window.removeEventListener('blur',this.blur);this.clear();}
}
