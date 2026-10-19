import * as THREE from './vendor/three.module.js';
import { followCamera } from './FollowCamera.js';
import {readThemeLibrary,resolveTheme,applyVisualTheme} from '../visual-theme.js';
export function createScene(container,entries,onJarvis=()=>{},controls={}){
  const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power',failIfMajorPerformanceCaveat:false});
  applyVisualTheme(resolveTheme(readThemeLibrary(),'world'));
  const tokens=getComputedStyle(document.documentElement),background=tokens.getPropertyValue('--world-sky').trim()||tokens.getPropertyValue('--bg').trim()||'#181c2c',groundColor=tokens.getPropertyValue('--world-ground').trim()||'#303846',fogColor=tokens.getPropertyValue('--world-fog').trim()||background,sunColor=tokens.getPropertyValue('--world-sun').trim()||'#ffdbad';
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(background);
  renderer.domElement.setAttribute('aria-label','Halo World third-person plaza');
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(fogColor,18,48);
  const camera=new THREE.PerspectiveCamera(50,1,.1,70);
  const groundRay=new THREE.Raycaster(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  scene.add(new THREE.HemisphereLight(0xf4d4aa,0x293848,2.5));
  const sun=new THREE.DirectionalLight(sunColor,2.5);sun.position.set(-5,9,3);scene.add(sun);
  const geometries=new Set(),materials=new Set(),geometryCache=new Map(),materialCache=new Map();
  function mesh(geometry,color,x,y,z,uniqueMaterial=false){
    const key=JSON.stringify([geometry.type,geometry.parameters]);
    if(geometryCache.has(key)){geometry.dispose();geometry=geometryCache.get(key);}else{geometryCache.set(key,geometry);geometries.add(geometry);}
    let material=uniqueMaterial?null:materialCache.get(color);
    if(!material){material=new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.15});materials.add(material);if(!uniqueMaterial)materialCache.set(color,material);}
    const item=new THREE.Mesh(geometry,material);item.position.set(x,y,z);scene.add(item);return item;
  }
  mesh(new THREE.CylinderGeometry(14,14,.3,64),groundColor,0,-.2,0);
  const ring=mesh(new THREE.TorusGeometry(10.5,.025,6,64),0xd6b990,0,.01,0);ring.rotation.x=Math.PI/2;
  mesh(new THREE.CylinderGeometry(1.8,2,.24,32),0x806746,0,.02,0);
  const orb=mesh(new THREE.SphereGeometry(.82,32,20),0x152535,0,1.85,0,true);
  orb.material.roughness=.22;orb.material.metalness=.72;orb.material.emissive=new THREE.Color(0x247394);orb.material.emissiveIntensity=.38;
  const core=mesh(new THREE.SphereGeometry(.43,24,16),0xa4dce9,0,1.85,0,true);
  core.material.emissive=new THREE.Color(0x70d5f0);core.material.emissiveIntensity=.7;
  const orbRing=mesh(new THREE.TorusGeometry(1.12,.035,8,64),0xd8b276,0,1.85,0);orbRing.rotation.x=.35;
  for(let i=-10;i<=10;i+=2){mesh(new THREE.BoxGeometry(.018,.02,22),0x56606b,i,0,0);mesh(new THREE.BoxGeometry(22,.02,.018),0x56606b,0,0,i);}
  const obstacles=[{x:0,z:0,radius:1.1}];
  for(const d of entries){
    const angle=Math.atan2(d.location.x,d.location.z),tx=Math.cos(angle),tz=-Math.sin(angle),half=d.world.doorwayWidth/2+.22;
    mesh(new THREE.BoxGeometry(3,.16,1.9),0x53606a,d.location.x,.02,d.location.z);
    for(const side of [-1,1]){
      const x=d.location.x+side*tx*half,z=d.location.z+side*tz*half;
      obstacles.push({x,z,radius:.43});
      mesh(new THREE.CylinderGeometry(.3,.38,3.2,10),d.appearance.color,x,1.65,z);
      mesh(new THREE.BoxGeometry(.7,.23,.7),0xd9c39e,x,3.23,z);
    }
    const lintel=mesh(new THREE.BoxGeometry(d.world.doorwayWidth+1,.36,.62),d.appearance.color,d.location.x,3.33,d.location.z);lintel.rotation.y=angle;
    const preview=mesh(new THREE.PlaneGeometry(d.world.doorwayWidth,2.7),d.appearance.color,d.location.x,1.55,d.location.z,true);
    preview.rotation.y=angle;preview.material.transparent=true;preview.material.opacity=d.availability==='available'?.17:.08;preview.material.side=THREE.DoubleSide;
  }
  for(const [x,z] of [[5,-4],[-6,-7],[8,5]]){
    obstacles.push({x,z,radius:.85});mesh(new THREE.CylinderGeometry(.8,.9,.6,12),0x806b58,x,.2,z);
    mesh(new THREE.ConeGeometry(1.25,3,8),0x597970,x,2,z);
  }
  const avatar=new THREE.Group();scene.add(avatar);
  function avatarPart(geometry,color,x,y,z){const part=mesh(geometry,color,0,0,0);scene.remove(part);avatar.add(part);part.position.set(x,y,z);return part;}
  avatarPart(new THREE.CylinderGeometry(.24,.28,.65,12),0xe0ba8d,0,.95,0);
  avatarPart(new THREE.SphereGeometry(.22,12,8),0xf0cfab,0,1.45,0);
  const leftLeg=avatarPart(new THREE.BoxGeometry(.14,.48,.18),0x303c56,-.13,.42,0);
  const rightLeg=avatarPart(new THREE.BoxGeometry(.14,.48,.18),0x303c56,.13,.42,0);
  const leftArm=avatarPart(new THREE.BoxGeometry(.12,.5,.16),0xc6a381,-.33,.95,0);
  const rightArm=avatarPart(new THREE.BoxGeometry(.12,.5,.16),0xc6a381,.33,.95,0);
  const labels=entries.map(d=>{const label=document.createElement('span');label.className='world-label';label.textContent=d.label+(d.availability==='planned'?' · Planned':'');container.append(label);return {d,label};});
  const jarvisButton=document.createElement('button');jarvisButton.className='world-jarvis-target';jarvisButton.type='button';jarvisButton.textContent='✧';jarvisButton.setAttribute('aria-label','Talk to Jarvis');jarvisButton.onclick=onJarvis;container.append(jarvisButton);
  container.prepend(renderer.domElement);
  const resize=()=>{const {width,height}=container.getBoundingClientRect();renderer.setSize(Math.max(width,1),Math.max(height,1),false);camera.aspect=Math.max(width,1)/Math.max(height,1);camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  let initialized=false,walkTime=0,orbTime=0,lastOrbState='';
  return {
    canvas:renderer.domElement,obstacles,
    groundPoint(clientX,clientY){const bounds=renderer.domElement.getBoundingClientRect();const point=new THREE.Vector2((clientX-bounds.left)/bounds.width*2-1,-((clientY-bounds.top)/bounds.height*2-1));groundRay.setFromCamera(point,camera);const hit=new THREE.Vector3();return groundRay.ray.intersectPlane(groundPlane,hit)?{x:hit.x,z:hit.z}:null;},
    setJarvisState(state){
      if(state===lastOrbState)return;
      lastOrbState=state;
      const colors={idle:0x247394,nearby:0x6eadd4,executing:0xd09b56,waiting:0xd09b56,completed:0x4dba91,error:0xcf6f64};
      orb.material.emissive.setHex(colors[state]??colors.idle);
      orb.material.emissiveIntensity=controls.reducedGlare?.12:.38;
      core.material.emissiveIntensity=controls.reducedGlare?.2:.7;
      jarvisButton.dataset.state=state;
      jarvisButton.title=`Jarvis · ${state}`;
    },
    render(position,dt,reducedMotion,cameraOrbit=0){
      const ratio=Math.min(devicePixelRatio,controls.renderScale??1.5);if(renderer.getPixelRatio()!==ratio){renderer.setPixelRatio(ratio);resize();}
      if(camera.fov!==controls.fieldOfView&&Number.isFinite(controls.fieldOfView)){camera.fov=controls.fieldOfView;camera.updateProjectionMatrix();}
      orb.material.emissiveIntensity=controls.reducedGlare?.12:.38;core.material.emissiveIntensity=controls.reducedGlare?.2:.7;
      orbTime+=dt;
      const bob=reducedMotion?0:Math.sin(orbTime*1.2)*.045;
      orb.position.y=1.85+bob;core.position.y=1.85+bob;orbRing.position.y=1.85+bob;
      if(!reducedMotion)orbRing.rotation.z+=dt*(document.documentElement.dataset.haloMotion==='lively'?.2:.13);
      avatar.position.set(position.x,position.y??0,position.z);avatar.rotation.y=position.heading;
      if(position.moving)walkTime+=dt*(Math.hypot(position.vx??0,position.vz??0)>4?13:8);
      const swing=position.moving&&!reducedMotion?Math.sin(walkTime)*.35:0;
      leftLeg.rotation.x=swing;rightLeg.rotation.x=-swing;leftArm.rotation.x=-swing*.7;rightArm.rotation.x=swing*.7;
      followCamera(camera,position,initialized?dt:1,initialized?reducedMotion:true,obstacles,controls.fixedCamera?0:cameraOrbit);initialized=true;
      renderer.render(scene,camera);
      renderer.domElement.dataset.drawCalls=renderer.info.render.calls;renderer.domElement.dataset.triangles=renderer.info.render.triangles;renderer.domElement.dataset.geometries=renderer.info.memory.geometries;
      const jarvisScreen=new THREE.Vector3(0,2.2,0).project(camera);
      jarvisButton.hidden=jarvisScreen.z>1||jarvisScreen.z< -1||Math.abs(jarvisScreen.x)>1||Math.abs(jarvisScreen.y)>1;
      jarvisButton.style.left=`${(jarvisScreen.x+1)*50}%`;jarvisButton.style.top=`${(-jarvisScreen.y+1)*50}%`;
      for(const {d,label} of labels){const vector=new THREE.Vector3(d.location.x,3.2,d.location.z).project(camera);label.hidden=vector.z>1||vector.z< -1||Math.abs(vector.x)>1.1||Math.abs(vector.y)>1.1;label.style.left=`${(vector.x+1)*50}%`;label.style.top=`${(-vector.y+1)*50}%`;}
    },
    dispose(){observer.disconnect();labels.forEach(({label})=>label.remove());jarvisButton.remove();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();scene.clear();}
  };
}
