import {test} from 'node:test';
import assert from 'node:assert/strict';
import {worldEnabled} from '../halo/world/flags.js';
import {moveAvatar,SPAWN} from '../halo/world/AvatarController.js';
import {cameraTarget} from '../halo/world/FollowCamera.js';
import {nearestDestination} from '../halo/world/InteractionManager.js';
import {destinations,validateDestinations,destinationRoute} from '../halo/world/DestinationRegistry.js';
import {WorldPerformanceManager} from '../halo/world/WorldPerformanceManager.js';
import {createPortalInteraction} from '../halo/world/PortalInteraction.js';
test('portal requests require an ordered preview and cannot duplicate a transition',()=>{
  const changes=[];const portal=createPortalInteraction(value=>changes.push(value));
  assert.equal(portal.transition('open','projects'),false);
  assert.equal(portal.proximity('projects'),true);
  assert.deepEqual(portal.get(),{state:'near',portalId:'projects'});
  for(const state of ['preview','requested','transitioning','open','returning','idle'])assert.equal(portal.transition(state,'projects'),true);
  assert.equal(portal.transition('open','projects'),false);
  assert.equal(changes.length,7);
  assert.deepEqual(portal.get(),{state:'idle',portalId:null});
});
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
  for(let i=0;i<500;i++)p=moveAvatar(p,new Set(['KeyD','KeyS']),.05,[]);
  assert.ok(Math.hypot(p.x,p.z)<=12.5);
});
test('World arrow turning, jump and camera avoidance keep one bounded controller',()=>{
  const turned=moveAvatar(SPAWN,new Set(['ArrowLeft']),.05);
  assert.ok(turned.heading>SPAWN.heading);
  assert.equal(turned.x,SPAWN.x);
  const forward=moveAvatar(turned,new Set(['ArrowUp']),.05);
  assert.ok(forward.z<SPAWN.z);
  const jump=moveAvatar(SPAWN,new Set(['Space']),.05);
  assert.ok(jump.y>0);
  assert.equal(moveAvatar(jump,new Set(['Space']),.05).jumpHeld,true);
  let landed=jump;
  for(let i=0;i<100;i++)landed=moveAvatar(landed,new Set(),.05);
  assert.equal(landed.y,0);
  const clear=cameraTarget(SPAWN);
  const obstructed=cameraTarget(SPAWN,[{x:0,z:10,radius:1}]);
  assert.ok(obstructed.z<clear.z);
  assert.ok(obstructed.z>SPAWN.z);
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
test('World resolves existing project routes by ID without inventing state',()=>{
  assert.deepEqual(destinationRoute(destinations[0],{activeProjectId:'real-id'}),{view:'project',projectId:'real-id'});
  assert.deepEqual(destinationRoute(destinations[0],{activeProjectId:null}),{view:'dashboard'});
  assert.throws(()=>destinationRoute({...destinations[0],availability:'planned'},{}));
});
