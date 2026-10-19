import {DEFAULT_VISUAL_THEME,VISUAL_THEME_KEY,VISUAL_THEME_OPTIONS,applyVisualTheme,validateVisualTheme,validateThemeLibrary,BUILTIN_PACKS,resolveTheme,importThemePackage} from './visual-theme.js';

const KEY='halo.visual-package.v1',sheet=document.querySelector('#halo-visual-package'),dialog=document.querySelector('#visual-dialog');
const choices=[...dialog.querySelectorAll('input[name="visual-package"]')],status=dialog.querySelector('#visual-theme-status');
let saved='orbital',library={version:1,active:{...DEFAULT_VISUAL_THEME},presets:[]},draftTheme={...DEFAULT_VISUAL_THEME},recoveryRaw=null;
try{saved=localStorage.getItem(KEY)==='classic'?'classic':'orbital';}catch{}
try{const raw=localStorage.getItem(VISUAL_THEME_KEY);if(raw)library=validateThemeLibrary(JSON.parse(raw));}
catch{try{recoveryRaw=localStorage.getItem(VISUAL_THEME_KEY);}catch{recoveryRaw='';}}
draftTheme={...library.active};
const scopeField=dialog.querySelector('#studio-scope');
const currentScope=()=>document.body.dataset.mode==='world'?'world':document.body.dataset.view||'dashboard';
const effective=()=>resolveTheme(library,currentScope());
const selectedTheme=()=>scopeField.value==='global'?library.active:resolveTheme(library,scopeField.value);
let inherit=false;
function describe(){dialog.querySelector('#studio-demo-layers').textContent=[draftTheme.typography,draftTheme.components,draftTheme.palette,draftTheme.navigation].join(' · ');const changed=Object.keys(draftTheme).filter(key=>draftTheme[key]!==library.active[key]);dialog.querySelector('#studio-summary').textContent=scopeField.value==='global'?'Global composition · mix any layer below':(inherit?'All layers will inherit from Halo.':changed.length?('Overrides: '+changed.join(', ')):'All layers match the global theme.');}

