const STATES = new Set(['idle','listening','thinking','responding','planning','executing','waiting','completed','error']);

export function setOrbState(state) {
  if (!STATES.has(state)) return;
  const orb = document.querySelector('.jarvis-orb');
  if (!orb) return;
  orb.dataset.state = state;
  orb.setAttribute('aria-label', `Jarvis orb · ${state === 'waiting' ? 'waiting for approval' : state}`);
}
