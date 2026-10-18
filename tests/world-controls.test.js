import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_BINDINGS,PRESETS,validateControls,saveControls,loadControls,mappedKeys,CONTROLS_KEY} from '../halo/world/Controls.js';

test('World controls presets validate, persist, and map physical keys without changing project data',()=>{
  const values=new Map();const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  for(const preset of Object.values(PRESETS))assert.deepEqual(validateControls({bindings:preset}).bindings,preset);
  const saved=saveControls({bindings:{...DEFAULT_BINDINGS,interact:'KeyF'},speed:4.2},storage);
  assert.equal(values.has(CONTROLS_KEY),true);
  assert.equal(loadControls(storage).bindings.interact,'KeyF');
  assert.equal(saved.speed,4.2);
  assert.equal(mappedKeys(new Set(['KeyF','KeyW']),saved.bindings).has('KeyW'),true);
  assert.throws(()=>validateControls({bindings:{...DEFAULT_BINDINGS,interact:'KeyW'}}),/conflict/);
  values.set(CONTROLS_KEY,'{invalid');assert.deepEqual(loadControls(storage).bindings,DEFAULT_BINDINGS);
});
