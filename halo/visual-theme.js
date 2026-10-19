export const VISUAL_THEME_KEY='halo.visual-theme.v1';
export const DEFAULT_VISUAL_THEME=Object.freeze({background:'sunset',typography:'humanist',components:'glass',icons:'orbit',portals:'round',lighting:'warm',motion:'calm',environment:'plaza'});
export const VISUAL_THEME_OPTIONS=Object.freeze({
  background:['sunset','paper','night'],typography:['humanist','geometric','mono'],components:['glass','solid','soft'],icons:['orbit','classic'],portals:['round','square','arch'],lighting:['warm','cool','soft'],motion:['calm','still','lively'],environment:['plaza','garden','studio']
});
export function validateVisualTheme(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!Object.hasOwn(VISUAL_THEME_OPTIONS,key)))throw Error('Unsupported appearance package.');
  const result={};for(const [key,options] of Object.entries(VISUAL_THEME_OPTIONS)){const value=input[key]??DEFAULT_VISUAL_THEME[key];if(typeof value!=='string'||!options.includes(value))throw Error(`Unsupported ${key} appearance.`);result[key]=value;}return result;
}
export function validateThemeLibrary(input){
  if(!input||input.version!==1||!Array.isArray(input.presets)||input.presets.length>12)throw Error('Unsupported appearance library.');
  const presets=input.presets.map(item=>{if(!item||typeof item.name!=='string'||!item.name.trim()||item.name.length>40)throw Error('Invalid appearance name.');return {name:item.name.trim(),theme:validateVisualTheme(item.theme)};});
  if(new Set(presets.map(item=>item.name.toLowerCase())).size!==presets.length)throw Error('Duplicate appearance name.');
  return {version:1,active:validateVisualTheme(input.active),presets};
}
export function readThemeLibrary(storage=localStorage){try{const raw=storage.getItem(VISUAL_THEME_KEY);return raw?validateThemeLibrary(JSON.parse(raw)):{version:1,active:{...DEFAULT_VISUAL_THEME},presets:[]};}catch{return {version:1,active:{...DEFAULT_VISUAL_THEME},presets:[]};}}
export function applyVisualTheme(theme,root=document.documentElement){const clean=validateVisualTheme(theme);for(const [key,value] of Object.entries(clean))root.dataset[`halo${key[0].toUpperCase()}${key.slice(1)}`]=value;root.dispatchEvent(new CustomEvent('halo:visual-theme',{detail:clean}));return clean;}
