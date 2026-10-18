import * as THREE from './vendor/three.module.js';
import { followCamera } from './FollowCamera.js';
export function createScene(container,entries){
  const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power',failIfMajorPerformanceCaveat:false});
  const tokens=getComputedStyle(document.documentElement),background=tokens.getPropertyValue('--bg').trim()||'#181c2c';
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(background);
  renderer.domElement.setAttribute('aria-label','Halo World third-person plaza');
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(background,18,48);
  const camera=new THREE.PerspectiveCamera(50,1,.1,70);
  scene.add(new THREE.HemisphereLight(0xf4d4aa,0x293848,2.5));
  const sun=new THREE.DirectionalLight(0xffdbad,2.5);sun.position.set(-5,9,3);scene.add(sun);
  const geometries=new Set(),materials=new Set();
  function mesh(geometry,color,x,y,z){
    const material=new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.15});geometries.add(geometry);materials.add(material);
    const item=new THREE.Mesh(geometry,material);item.position.set(x,y,z);scene.add(item);return item;
  }
  mesh(new THREE.CylinderGeometry(14,14,.3,64),0x303846,0,-.2,0);
  const ring=mesh(new THREE.TorusGeometry(10.5,.025,6,64),0xd6b990,0,.01,0);ring.rotation.x=Math.PI/2;
  for(let i=-10;i<=10;i+=2){mesh(new THREE.BoxGeometry(.018,.02,22),0x56606b,i,0,0);mesh(new THREE.BoxGeometry(22,.02,.018),0x56606b,0,0,i);}
  const obstacles=entries.map(d=>({x:d.location.x,z:d.location.z,radius:1.5}));
  for(const d of entries){
    mesh(new THREE.CylinderGeometry(1.7,1.9,.25,24),0x53606a,d.location.x,.1,d.location.z);
    mesh(new THREE.BoxGeometry(2.2,2.2,1.5),0x4b515e,d.location.x,1.3,d.location.z);
    mesh(new THREE.BoxGeometry(2.6,.2,2),d.appearance.color,d.location.x,2.5,d.location.z);
    mesh(new THREE.BoxGeometry(1.5,.85,.05),0x83b8ba,d.location.x,1.55,d.location.z+.78);
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
  container.prepend(renderer.domElement);
  const resize=()=>{const {width,height}=container.getBoundingClientRect();renderer.setSize(Math.max(width,1),Math.max(height,1),false);camera.aspect=Math.max(width,1)/Math.max(height,1);camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  let initialized=false,walkTime=0;
  return {
    canvas:renderer.domElement,obstacles,
    render(position,dt,reducedMotion,orbit=0){
      avatar.position.set(position.x,position.y??0,position.z);avatar.rotation.y=position.heading;
      if(position.moving)walkTime+=dt*(Math.hypot(position.vx??0,position.vz??0)>4?13:8);
      const swing=position.moving&&!reducedMotion?Math.sin(walkTime)*.35:0;
      leftLeg.rotation.x=swing;rightLeg.rotation.x=-swing;leftArm.rotation.x=-swing*.7;rightArm.rotation.x=swing*.7;
      followCamera(camera,position,initialized?dt:1,initialized?reducedMotion:true,obstacles,orbit);initialized=true;
      renderer.render(scene,camera);
      for(const {d,label} of labels){const vector=new THREE.Vector3(d.location.x,3.2,d.location.z).project(camera);label.hidden=vector.z>1||vector.z< -1||Math.abs(vector.x)>1.1||Math.abs(vector.y)>1.1;label.style.left=`${(vector.x+1)*50}%`;label.style.top=`${(-vector.y+1)*50}%`;}
    },
    dispose(){observer.disconnect();labels.forEach(({label})=>label.remove());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();scene.clear();}
  };
}
