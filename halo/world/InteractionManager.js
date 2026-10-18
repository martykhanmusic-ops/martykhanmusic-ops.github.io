export function nearestDestination(position,entries,maxDistance=2.8){
  return entries.map(d=>({destination:d,distance:Math.hypot(position.x-d.location.x,position.z-d.location.z)})).filter(d=>d.distance<=maxDistance).sort((a,b)=>a.distance-b.distance)[0]?.destination??null;
}
