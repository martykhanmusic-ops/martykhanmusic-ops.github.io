import { destinations } from '../world/DestinationRegistry.js';

export function mountDesktopRing(stage, onOpen) {
  const orb = stage?.querySelector('.jarvis-orb');
  if (!orb) return;
  const ring = document.createElement('nav');
  ring.className = 'saturn-desktop-ring';
  ring.tabIndex = 0;
  ring.setAttribute('aria-label', 'Saturn portals');
  orb.before(ring);
  ring.append(orb);
  const portals = [...destinations].sort((a,b) => a.desktop.order - b.desktop.order);
  const buttons = portals.map((portal,index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'saturn-portal';
    button.dataset.portal = portal.id;
    button.style.setProperty('--portal-angle', `${index * 360 / portals.length - 90}deg`);
    button.textContent = portal.icon;
    button.setAttribute('aria-label', portal.accessibilityLabel);
    button.title = `${portal.label}${portal.availability === 'planned' ? ' · Planned' : ''}`;
    ring.append(button);
    return button;
  });
  const caption = document.createElement('p');
  caption.className = 'saturn-caption';
  caption.setAttribute('role','status');
  ring.after(caption);
  let selected = 0, startX = null, suppressClick = false, suppressTimer = null;
  function select(index) {
    selected = (index + portals.length) % portals.length;
    buttons.forEach((button,i) => { button.setAttribute('aria-pressed', String(i===selected)); button.tabIndex = i===selected ? 0 : -1; });
    const portal = portals[selected];
    caption.textContent = `${portal.label} · ${portal.availability === 'planned' ? 'Planned' : portal.preview}`;
  }
  function open() {
    const portal = portals[selected];
    if (portal.availability === 'available') onOpen(portal);
    else caption.textContent = `${portal.label} is planned. ${portal.preview}. No application opened.`;
  }
  buttons.forEach((button,index) => {
    button.addEventListener('pointerenter', () => select(index));
    button.addEventListener('focus', () => select(index));
    button.addEventListener('click', () => { if (suppressClick) { suppressClick=false; return; } select(index); open(); });
  });
  ring.addEventListener('keydown', event => {
    if (['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(event.code)) {
      event.preventDefault();select(selected + (['ArrowLeft','ArrowUp'].includes(event.code) ? -1 : 1));buttons[selected].focus();
    } else if (event.code === 'Enter' && event.target === ring) { event.preventDefault();open(); }
  });
  ring.addEventListener('wheel', event => { if (document.activeElement !== ring && !ring.contains(document.activeElement)) return; event.preventDefault(); select(selected + Math.sign(event.deltaY || event.deltaX)); }, { passive: false });
  ring.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') startX = event.clientX; });
  ring.addEventListener('pointerup', event => { if (startX === null) return; const delta=event.clientX-startX;startX=null;if(Math.abs(delta)>30){suppressClick=true;clearTimeout(suppressTimer);suppressTimer=setTimeout(()=>{suppressClick=false;},400);select(selected+(delta<0?1:-1));} });
  ring.addEventListener('pointercancel', () => { startX=null; });
  select(0);
}
