const endpoint = 'http://127.0.0.1:4174';
const $ = selector => document.querySelector(selector);

export function createMusicHub(store, { fetcher = fetch } = {}) {
  let lastList, lastKey;
  const status = message => { const element = $('#music-hub-status'); if (element) element.textContent = message; };
  const tagsFrom = text => text.split(',').map(tag => tag.trim()).filter(Boolean);

  async function stat(relative) {
    let token;
    try { token = sessionStorage.getItem('halo.companion.token'); } catch { /* A blocked session is disconnected. */ }
    if (!token) throw new Error('Pair the Windows companion with an approved folder first.');
    const response = await fetcher(`${endpoint}/files/music-stat`, {
      method: 'POST', mode: 'cors', cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ relative }), signal: AbortSignal.timeout(5000)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The file could not be verified.');
    if (!result || !['audio', 'sample', 'daw-project'].includes(result.kind) || typeof result.root !== 'string' || typeof result.relative !== 'string' || !Number.isSafeInteger(result.bytes) || !Number.isFinite(Date.parse(result.verifiedAt)) || !Number.isFinite(Date.parse(result.modifiedAt))) throw new Error('The companion returned invalid file information.');
    return result;
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