function showPackage(value){sheet.disabled=value==='classic';document.documentElement.dataset.visualPackage=value;}
function showTheme(theme){draftTheme=applyVisualTheme(theme);describe();for(const field of dialog.querySelectorAll('[data-visual-field]'))field.value=draftTheme[field.dataset.visualField];}
function persistLibrary(next){if(recoveryRaw!==null)throw Error('Saved appearance data needs recovery before it can be changed.');const clean=validateThemeLibrary(next);localStorage.setItem(VISUAL_THEME_KEY,JSON.stringify(clean));library=clean;}
function closePreview(){showPackage(saved);showTheme(effective());dialog.close();}
const options=dialog.querySelector('#visual-theme-options');
for(const [key,values] of Object.entries(VISUAL_THEME_OPTIONS)){const wrapper=document.createElement('div'),label=document.createElement('label');label.textContent=key[0].toUpperCase()+key.slice(1);const select=document.createElement('select');select.id=`visual-${key}`;label.htmlFor=select.id;select.dataset.visualField=key;for(const value of values){const option=document.createElement('option');option.value=value;option.textContent=value[0].toUpperCase()+value.slice(1);select.append(option);}select.addEventListener('change',()=>{inherit=false;showTheme({...draftTheme,[key]:select.value});status.textContent='Previewing. Apply appearance to keep this combination.';});wrapper.append(label,select);options.append(wrapper);}
const savedSelect=dialog.querySelector('#visual-saved-combinations');
function refreshSaved(){savedSelect.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Choose a combination';savedSelect.append(empty);for(const item of library.presets){const option=document.createElement('option');option.value=item.name;option.textContent=item.name;savedSelect.append(option);}}
showPackage(saved);showTheme(effective());refreshSaved();
document.querySelector('#visual-settings').addEventListener('click',()=>{choices.find(choice=>choice.value===saved).checked=true;scopeField.value='global';inherit=false;showTheme(selectedTheme());status.textContent=recoveryRaw!==null?'Saved appearance data could not be read. Download the original JSON before repairing it.':'';dialog.showModal();});
choices.forEach(choice=>choice.addEventListener('change',()=>showPackage(choice.value)));
dialog.querySelector('#visual-cancel').addEventListener('click',closePreview);
dialog.addEventListener('cancel',event=>{event.preventDefault();closePreview();});
dialog.querySelector('#visual-apply').addEventListener('click',()=>{const selected=choices.find(choice=>choice.checked)?.value||saved,previous=saved;try{if(recoveryRaw!==null)throw Error('Saved appearance data needs recovery first.');localStorage.setItem(KEY,selected);if(scopeField.value==='global')persistLibrary({...library,active:draftTheme});else{const overrides={...library.overrides};if(inherit)delete overrides[scopeField.value];else overrides[scopeField.value]=Object.fromEntries(Object.entries(draftTheme).filter(([key,value])=>value!==library.active[key]));persistLibrary({...library,overrides});}saved=selected;showPackage(saved);showTheme(effective());dialog.close();}catch(error){try{localStorage.setItem(KEY,previous);}catch{}status.textContent=error.message;}});
dialog.querySelector('#visual-save-combination').addEventListener('click',()=>{try{const name=dialog.querySelector('#visual-theme-name').value.trim();const presets=library.presets.filter(item=>item.name.toLowerCase()!==name.toLowerCase());persistLibrary({...library,presets:[...presets,{name,theme:draftTheme}]});refreshSaved();savedSelect.value=name;status.textContent=`Saved ${name}. Current appearance still needs Apply.`;}catch(error){status.textContent=error.message;}});
savedSelect.addEventListener('change',()=>{const item=library.presets.find(item=>item.name===savedSelect.value);if(item){inherit=false;showTheme(item.theme);status.textContent=`Previewing ${item.name}.`;}});
dialog.querySelector('#visual-delete-combination').addEventListener('click',()=>{if(!savedSelect.value)return;try{const name=savedSelect.value;persistLibrary({...library,presets:library.presets.filter(item=>item.name!==name)});refreshSaved();status.textContent=`Deleted ${name}.`;}catch(error){status.textContent=error.message;}});
function download(raw,name){const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
dialog.querySelector('#visual-download').addEventListener('click',()=>{if(recoveryRaw!==null){download(recoveryRaw,'halo-appearance-recovery.json');return;}download(JSON.stringify({version:2,kind:'halo-theme',name:dialog.querySelector('#visual-theme-name').value.trim()||'My Halo',layers:draftTheme},null,2),'halo-theme.json');});
dialog.querySelector('#visual-import').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>16000)throw Error('Theme JSON must be smaller than 16 KB.');const parsed=JSON.parse(await file.text());inherit=false;showTheme(importThemePackage(parsed));status.textContent='Theme preview loaded. Apply appearance to keep it.';}catch(error){status.textContent=error.message;}event.target.value='';});

scopeField.onchange=()=>{inherit=false;showTheme(selectedTheme());};
dialog.querySelector('#studio-pack').onchange=event=>{const pack=BUILTIN_PACKS[event.target.value];if(pack){inherit=false;showTheme(pack);dialog.querySelector('#visual-theme-details').open=true;status.textContent='Pack preview loaded. Every layer remains editable.';}};
dialog.querySelector('#studio-inherit').onclick=()=>{inherit=true;showTheme(library.active);status.textContent=scopeField.value==='global'?'Already editing the global composition.':'Apply to remove this app’s overrides.';};
dialog.querySelector('#studio-expand').onclick=event=>{const expanded=dialog.classList.toggle('studio-expanded');event.target.setAttribute('aria-expanded',String(expanded));event.target.textContent=expanded?'Compact panel':'Expand Studio';dialog.querySelector('#visual-theme-details').open=true;};
new MutationObserver(()=>{if(!dialog.open)showTheme(effective());}).observe(document.body,{attributes:true,attributeFilter:['data-view','data-mode']});