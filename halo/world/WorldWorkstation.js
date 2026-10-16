import {destinationRoute} from './DestinationRegistry.js';
// Reparent the one existing application mount. No iframe, duplicate renderer,
// cloned forms, store, background recovery or privileged service is created.
export function createWorkstation(shell){
  const originalParent=shell.parentNode,anchor=document.createComment('Halo Desktop session home');
  originalParent.insertBefore(anchor,shell);let panel=null;
  function park(){
    if(!panel)return;
    const parent=anchor.parentNode||originalParent;
    parent.insertBefore(shell,anchor.parentNode?anchor.nextSibling:null);
    shell.hidden=true;shell.inert=true;panel.remove();panel=null;
  }
  return {
    isOpen:()=>!!panel,
    open(root,destination,session,onClose){
      if(panel)return false;
      if(destination.workstationAdapter!=='existing-project-shell'||!destination.interactionModes.includes('workstation'))return false;
      const state=session.getState(),route=destinationRoute(destination,state);
      if(route.view!=='project'||!state.projects.some(project=>project.id===route.projectId))return false;
      if(!session.openRoute(route))return false;
      panel=document.createElement('section');panel.className='world-workstation';panel.setAttribute('aria-label','Project workstation');
      const toolbar=document.createElement('div');toolbar.className='world-workstation-toolbar';
      const title=document.createElement('span');title.textContent='Projects · live application session';
      const close=document.createElement('button');close.textContent='Close workstation';close.onclick=()=>{park();onClose();};toolbar.append(title,close);panel.append(toolbar,shell);
      shell.hidden=false;shell.inert=false;root.append(panel);close.focus();return true;
    },
    park
  };
}
