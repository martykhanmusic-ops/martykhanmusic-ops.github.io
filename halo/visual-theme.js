export const VISUAL_THEME_KEY='halo.visual-theme.v1';
export const DEFAULT_VISUAL_THEME=Object.freeze({background:'sunset',typography:'humanist',components:'glass',icons:'orbit',portals:'round',lighting:'warm',motion:'calm',environment:'plaza',palette:'halo',navigation:'orbital',controls:'rounded'});
export const VISUAL_THEME_OPTIONS=Object.freeze({
  background:['sunset','paper','night'],typography:['humanist','geometric','mono','editorial'],components:['glass','solid','soft','frosted','chrome'],icons:['orbit','classic'],portals:['round','square','arch'],lighting:['warm','cool','soft'],motion:['calm','still','lively'],environment:['plaza','garden','studio'],palette:['halo','ocean','rose'],navigation:['orbital','dock','grid'],controls:['rounded','square','pill']
});
export const THEME_SCOPES=['dashboard','project','jarvis','world'];
export const BUILTIN_PACKS=Object.freeze({
  halo:{...DEFAULT_VISUAL_THEME},
  nature:{...DEFAULT_VISUAL_THEME,background:'paper',components:'frosted',environment:'garden',motion:'still'},
  editorial:{...DEFAULT_VISUAL_THEME,typography:'editorial',components:'solid',controls:'square',navigation:'grid',palette:'rose'},
  terminal:{...DEFAULT_VISUAL_THEME,typography:'mono',background:'night',palette:'ocean',navigation:'dock',controls:'square'}
});
export function validateThemePatch(input){const clean=validateVisualTheme(input);return Object.fromEntries(Object.keys(input).map(key=>[key,clean[key]]));}
export function resolveTheme(library,scope){return validateVisualTheme({...library.active,...library.overrides?.[scope]});}
export function importThemePackage(input){
  if(input?.version===1)return validateVisualTheme(input.theme);
  if(input?.version!==2||input.kind!=='halo-theme'||Object.keys(input).some(key=>!['version','kind','name','layers'].includes(key)))throw Error('Unsupported theme version or fields.');
  if(typeof input.name!=='string'||!input.name.trim()||input.name.length>40)throw Error('Invalid theme name.');
  return validateVisualTheme(input.layers);
}
export function validateVisualTheme(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!Object.hasOwn(VISUAL_THEME_OPTIONS,key)))throw Error('Unsupported appearance package.');
  const result={};for(const [key,options] of Object.entries(VISUAL_THEME_OPTIONS)){const value=input[key]??DEFAULT_VISUAL_THEME[key];if(typeof value!=='string'||!options.includes(value))throw Error(`Unsupported ${key} appearance.`);result[key]=value;}return result;
}
export function validateThemeLibrary(input){
  if(!input||input.version!==1||!Array.isArray(input.presets)||input.presets.length>12)throw Error('Unsupported appearance library.');
  const presets=input.presets.map(item=>{if(!item||typeof item.name!=='string'||!item.name.trim()||item.name.length>40)throw Error('Invalid appearance name.');return {name:item.name.trim(),theme:validateVisualTheme(item.theme)};});
  if(new Set(presets.map(item=>item.name.toLowerCase())).size!==presets.length)throw Error('Duplicate appearance name.');
  const overrides={};if(input.overrides!==undefined){if(!input.overrides||typeof input.overrides!=='object'||Array.isArray(input.overrides))throw Error('Invalid overrides.');for(const [scope,patch] of Object.entries(input.overrides)){if(!THEME_SCOPES.includes(scope))throw Error('Unsupported application scope.');overrides[scope]=validateThemePatch(patch);}}
  return {version:1,active:validateVisualTheme(input.active),presets,overrides};
}
export function readThemeLibrary(storage=localStorage){try{const raw=storage.getItem(VISUAL_THEME_KEY);return raw?validateThemeLibrary(JSON.parse(raw)):{version:1,active:{...DEFAULT_VISUAL_THEME},presets:[]};}catch{return {version:1,active:{...DEFAULT_VISUAL_THEME},presets:[]};}}
export function applyVisualTheme(theme,root=document.documentElement){const clean=validateVisualTheme(theme);for(const [key,value] of Object.entries(clean))root.dataset[`halo${key[0].toUpperCase()}${key.slice(1)}`]=value;root.dispatchEvent(new CustomEvent('halo:visual-theme',{detail:clean}));return clean;}
