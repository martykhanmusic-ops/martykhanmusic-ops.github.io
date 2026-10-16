/**
 * @typedef {{id:string,label:string,featureId:string,route:{view:string},
 * location:{x:number,z:number},appearance:{color:number},interactionModes:string[],
 * availability:'available'|'planned',permissions:string[],workstationAdapter?:string}} Destination
 */
/** @type {ReadonlyArray<Destination>} */
export const destinations = Object.freeze([
  Object.freeze({id:'projects',label:'Projects',featureId:'projects',route:{view:'project'},location:{x:-6,z:2},appearance:{color:0xdab78c},interactionModes:['open-app','workstation'],availability:'available',permissions:[],workstationAdapter:'existing-project-shell'})
]);
export function validateDestinations(entries) {
  const ids=new Set();
  for(const entry of entries) {
    if(ids.has(entry.id)||typeof entry.id!=='string'||!entry.label||!entry.featureId||!['dashboard','project','jarvis'].includes(entry.route?.view)||!Number.isFinite(entry.location?.x)||!Number.isFinite(entry.location?.z)||!Number.isFinite(entry.appearance?.color)||!Array.isArray(entry.permissions)||!Array.isArray(entry.interactionModes)||entry.interactionModes.some(mode=>!['open-app','workstation'].includes(mode))||!['available','planned'].includes(entry.availability)) throw new Error('Invalid World destination.');
    ids.add(entry.id);
  }
  return entries;
}
validateDestinations(destinations);
