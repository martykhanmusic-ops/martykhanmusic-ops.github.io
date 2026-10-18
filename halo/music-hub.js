const endpoint = 'http://127.0.0.1:4174';
const $ = selector => document.querySelector(selector);

export function createMusicHub(store, { fetcher = fetch } = {}) {
  let lastList, lastKey;
  let approvedDaws = [], approvalFor = null;
  const status = message => { const element = $('#music-hub-status'); if (element) element.textContent = message; };
  const dawStatus = message => { const element = $('#music-daw-status'); if (element) element.textContent = message; };
  const tagsFrom = text => text.split(',').map(tag => tag.trim()).filter(Boolean);
  const musicFile = name => /\.(wav|mp3|flac|aiff|aif|ogg|m4a|mid|midi|als|flp|rpp|ptx|cpr|npr)$/i.test(name);
  const childPath = (folder, name) => folder === '.' ? name : `${folder}/${name}`;
  const safeName = name => typeof name === 'string' && name.length > 0 && name !== '.' && name !== '..' && !/[\\/\0]/.test(name);
  const dawName = name => /^(Ableton Live|FL Studio|Pro Tools)(?:\b|$)/i.test(name);

  function sessionToken() {
    let token;
    try { token = sessionStorage.getItem('halo.companion.token'); } catch { /* A blocked session is disconnected. */ }
    if (!token) throw new Error('Pair the Windows companion first.');
    return token;
  }

  async function companionRequest(route, method = 'GET', body) {
    const response = await fetcher(`${endpoint}${route}`, {
      method, mode: 'cors', cache: 'no-store',
      headers: { Authorization: `Bearer ${sessionToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(5000)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The Windows companion request failed.');
    return result;
  }

  async function companionPost(route, relative) {
    return companionRequest(route, 'POST', { relative });
  }

  async function stat(relative) {
    const result = await companionPost('/files/music-stat', relative);
    if (!result || !['audio', 'sample', 'daw-project'].includes(result.kind) || typeof result.root !== 'string' || typeof result.relative !== 'string' || !Number.isSafeInteger(result.bytes) || !Number.isFinite(Date.parse(result.verifiedAt)) || !Number.isFinite(Date.parse(result.modifiedAt))) throw new Error('The companion returned invalid file information.');
    return result;
  }

  async function browse(relative = '.') {
    status('Reading the approved folder…');
    let result;
    try { result = await companionPost('/files/list', relative); }
    catch (error) { $('#music-browser')?.replaceChildren(); throw error; }
    if (!result || !Array.isArray(result.entries) || result.entries.length > 200 || result.entries.some(entry => !entry || !safeName(entry.name) || !['file', 'directory', 'other'].includes(entry.type))) throw new Error('The companion returned an invalid folder listing.');
    const browser = $('#music-browser');
    if (!browser) return;
    browser.replaceChildren();
    const heading = document.createElement('p'); heading.textContent = `Approved folder: ${relative}`; browser.append(heading);
    if (relative !== '.') {
      const up = document.createElement('button'); up.type = 'button'; up.textContent = '← Parent folder'; up.dataset.browseDir = relative.split('/').slice(0, -1).join('/') || '.'; browser.append(up);
    }
    let count = 0;
    for (const entry of result.entries) {
      if (entry.type !== 'directory' && !(entry.type === 'file' && musicFile(entry.name))) continue;
      const path = childPath(relative, entry.name);
      if (path.length > 500) continue;
      const button = document.createElement('button'); button.type = 'button'; button.textContent = `${entry.type === 'directory' ? 'Folder' : 'File'}: ${entry.name}`;
      if (entry.type === 'directory') button.dataset.browseDir = path;
      else button.dataset.useFile = path;
      browser.append(button); count++;
    }
    if (!count) { const empty = document.createElement('p'); empty.className = 'muted'; empty.textContent = 'No supported music files or folders in this listing.'; browser.append(empty); }
    status(`Showing ${count} supported entries in ${relative}. Choose a file, then verify it to save a link.`);
  }

  function render(state = store.get()) {
    const list = $('#music-hub-list');
    if (!list) return;
    const project = state.projects.find(item => item.id === state.activeProjectId);
    const resources = project?.musicResources || [];
    const key = `${project?.id}|${JSON.stringify(resources)}`;
    if (list === lastList && key === lastKey) return;
    lastList = list; lastKey = key;
    list.replaceChildren();
    if (!resources.length) { const empty = document.createElement('p'); empty.className = 'muted'; empty.textContent = 'No linked music files yet.'; list.append(empty); }
    for (const resource of resources) {
      const row = document.createElement('article'); row.className = 'music-resource'; row.dataset.resourceId = resource.id;
      const heading = document.createElement('h3'); heading.textContent = resource.name;
      const detail = document.createElement('small');
      detail.textContent = `${resource.kind} · ${resource.relative} · ${Math.round(resource.bytes / 1024)} KB · last verified ${new Date(resource.verifiedAt).toLocaleString()}`;
      const form = document.createElement('div'); form.className = 'music-resource-fields';
      for (const [labelText, field, value] of [['Resource title', 'name', resource.name], ['Tags, comma separated', 'tags', resource.tags.join(', ')], ['Resource notes', 'notes', resource.notes]]) {
        const label = document.createElement('label'); label.textContent = labelText;
        const input = field === 'notes' ? document.createElement('textarea') : document.createElement('input');
        input.dataset.resourceField = field; input.value = value; input.maxLength = field === 'notes' ? 2000 : field === 'tags' ? 350 : 160;
        if (field === 'notes') input.rows = 2;
        label.append(input); form.append(label);
      }
      const actions = document.createElement('div'); actions.className = 'music-resource-actions';
      for (const [action, text] of [['save', 'Save details'], ['recheck', 'Recheck file'], ['task', 'Add review task'], ['remove', 'Remove link']]) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.musicAction = action; button.textContent = text; actions.append(button);
      }
      row.append(heading, detail, form, actions); list.append(row);
    }
  }

  function bind() {
    const form = $('#music-hub-form');
    approvedDaws = []; approvalFor = null;
    const dawSelect = $('#music-daw-select'), launchButton = $('#music-daw-launch');
    $('#music-daw-discover')?.addEventListener('click', async () => {
      approvedDaws = []; approvalFor = null; launchButton.disabled = true;
      dawSelect.replaceChildren(new Option('Discover DAWs first', ''));
      dawStatus('Checking approved Windows shortcuts…');
      try {
        const result = await companionRequest('/apps');
        if (!Array.isArray(result.apps) || result.apps.some(app => !app || typeof app.id !== 'string' || typeof app.name !== 'string' || app.id.length > 150 || app.name.length > 150)) throw new Error('The companion returned invalid application information.');
        approvedDaws = result.apps.filter((app, index, apps) => app.id.toLowerCase().endsWith('.lnk') && dawName(app.name) && apps.findIndex(candidate => candidate.id === app.id) === index);
        for (const app of approvedDaws) dawSelect.add(new Option(app.name, app.id));
        dawStatus(approvedDaws.length ? `${approvedDaws.length} approved DAW shortcut(s) found. Select one to request a launch code.` : 'No approved DAW shortcuts found. Start the companion with an allowlisted DAW shortcut.');
      } catch (error) { dawStatus(`DAW discovery failed: ${error.message}`); }
    });
    dawSelect?.addEventListener('change', () => { approvalFor = null; launchButton.disabled = true; $('#music-daw-code').value = ''; dawStatus('Selection changed. Request a fresh launch code.'); });
    $('#music-daw-approval')?.addEventListener('click', async () => {
      const app = approvedDaws.find(item => item.id === dawSelect.value);
      if (!app) return dawStatus('Discover and select an approved DAW first.');
      approvalFor = null; launchButton.disabled = true;
      try {
        const result = await companionRequest('/apps/approval', 'POST', { id: app.id });
        if (result.approvalRequired !== true || result.app !== app.name) throw new Error('Launch approval could not be verified.');
        approvalFor = app.id; launchButton.disabled = false;
        dawStatus(`Enter the one-time code shown in the companion window for ${app.name}. It expires in 60 seconds.`);
      } catch (error) { dawStatus(`Launch approval failed: ${error.message}`); }
    });
    $('#music-daw-launch')?.addEventListener('click', async () => {
      const app = approvedDaws.find(item => item.id === dawSelect.value);
      const code = $('#music-daw-code').value.trim();
      if (!app || approvalFor !== app.id || !/^[0-9]{6}$/.test(code)) return dawStatus('Select the approved DAW and enter its six-digit companion code.');
      if (!confirm(`Launch ${app.name} on this Windows PC?`)) return;
      approvalFor = null; launchButton.disabled = true; $('#music-daw-code').value = '';
      dawStatus(`Asking the companion to launch ${app.name}…`);
      try {
        const result = await companionRequest('/apps/launch', 'POST', { id: app.id, code });
        if (result.launched !== true || result.app !== app.name || !Number.isFinite(Date.parse(result.verifiedAt))) throw new Error('The companion did not verify a launch.');
        dawStatus(`${app.name} launch request verified at ${new Date(result.verifiedAt).toLocaleTimeString()}. Check the Windows desktop for its window.`);
      } catch (error) { dawStatus(`DAW launch failed: ${error.message}. Request a new code to retry.`); }
    });
    $('#music-browse')?.addEventListener('click', () => browse().catch(error => status(`Folder unavailable: ${error.message}`)));
    $('#music-browser')?.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.browseDir) browse(button.dataset.browseDir).catch(error => status(`Folder unavailable: ${error.message}`));
      if (button.dataset.useFile) { form.elements.relative.value = button.dataset.useFile; form.elements.relative.focus(); status('Path selected. Verify and link the file to save it.'); }
    });
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const data = new FormData(form), projectId = store.get().activeProjectId;
      status('Checking the approved Windows folder…');
      try {
        const verified = await stat(String(data.get('relative') || ''));
        store.addMusicResource(projectId, verified, { name: String(data.get('title') || '').trim() || verified.name, tags: tagsFrom(String(data.get('tags') || '')), notes: String(data.get('notes') || '') });
        form.reset(); status('Verified file linked to this project. The audio bytes remain in the approved Windows folder.'); render();
      } catch (error) { status(`File was not linked: ${error.message}`); }
    });
    $('#music-hub-list')?.addEventListener('click', async event => {
      const button = event.target.closest('[data-music-action]');
      if (!button) return;
      const row = button.closest('[data-resource-id]'), projectId = store.get().activeProjectId;
      const resource = store.get().projects.find(p => p.id === projectId)?.musicResources?.find(item => item.id === row.dataset.resourceId);
      if (!resource) return status('Music resource was not found. Reload the project.');
      const action = button.dataset.musicAction;
      if (action === 'remove' && !confirm('Remove this link from Halo? The file on disk will not be deleted.')) return;
      try {
        if (action === 'save') {
          const value = field => row.querySelector(`[data-resource-field="${field}"]`).value;
          store.updateMusicResource(projectId, resource.id, { name: value('name'), tags: tagsFrom(value('tags')), notes: value('notes') });
          status('Music details saved in the Halo workspace.'); render();
        } else if (action === 'recheck') {
          status('Rechecking the approved Windows folder…');
          const current = await stat(resource.relative);
          status(current.root === resource.root && current.relative === resource.relative && current.bytes === resource.bytes && current.modifiedAt === resource.modifiedAt ? 'File is unchanged in the approved folder.' : 'File or approved folder changed since it was linked. Review the reference before relying on it.');
        } else if (action === 'task') { store.addTask(projectId, `Review ${resource.name}`); status('Review task added to this project.'); }
        else if (action === 'remove') { store.removeMusicResource(projectId, resource.id); status('Link removed from Halo. The local file was not changed.'); render(); }
      } catch (error) { status(error.message); }
    });
  }
  return { bind, render };
}
