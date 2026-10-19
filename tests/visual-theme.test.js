import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_VISUAL_THEME,VISUAL_THEME_OPTIONS,validateVisualTheme,validateThemeLibrary,readThemeLibrary,VISUAL_THEME_KEY} from '../halo/visual-theme.js';

test('visual theme packages accept only reviewed token choices and preserve invalid stored data',()=>{
  assert.deepEqual(validateVisualTheme({}),DEFAULT_VISUAL_THEME);
  for(const [key,options] of Object.entries(VISUAL_THEME_OPTIONS))assert.equal(validateVisualTheme({[key]:options.at(-1)})[key],options.at(-1));
  assert.throws(()=>validateVisualTheme({background:'url(https://invalid.example/)'}),/Unsupported/);
  assert.throws(()=>validateVisualTheme({script:'alert(1)'}),/Unsupported/);
  assert.throws(()=>validateThemeLibrary({version:1,active:DEFAULT_VISUAL_THEME,presets:[{name:'A',theme:{}},{name:'a',theme:{}}]}),/Duplicate/);
  const stored=new Map([[VISUAL_THEME_KEY,'{corrupt']]),storage={getItem:key=>stored.get(key)??null};
  assert.deepEqual(readThemeLibrary(storage).active,DEFAULT_VISUAL_THEME);
  assert.equal(stored.get(VISUAL_THEME_KEY),'{corrupt');
});

import {resolveTheme,importThemePackage} from '../halo/visual-theme.js';
test('Theme Studio inherits layers and validates versioned imports without code or foreign scopes',()=>{
 const library=validateThemeLibrary({version:1,active:{palette:'ocean'},presets:[],overrides:{jarvis:{typography:'mono'}}});
 assert.equal(resolveTheme(library,'jarvis').palette,'ocean');assert.equal(resolveTheme(library,'jarvis').typography,'mono');assert.equal(resolveTheme(library,'project').typography,'humanist');
 library.active.palette='rose';assert.equal(resolveTheme(library,'jarvis').palette,'rose');
 assert.equal(importThemePackage({version:2,kind:'halo-theme',name:'Mix',layers:{components:'frosted',navigation:'grid'}}).navigation,'grid');
 assert.throws(()=>importThemePackage({version:2,kind:'halo-theme',name:'Bad',layers:{},script:'alert(1)'}));
 assert.throws(()=>validateThemeLibrary({version:1,active:{},presets:[],overrides:{unknown:{}}}));
 assert.throws(()=>importThemePackage({version:2,kind:'halo-theme',name:'Bad',layers:{typography:'url(remote)'}}));
});
