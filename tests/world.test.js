import {test} from 'node:test';
import assert from 'node:assert/strict';
import {worldEnabled} from '../halo/world/flags.js';
import {moveAvatar,SPAWN} from '../halo/world/AvatarController.js';
import {nearestDestination} from '../halo/world/InteractionManager.js';
import {destinations,validateDestinations} from '../halo/world/DestinationRegistry.js';
import {WorldPerformanceManager} from '../halo/world/WorldPerformanceManager.js';
test('World flag is default off, opt-in only, safe when storage is blocked',()=>{
  assert.equal(worldEnabled({search:''},{getItem:()=>null}),false);
  assert.equal(worldEnabled({search:'?world=1'},{getItem:()=>null}),true);
  assert.equal(worldEnabled({search:''},{getItem:()=>{throw Error()}}),false);
});
test('movement is normalized, bounded, collision-safe and frame-gap clamped',()=>{
  const a=moveAvatar(SPAWN,new Set(['KeyW']),.05),b=moveAvatar(SPAWN,new Set(['KeyW','KeyA']),.05);
  assert.ok(Math.abs(Math.hypot(a.x,a.z-7)-Math.hypot(b.x,b.z-7))<1e-8);
  let p={x:0,z:0,heading:0};const obstacles=[{x:0,z:-2,radius:1}];
  for(let i=0;i<500;i++)p=moveAvatar(p,new Set(['KeyW']),.05,obstacles);
  assert.ok(p.z>=-.65);assert.equal(p.x,0);
  for(let i=0;i<500;i++)p=moveAvatar(p,new Set(['KeyD']),.05,[]);
  assert.ok(p.x<=12.5);assert.equal(moveAvatar(SPAWN,new Set(['KeyW']),100).z,a.z);
});
test('typed registry validates routes and discovery respects interaction distance',()=>{
  assert.equal(validateDestinations(destinations),destinations);
  assert.throws(()=>validateDestinations([...destinations,...destinations]));
  assert.equal(nearestDestination(SPAWN,destinations),null);
  assert.equal(nearestDestination({x:-4,z:2},destinations)?.id,'projects');
});
test('performance fallback requires a sustained measured slow window',()=>{
  const p=new WorldPerformanceManager({samples:3});assert.equal(p.sample(100),false);assert.equal(p.sample(100),false);assert.equal(p.sample(100),true);
  p.reset();assert.equal(p.sample(16),false);assert.equal(p.sample(16),false);assert.equal(p.sample(16),false);
});
