// One application owns storage, rendering, dirty guards and Jarvis recovery.
// World receives snapshots/navigation only: no mutation or execution API.
export function connectApplicationSession(){
  let session;
  window.dispatchEvent(new CustomEvent('halo:session-request',{detail:{accept:value=>{session=value;}}}));
  if(!session)throw new Error('Desktop session is unavailable.');
  return Object.freeze({
    getState:()=>session.getState(),
    openRoute(route){
      if(!route||!['dashboard','project','jarvis'].includes(route.view))throw new Error('Unsupported Desktop route.');
      return session.openRoute(route);
    }
  });
}
