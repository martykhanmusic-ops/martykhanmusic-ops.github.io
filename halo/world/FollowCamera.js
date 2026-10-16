export function cameraTarget(position){return {x:position.x,y:6,z:position.z+9};}
export function followCamera(camera,position,elapsed,reducedMotion){
  const target=cameraTarget(position),blend=reducedMotion?1:1-Math.exp(-8*elapsed);
  camera.position.x+=(target.x-camera.position.x)*blend;
  camera.position.y+=(target.y-camera.position.y)*blend;
  camera.position.z+=(target.z-camera.position.z)*blend;
  camera.lookAt(position.x,1,position.z-2);
}
