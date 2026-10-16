import { connectApplicationSession } from './shared/ApplicationSessionBridge.js';
import { appModules } from './apps/catalog.js';

const registry = window.haloApplications;
const directory = document.querySelector('#application-directory');
const panel = document.querySelector('#application-panel');
const main = document.querySelector('#main');
const byId = new Map(appModules.map(module => [module.manifest.id, module]));
let active = null, cleanup = null;

if (registry && directory && panel && main) {
  for (const module of appModules) {
    try { registry.register(module.manifest); }
    catch (error) { const status = document.querySelector('#status'); status.textContent = error.message; status.classList.add('error'); }
  }
  const session = connectApplicationSession();

  function renderDirectory() {
    directory.replaceChildren();
    const heading = document.createElement('h2'); heading.textContent = 'Applications';
    directory.append(heading);
    for (const app of registry.discover().filter(app => byId.has(app.id))) {
      const row = document.createElement('div'); row.className = 'application-row';
      const label = document.createElement('span'); label.textContent = app.name;
      const launch = document.createElement('button'); launch.textContent = app.state === 'suspended' ? 'Resume' : 'Open';
      launch.disabled = !app.available;
      launch.addEventListener('click', () => open(app.id));
      row.append(label, launch);
      if (app.reason) { const detail = document.createElement('small'); detail.textContent = app.reason; row.append(detail); }
      for (const permission of app.permissions) {
        const grant = document.createElement('label'); grant.className = 'application-grant';
        const check = document.createElement('input'); check.type = 'checkbox'; check.checked = Boolean(registry.getGrants(app.id)[permission]);
        check.addEventListener('change', () => {
          try { registry.grant(app.id, permission, check.checked); if (!check.checked && active === app.id) leave('close'); renderDirectory(); }
          catch (error) { check.checked = !check.checked; showError(error.message); }
        });
        grant.append(check, ` Allow ${permission}`); row.append(grant);
      }
      directory.append(row);
    }
  }

  function showError(message) { const status = document.querySelector('#status'); status.textContent = message; status.classList.add('error'); }
  function leave(action = 'close') {
    if (!active) return;
    cleanup?.(); cleanup = null;
    if (registry.get(active)?.state === 'active') registry[action](active);
    active = null; panel.hidden = true; main.hidden = false; renderDirectory();
  }
  function open(id) {
    try {
      if (active) leave();
      const route = registry.open(id);
      if (route.view !== 'extension') throw new Error('The app does not use an extension panel.');
      active = id; main.hidden = true; panel.hidden = false; panel.replaceChildren();
      const bar = document.createElement('div'); bar.className = 'section-heading';
      const back = document.createElement('button'); back.textContent = 'Close application'; back.addEventListener('click', () => leave('close'));
      const suspend = document.createElement('button'); suspend.textContent = 'Suspend'; suspend.addEventListener('click', () => leave('suspend'));
      const theme = document.createElement('select'); theme.setAttribute('aria-label', 'Application theme');
      for (const choice of ['inherit', 'dark', 'light']) { const option = document.createElement('option'); option.value = choice; option.textContent = choice === 'inherit' ? 'Use Halo theme' : `${choice[0].toUpperCase()}${choice.slice(1)} theme`; theme.append(option); }
      theme.value = registry.getSettings(id).theme || 'inherit';
      theme.addEventListener('change', () => { try { registry.setSettings(id, { ...registry.getSettings(id), theme: theme.value }); applyTheme(); } catch (error) { showError(error.message); } });
      bar.append(back, suspend, theme);
      const body = document.createElement('div'); body.className = 'card'; panel.append(bar, body);
      const applyTheme = () => { panel.dataset.theme = registry.theme(id, session.getState().theme); };
      applyTheme();
      cleanup = byId.get(id).mount(body, { snapshot: session.getState, state: () => registry.getState(id), setState: value => registry.setState(id, value) });
      panel.focus(); renderDirectory();
    } catch (error) { if (active) leave(); showError(error.message); }
  }
  document.addEventListener('click', event => {
    if (active && (event.target.closest('nav [data-view]') || event.target.closest('#enter-world'))) leave('suspend');
  }, true);
  new MutationObserver(() => {
    if (active) panel.dataset.theme = registry.theme(active, session.getState().theme);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  renderDirectory();
}
