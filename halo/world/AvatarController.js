export const SPAWN = Object.freeze({x:0,z:7,heading:Math.PI});
export function moveAvatar(position,keys,elapsed,obstacles=[],limit=12.5,settings={}) {
  const dt=Math.min(Math.max(elapsed,0),.05);
  const turn=Number(keys.has('ArrowLeft'))-Number(keys.has('ArrowRight'));
  const heading=(position.heading??Math.PI)+turn*(settings.turnSpeed??2.4)*dt;
  const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  const strafe=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
  const length=Math.hypot(forward,strafe);
  const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?(settings.runSpeed??5.5):(settings.walkSpeed??3);
  const desiredX=length?((forward*Math.sin(heading)-strafe*Math.cos(heading))/length)*speed:0;
  const desiredZ=length?((forward*Math.cos(heading)+strafe*Math.sin(heading))/length)*speed:0;
  const blend=1-Math.exp(-(settings.acceleration??12)*dt);
  const vx=(position.vx??0)+(desiredX-(position.vx??0))*blend;
  const vz=(position.vz??0)+(desiredZ-(position.vz??0))*blend;
  const allowed=(a,b)=>Math.hypot(a,b)<=limit&&!obstacles.some(o=>Math.hypot(a-o.x,b-o.z)<o.radius+.35);
  const next={...position,heading,vx,vz};
  if(allowed(next.x+vx*dt,next.z)) next.x+=vx*dt; else next.vx=0;
  if(allowed(next.x,next.z+vz*dt)) next.z+=vz*dt; else next.vz=0;
  const grounded=(position.y??0)<=0;
  const jumpHeld=keys.has('Space');
  const vy=grounded&&jumpHeld&&!position.jumpHeld?(settings.jumpSpeed??5.2):(position.vy??0);
  next.y=Math.max(0,(position.y??0)+vy*dt);
  next.vy=next.y>0?vy-(settings.gravity??11)*dt:0;
  return {...next,jumpHeld,moving:length>0||Math.hypot(next.vx,next.vz)>.05,turning:turn!==0,jumping:next.y>0};
}
export class AvatarController {
  constructor(target) {
    this.keys=new Set(); this.target=target;
    this.down=event=>{if(/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName)) return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space'].includes(event.code)){event.preventDefault();this.keys.add(event.code);}};
    this.up=event=>this.keys.delete(event.code);this.blur=()=>this.keys.clear();
    target.addEventListener('keydown',this.down);window.addEventListener('keyup',this.up);window.addEventListener('blur',this.blur);
  }
  clear(){this.keys.clear();}
  dispose(){this.target.removeEventListener('keydown',this.down);window.removeEventListener('keyup',this.up);window.removeEventListener('blur',this.blur);this.clear();}
}
