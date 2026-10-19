/**
 * @typedef {{id:string,label:string,featureId:string,route:{view:string},
 * location:{x:number,z:number},appearance:{color:number},interactionModes:string[],
 * availability:'available'|'planned',permissions:string[],icon:string,preview:string,
 * accessibilityLabel:string,desktop:{order:number},world:{doorwayWidth:number},workstationAdapter?:string}} Destination
 */
/** @type {ReadonlyArray<Destination>} */
export const destinations = Object.freeze([
  Object.freeze({id:'projects',label:'Projects',featureId:'projects',icon:'▣',preview:'Open your saved workspace',accessibilityLabel:'Projects portal',desktop:{order:0},world:{doorwayWidth:2.3},route:{view:'project'},location:{x:-6,z:2},appearance:{color:0xdab78c},interactionModes:['open-app','workstation'],availability:'available',permissions:[],workstationAdapter:'existing-project-shell'}),
  Object.freeze({id:'music',label:'Music Shelf',featureId:'music',icon:'♫',preview:'Open the active project’s music library',accessibilityLabel:'Music Shelf portal',desktop:{order:1},world:{doorwayWidth:2.3},route:{view:'project'},location:{x:-4,z:-5},appearance:{color:0x90bbb1},interactionModes:['open-app'],availability:'available',permissions:[]}),
  Object.freeze({id:'creative',label:'Creative Sessions',featureId:'creative-session',icon:'✎',preview:'Continue the active project’s creative session',accessibilityLabel:'Creative Sessions portal',desktop:{order:2},world:{doorwayWidth:2.3},route:{view:'project'},location:{x:2,z:-6},appearance:{color:0xc7a6b4},interactionModes:['open-app'],availability:'available',permissions:[]}),
  Object.freeze({id:'halo-world',label:'Halo World',featureId:'world',icon:'◎',preview:'World destinations are being built',accessibilityLabel:'Halo World portal, planned',desktop:{order:3},world:{doorwayWidth:2.3},route:{view:'dashboard'},location:{x:6,z:-2},appearance:{color:0x9daec9},interactionModes:['open-app'],availability:'planned',permissions:[]}),
  Object.freeze({id:'games',label:'Games Hub',featureId:'games',icon:'◇',preview:'Games Hub is being built',accessibilityLabel:'Games Hub portal, planned',desktop:{order:4},world:{doorwayWidth:2.3},route:{view:'dashboard'},location:{x:6,z:4},appearance:{color:0xb4a6c8},interactionModes:['open-app'],availability:'planned',permissions:[]}),
  Object.freeze({id:'research',label:'Research',featureId:'research',icon:'⌕',preview:'Research tools are being built',accessibilityLabel:'Research portal, planned',desktop:{order:5},world:{doorwayWidth:2.3},route:{view:'dashboard'},location:{x:0,z:-9},appearance:{color:0xa7b4a0},interactionModes:['open-app'],availability:'planned',permissions:[]}),
  Object.freeze({id:'tidy',label:'Tidy Coach',featureId:'tidy',icon:'✦',preview:'Tidy Coach is being built',accessibilityLabel:'Tidy Coach portal, planned',desktop:{order:6},world:{doorwayWidth:2.3},route:{view:'dashboard'},location:{x:9,z:0},appearance:{color:0xd0ae8a},interactionModes:['open-app'],availability:'planned',permissions:[]}),
  Object.freeze({id:'more',label:'More',featureId:'directory',icon:'•••',preview:'More Halo destinations',accessibilityLabel:'More portals, planned',desktop:{order:7},world:{doorwayWidth:2.3},route:{view:'dashboard'},location:{x:3,z:7},appearance:{color:0xb2ae9a},interactionModes:['open-app'],availability:'planned',permissions:[]})
]);
export function validateDestinations(entries) {
  const ids=new Set();
  for(const entry of entries) {
    if(ids.has(entry.id)||typeof entry.id!=='string'||!entry.label||!entry.featureId||!['dashboard','project','jarvis'].includes(entry.route?.view)||!Number.isFinite(entry.location?.x)||!Number.isFinite(entry.location?.z)||!Number.isFinite(entry.appearance?.color)||!Array.isArray(entry.permissions)||!Array.isArray(entry.interactionModes)||entry.interactionModes.some(mode=>!['open-app','workstation'].includes(mode))||!['available','planned'].includes(entry.availability)||typeof entry.icon!=='string'||typeof entry.preview!=='string'||typeof entry.accessibilityLabel!=='string'||!Number.isInteger(entry.desktop?.order)||!(entry.world?.doorwayWidth>=2)) throw new Error('Invalid World destination.');
    ids.add(entry.id);
  }
  return entries;
}
validateDestinations(destinations);
export function destinationRoute(destination,state){
  if(destination.availability!=='available')throw new Error('This destination is not available.');
  if(destination.route.view==='project')return state.activeProjectId?{view:'project',projectId:state.activeProjectId,...(destination.id==='music'?{focus:'music'}:destination.id==='creative'?{focus:'session'}:{})}:{view:'dashboard'};
  return {...destination.route};
}
