const endpoint = 'http://127.0.0.1:4174';
const state = document.querySelector('#companion-state');
const device = document.querySelector('#companion-device');
const form = document.querySelector('#companion-pair');
const actions = document.querySelector('.companion-actions');
let token = sessionStorage.getItem('halo.companion.token');

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
  } catch (error) {
    if (/revoked|disconnected/i.test(error.message)) {
      token = null;
      sessionStorage.removeItem('halo.companion.token');
      show('Revoked');
    } else show(`Unavailable · ${error.message}`);
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  show('Pairing…');
  try {
    token = (await request('/pair', 'POST', { code: new FormData(form).get('code') })).token;
    sessionStorage.setItem('halo.companion.token', token);
    form.reset();
    await refresh();
  } catch (error) { show(`Pairing failed · ${error.message}`); }
});
document.querySelector('#companion-refresh').addEventListener('click', refresh);
document.querySelector('#companion-revoke').addEventListener('click', async () => {
  try { await request('/revoke', 'POST'); show('Revoked'); }
  catch (error) { show(`Revocation unverified · ${error.message}`); }
  finally { token = null; sessionStorage.removeItem('halo.companion.token'); }
});
refresh();
