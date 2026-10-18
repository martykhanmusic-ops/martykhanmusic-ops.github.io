export const CONTROLS_KEY='halo.world.controls.v1';
export const DEFAULT_BINDINGS=Object.freeze({forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',turnLeft:'ArrowLeft',turnRight:'ArrowRight',arrowForward:'ArrowUp',arrowBack:'ArrowDown',run:'ShiftLeft',jump:'Space',interact:'KeyE'});
export const PRESETS=Object.freeze({
  standard:DEFAULT_BINDINGS,
  arrows:{...DEFAULT_BINDINGS,forward:'ArrowUp',back:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',turnLeft:'KeyQ',turnRight:'KeyE',arrowForward:'KeyW',arrowBack:'KeyS',interact:'KeyF'},
  oneHanded:{...DEFAULT_BINDINGS,forward:'KeyI',back:'KeyK',left:'KeyJ',right:'KeyL',turnLeft:'KeyU',turnRight:'KeyO',arrowForward:'KeyW',arrowBack:'KeyS',run:'KeyP',jump:'Semicolon',interact:'KeyH'}
});
const ACTIONS=Object.keys(DEFAULT_BINDINGS);
export function validateControls(value){
  if(!value||typeof value!=='object'||!value.bindings||typeof value.bindings!=='object')throw Error('Invalid World controls.');
  const bindings={};
  for(const action of ACTIONS){const code=value.bindings[action];if(typeof code!=='string'||!(/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right)|Semicolon|Comma|Period|Slash|Bracket(Left|Right))$/.test(code)))throw Error(`Invalid ${action} key.`);bindings[action]=code;}
  if(new Set(Object.values(bindings)).size!==ACTIONS.length)throw Error('World control bindings conflict.');
  const speed=Number(value.speed??3),turnSpeed=Number(value.turnSpeed??2.4),sensitivity=Number(value.sensitivity??.004);
  if(speed<1||speed>6||turnSpeed<.5||turnSpeed>5||sensitivity<.001||sensitivity>.02)throw Error('World control speed is out of range.');
  return {bindings,speed,turnSpeed,sensitivity,invertCamera:Boolean(value.invertCamera),reducedMotion:Boolean(value.reducedMotion)};
}
export function loadControls(storage=localStorage){try{const raw=storage.getItem(CONTROLS_KEY);return raw?validateControls(JSON.parse(raw)):validateControls({bindings:DEFAULT_BINDINGS});}catch{return validateControls({bindings:DEFAULT_BINDINGS});}}
export function saveControls(value,storage=localStorage){const clean=validateControls(value);storage.setItem(CONTROLS_KEY,JSON.stringify(clean));return clean;}
export function mappedKeys(physical,bindings){const mapped=new Set();for(const action of ACTIONS)if(physical.has(bindings[action]))mapped.add(DEFAULT_BINDINGS[action]);return mapped;}
