import {saveControls,validateControls,PRESETS,DEFAULT_BINDINGS} from './Controls.js';

export function createWorldControlsPanel(getControls,setControls,onOpen=()=>{},onClose=()=>{}){
  const dialog=document.createElement('dialog');dialog.className='world-settings';dialog.setAttribute('aria-label','Controls and accessibility');document.body.append(dialog);
  function show(){
    onOpen();dialog.replaceChildren();
    const heading=document.createElement('h2');heading.textContent='Controls & Accessibility';dialog.append(heading);
    const intro=document.createElement('p');intro.textContent='Saved on this device. Choose a preset, then change any key.';dialog.append(intro);
    const preset=document.createElement('select');preset.setAttribute('aria-label','Controls preset');
    for(const [id,label] of [['custom','Custom'],['standard','Standard'],['arrows','Arrow keys'],['oneHanded','One-handed']]){const option=document.createElement('option');option.value=id;option.textContent=label;preset.append(option);}preset.value='custom';dialog.append(preset);
    const list=document.createElement('div');list.className='world-key-list';dialog.append(list);
    const status=document.createElement('p');status.setAttribute('role','status');dialog.append(status);
    function update(next,message){try{setControls(saveControls(validateControls(next)));status.textContent=message;draw();}catch(error){status.textContent=error.message;draw();}}
    function draw(){list.replaceChildren();for(const [action,code] of Object.entries(getControls().bindings)){const button=document.createElement('button');button.type='button';button.textContent=`${action}: ${code}`;button.onclick=()=>{button.textContent=`${action}: press a key`;button.addEventListener('keydown',event=>{event.preventDefault();event.stopPropagation();update({...getControls(),bindings:{...getControls().bindings,[action]:event.code}},'Control saved.');},{once:true});button.focus();};list.append(button);}}
    draw();preset.onchange=()=>{if(PRESETS[preset.value])update({...getControls(),bindings:PRESETS[preset.value]},'Preset saved.');};
    for(const [field,label,min,max,step] of [['speed','Movement speed',1,6,.1],['turnSpeed','Turning speed',.5,5,.1],['sensitivity','Camera sensitivity',.001,.02,.001]]){const wrapper=document.createElement('label');wrapper.textContent=label;const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=getControls()[field];input.onchange=()=>update({...getControls(),[field]:Number(input.value)},`${label} saved.`);wrapper.append(input);dialog.append(wrapper);}
    for(const [field,label] of [['invertCamera','Invert horizontal camera'],['reducedMotion','Reduce World motion']]){const wrapper=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.checked=getControls()[field];input.onchange=()=>update({...getControls(),[field]:input.checked},`${label} saved.`);wrapper.append(input,document.createTextNode(label));dialog.append(wrapper);}
    const reset=document.createElement('button');reset.type='button';reset.textContent='Reset controls';reset.onclick=()=>update({bindings:DEFAULT_BINDINGS},'Controls reset.');dialog.append(reset);
    const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>dialog.close();dialog.append(close);
    dialog.onclose=onClose;dialog.showModal();close.focus();
  }
  return {show};
}
