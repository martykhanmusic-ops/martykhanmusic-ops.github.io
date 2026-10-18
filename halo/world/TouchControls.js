export function mountTouchControls(root,input,controls,onInteract){
  const pad=document.createElement('div');pad.className='world-touch-controls';pad.dataset.side=controls.touchSide;
  pad.setAttribute('aria-label','Touch World controls');
  const joystick=document.createElement('div');joystick.className='world-touch-joystick';joystick.setAttribute('aria-hidden','true');
  const thumb=document.createElement('span');joystick.append(thumb);pad.append(joystick);
  let activePointer=null;
  function update(event){const bounds=joystick.getBoundingClientRect(),radius=bounds.width/2;const dx=(event.clientX-bounds.left-radius)/radius,dy=(event.clientY-bounds.top-radius)/radius;const length=Math.max(1,Math.hypot(dx,dy));input.setVirtualAxes(dx/length,dy/length);thumb.style.transform=`translate(${input.virtual.x*radius*.65}px,${input.virtual.y*radius*.65}px)`;}
  joystick.addEventListener('pointerdown',event=>{event.preventDefault();activePointer=event.pointerId;joystick.setPointerCapture(event.pointerId);update(event);});
  joystick.addEventListener('pointermove',event=>{if(activePointer===event.pointerId)update(event);});
  const stop=event=>{if(activePointer!==event.pointerId)return;activePointer=null;input.setVirtualAxes(0,0);thumb.style.transform='';};
  joystick.addEventListener('pointerup',stop);joystick.addEventListener('pointercancel',stop);
  const actions=document.createElement('div');actions.className='world-touch-actions';
  for(const [label,action] of [['Jump','jump'],['Run','run']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-label',label);button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);input.physical.add(controls.bindings[action]);});const release=()=>input.physical.delete(controls.bindings[action]);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);actions.append(button);}
  const interact=document.createElement('button');interact.type='button';interact.textContent='Interact';interact.onclick=onInteract;actions.append(interact);pad.append(actions);root.append(pad);
  return ()=>{input.setVirtualAxes(0,0);pad.remove();};
}
