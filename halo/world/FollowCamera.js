export function cameraTarget(position,obstacles=[],orbit=0){
  const angle=(position.heading??Math.PI)+orbit,dx=-Math.sin(angle),dz=-Math.cos(angle);
  let distance=9;
  for(const obstacle of obstacles){
    const ox=obstacle.x-position.x,oz=obstacle.z-position.z;
    const along=ox*dx+oz*dz;
    const side=Math.hypot(ox-dx*along,oz-dz*along);
    if(along>0&&along<distance&&side<obstacle.radius+.8)distance=Math.min(distance,Math.max(2,along-obstacle.radius-1));
  }
  return {x:position.x+dx*distance,y:Math.max(3,2+distance*.45)+(position.y??0),z:position.z+dz*distance};
}
export function followCamera(camera,position,elapsed,reducedMotion,obstacles=[],orbit=0){
  const target=cameraTarget(position,obstacles,orbit),blend=reducedMotion?1:1-Math.exp(-8*elapsed);
  camera.position.x+=(target.x-camera.position.x)*blend;
  camera.position.y+=(target.y-camera.position.y)*blend;
  camera.position.z+=(target.z-camera.position.z)*blend;
  camera.lookAt(position.x,1+(position.y??0),position.z);
}
