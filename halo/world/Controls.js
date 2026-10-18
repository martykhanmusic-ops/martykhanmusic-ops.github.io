export const CONTROLS_KEY='halo.world.controls.v1';
export const DEFAULT_BINDINGS=Object.freeze({forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',turnLeft:'ArrowLeft',turnRight:'ArrowRight',arrowForward:'ArrowUp',arrowBack:'ArrowDown',run:'ShiftLeft',jump:'Space',interact:'KeyE',jarvis:'KeyJ'});
export const PRESETS=Object.freeze({
  standard:DEFAULT_BINDINGS,
  arrows:{...DEFAULT_BINDINGS,forward:'ArrowUp',back:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',turnLeft:'KeyQ',turnRight:'KeyE',arrowForward:'KeyW',arrowBack:'KeyS',interact:'KeyF'},
  oneHanded:{...DEFAULT_BINDINGS,forward:'KeyI',back:'KeyK',left:'KeyJ',right:'KeyL',turnLeft:'KeyU',turnRight:'KeyO',arrowForward:'KeyW',arrowBack:'KeyS',run:'KeyP',jump:'Semicolon',interact:'KeyH',jarvis:'Digit0'},
  leftHanded:{...DEFAULT_BINDINGS,forward:'KeyT',back:'KeyG',left:'KeyF',right:'KeyH',turnLeft:'KeyR',turnRight:'KeyY',arrowForward:'KeyW',arrowBack:'KeyS',run:'KeyB',jump:'KeyV',interact:'KeyC'}
});
export const ACCESSIBILITY_PRESETS=Object.freeze({
  standard:{bindings:DEFAULT_BINDINGS},
  reducedMotion:{bindings:DEFAULT_BINDINGS,reducedMotion:true,fixedCamera:true,reducedGlare:true},
  oneHanded:{bindings:PRESETS.oneHanded,toggleRun:true,portalConfirmation:true},
  highVisibility:{bindings:DEFAULT_BINDINGS,highContrast:true,textScale:1.25,captionScale:1.25,reducedGlare:true},
  simplified:{bindings:DEFAULT_BINDINGS,simplifiedHud:true,showHints:false,fixedCamera:true,portalConfirmation:true}
});
const ACTIONS=Object.keys(DEFAULT_BINDINGS);
export function validateControls(value){
  if(!value||typeof value!=='object'||!value.bindings||typeof value.bindings!=='object')throw Error('Invalid World controls.');
  const bindings={};
  for(const action of ACTIONS){const code=value.bindings[action];if(typeof code!=='string'||!(/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right)|Semicolon|Comma|Period|Slash|Bracket(Left|Right))$/.test(code)))throw Error(`Invalid ${action} key.`);bindings[action]=code;}
  if(new Set(Object.values(bindings)).size!==ACTIONS.length)throw Error('World control bindings conflict.');
  const speed=Number(value.speed??3),turnSpeed=Number(value.turnSpeed??2.4),sensitivity=Number(value.sensitivity??.004),acceleration=Number(value.acceleration??12);
  if(speed<1||speed>6||turnSpeed<.5||turnSpeed>5||sensitivity<.001||sensitivity>.02||acceleration<2||acceleration>30)throw Error('World control speed is out of range.');
  const textScale=Number(value.textScale??1),captionScale=Number(value.captionScale??1),fieldOfView=Number(value.fieldOfView??50),voiceVolume=Number(value.voiceVolume??1),browserVoiceVolume=Number(value.browserVoiceVolume??1);
  if(textScale<.85||textScale>1.5||captionScale<.85||captionScale>1.5||fieldOfView<40||fieldOfView>75||voiceVolume<0||voiceVolume>1||browserVoiceVolume<0||browserVoiceVolume>1)throw Error('World visual or voice settings are out of range.');
  const touchSide=value.touchSide??'left';if(!['left','right'].includes(touchSide))throw Error('Invalid touch control position.');
  return {bindings,speed,turnSpeed,sensitivity,acceleration,invertCamera:Boolean(value.invertCamera),reducedMotion:Boolean(value.reducedMotion),toggleRun:Boolean(value.toggleRun),autoWalk:Boolean(value.autoWalk),autoRun:Boolean(value.autoRun),mobileWorld:Boolean(value.mobileWorld),touchSide,highContrast:Boolean(value.highContrast),textScale,captionScale,fieldOfView,voiceVolume,browserVoiceVolume,fixedCamera:Boolean(value.fixedCamera),reducedGlare:Boolean(value.reducedGlare),simplifiedHud:Boolean(value.simplifiedHud),showHints:value.showHints!==false,portalConfirmation:value.portalConfirmation!==false};
}
export function loadControls(storage=localStorage){try{const raw=storage.getItem(CONTROLS_KEY);if(!raw)return validateControls({bindings:DEFAULT_BINDINGS});const saved=JSON.parse(raw),bindings={...DEFAULT_BINDINGS,...saved.bindings};if(!saved.bindings?.jarvis&&Object.values(saved.bindings||{}).includes('KeyJ'))bindings.jarvis='Digit0';return validateControls({...saved,bindings});}catch{return validateControls({bindings:DEFAULT_BINDINGS});}}
export function saveControls(value,storage=localStorage){const clean=validateControls(value);storage.setItem(CONTROLS_KEY,JSON.stringify(clean));return clean;}
export function mappedKeys(physical,bindings){const mapped=new Set();for(const action of ACTIONS)if(physical.has(bindings[action]))mapped.add(DEFAULT_BINDINGS[action]);return mapped;}
