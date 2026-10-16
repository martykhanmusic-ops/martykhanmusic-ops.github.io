const endpoint = 'http://127.0.0.1:4174';
const state = document.querySelector('#companion-state');
const device = document.querySelector('#companion-device');
const form = document.querySelector('#companion-pair');
const actions = document.querySelector('.companion-actions');
let token;
try { token = sessionStorage.getItem('halo.companion.token'); } catch { token = null; }
function remember(value) { try { if (value) sessionStorage.setItem('halo.companion.token', value); else sessionStorage.removeItem('halo.companion.token'); } catch {} }

function show(message, connected = false) {
  state.textContent = message;
  form.hidden = connected;
  actions.hidden = !connected;
  if (!connected) device.textContent = '';
}

async function request(path, method = 'GET', body) {
  const response = await fetch(`${endpoint}${path}`, {
    method,
    mode: 'cors',
    cache: 'no-store',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(3000)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Companion request failed');
  return result;
}

async function refresh() {
  if (!token) return show('Disconnected');
  try {
    const result = await request('/device');
    const d = result.device;
    if (d.platform !== 'win32') throw new Error('Unexpected device platform');
    show(`Connected · verified ${new Date(result.verifiedAt).toLocaleTimeString()}`, true);
    device.textContent = `${d.hostname} · Windows ${d.release} · ${d.arch}`;
    for (const [id, grant] of [['processes', result.grants.processes], ['audio', result.grants.audio], ['file-controls', result.grants.files], ['app-controls', result.grants.apps.length > 0]]) document.querySelector(`#companion-${id}`).hidden = !grant;
  } catch (error) {
    if (/revoked|disconnected/i.test(error.message)) {
      token = null;
      remember(null);
      show('Revoked');
    } else show(`Unavailable · ${error.message}`);
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  show('Pairing…');
  try {
    token = (await request('/pair', 'POST', { code: new FormData(form).get('code') })).token;
    remember(token);
    form.reset();
    await refresh();
  } catch (error) { show(`Pairing failed · ${error.message}`); }
});
document.querySelector('#companion-refresh').addEventListener('click', refresh);
const output = document.querySelector('#companion-result');
async function showResult(path, method, body) {
  try { output.textContent = JSON.stringify(await request(path, method, body), null, 2); }
  catch (error) { output.textContent = `Failed · ${error.message}`; }
}
document.querySelector('#companion-processes').addEventListener('click', () => showResult('/processes'));
document.querySelector('#companion-audio').addEventListener('click', () => showResult('/audio'));
const relative = () => document.querySelector('#companion-relative').value;
document.querySelector('#companion-files').addEventListener('click', () => showResult('/files/list', 'POST', { relative: relative() }));
document.querySelector('#companion-read').addEventListener('click', () => showResult('/files/read', 'POST', { relative: relative() }));
const appList = document.querySelector('#companion-app-list');
document.querySelector('#companion-apps').addEventListener('click', async () => {
  try {
    const { apps } = await request('/apps');
    appList.replaceChildren(...apps.map(app => { const option = document.createElement('option'); option.value = app.id; option.textContent = app.name; return option; }));
    output.textContent = apps.length ? `${apps.length} approved application(s) discovered.` : 'No approved applications found.';
  } catch (error) { output.textContent = `Discovery failed · ${error.message}`; }
});
document.querySelector('#companion-approve').addEventListener('click', () => {
  if (!appList.value) return output.textContent = 'Discover an approved application first.';
  showResult('/apps/approval', 'POST', { id: appList.value });
});
document.querySelector('#companion-launch').addEventListener('click', () => {
  if (!appList.value) return output.textContent = 'Discover an approved application first.';
  showResult('/apps/launch', 'POST', { id: appList.value, code: document.querySelector('#companion-launch-code').value });
  document.querySelector('#companion-launch-code').value = '';
});
document.querySelector('#companion-revoke').addEventListener('click', async () => {
  try { await request('/revoke', 'POST'); token = null; remember(null); output.textContent = ''; show('Revoked'); }
  catch (error) { state.textContent = `Revocation unverified · ${error.message}. Stop the companion to revoke locally.`; }
});
refresh();
