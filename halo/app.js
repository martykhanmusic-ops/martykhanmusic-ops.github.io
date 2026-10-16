import { createStore, STORAGE_KEY } from './store.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const date = value => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
let store, search = '', dirty = false;
function notify(message, error = false) { $('#status').textContent = message; $('#status').classList.toggle('error', error); }
function run(fn) { try { return fn(); } catch (error) { notify(error.message, true); return false; } }
function download(raw, filename) { const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
try { store = createStore(localStorage); } catch (error) {
  $('#main').innerHTML = `<div class="fatal"><p class="eyebrow">WORKSPACE RECOVERY</p><h1>Your data comes first.</h1><p>${escape(error.message)}</p><p>Download the original data before attempting recovery. Halo has not overwritten it. If browser storage is blocked, enable it and reload.</p><button id="raw-backup">Download stored data</button></div>`;
  $('#raw-backup').onclick = () => run(() => download(localStorage.getItem(STORAGE_KEY) || '{}', 'halo-recovery.json'));
  document.querySelectorAll('button:not(#raw-backup)').forEach(b => { b.disabled = true; });
}
function navigate(view, projectId) {
  if (dirty && !confirm('Discard your unsaved project changes?')) return;
  run(() => { store.navigate(view, projectId); dirty = false; search = ''; render(); $('#main').focus(); });
}
function dashboard(s) {
  const active = s.projects.find(p => p.id === s.activeProjectId);
  const tasks = s.projects.flatMap(p => p.tasks);
  const q = search.toLowerCase();
  const projects = s.projects.filter(p => [p.name, p.description, p.notes, ...p.tasks.map(t => t.title)].some(text => text.toLowerCase().includes(q)));
  return `<div class="section-heading"><div><p class="eyebrow">THE SPACE BETWEEN IDEA & REALITY</p><h1>Make room for possibility.</h1><p class="muted">Your projects, your momentum. All in one orbit.</p></div><button class="primary" data-new>＋ New project</button></div>
  <section class="hero" aria-label="Resume work"><div><span class="badge">YOUR CREATIVE WORKSPACE</span><h2>${active ? `Pick up where you left off.` : 'Every great thing starts somewhere.'}</h2><p class="muted">${active ? escape(active.name) + (active.description ? ' · ' + escape(active.description) : '') : 'Give your next idea a home. Create a project, capture your thoughts, and keep moving.'}</p><button ${active ? `data-open="${escape(active.id)}"` : 'data-new'} class="primary">${active ? 'Resume project' : 'Create your first project'} ↗</button>${active ? `<p><small class="muted">Last saved ${date(active.updatedAt)}</small></p>` : ''}</div><div class="orbit" aria-hidden="true"><span class="planet"></span><span class="ring"></span></div></section>
  <div class="metrics"><div class="metric"><strong>${s.projects.length}</strong><span>PROJECTS IN ORBIT</span></div><div class="metric"><strong>${tasks.filter(t => !t.done).length}</strong><span>OPEN TASKS</span></div><div class="metric"><strong>${tasks.filter(t => t.done).length}</strong><span>TASKS COMPLETED</span></div></div>
  <section><div class="section-heading"><h2>Your projects <span class="muted">/ ${projects.length}</span></h2><label class="search">Search projects, notes & tasks<input id="search" type="search" value="${escape(search)}" placeholder="Find something in your orbit…"></label></div><div id="project-results">${projectCards(projects, q)}</div></section>
  <section><h2>Recent activity</h2>${s.activity.slice(0, 6).map(a => `<div class="activity"><span>${escape(a.message)}</span><time datetime="${a.at}">${date(a.at)}</time></div>`).join('') || '<p class="muted">Your story starts with your first project.</p>'}</section>`;
}
function projectCards(projects, query) {
  return projects.length ? `<div class="cards">${projects.map(p => `<article class="card"><p class="eyebrow">PROJECT / ${p.tasks.filter(t => t.done).length} OF ${p.tasks.length} TASKS COMPLETE</p><h3>${escape(p.name)}</h3><p class="muted">${escape(p.description || 'A little room for a big idea.')}</p><small>Saved ${date(p.updatedAt)}</small><br><button data-open="${escape(p.id)}">Open project ↗</button></article>`).join('')}</div>` : `<div class="empty"><h3>${query ? 'Nothing in this orbit yet.' : 'A blank canvas. A fresh start.'}</h3><p class="muted">${query ? 'Try another project name, note, or task.' : 'Create a project to start building your workspace.'}</p>${query ? '' : '<button data-new>Create a project ↗</button>'}</div>`;
}
function projectView(s) {
  const p = s.projects.find(p => p.id === s.activeProjectId);
  if (!p) return '<div class="empty"><h1>Choose your next project.</h1><button data-view="dashboard">Back to overview</button></div>';
  return `<button class="quiet" data-view="dashboard">← All projects</button><div class="section-heading"><div><p class="eyebrow">PROJECT WORKSPACE</p><h1>${escape(p.name)}</h1><p class="muted">Last saved ${date(p.updatedAt)}</p></div><button data-view="jarvis">✧ Open Jarvis</button></div><div class="editor-grid"><section class="card"><h2>Make it yours.</h2><form id="edit-project"><label>Project name<input name="name" required maxlength="120" value="${escape(p.name)}"></label><label>Description<textarea name="description" rows="2" maxlength="2000">${escape(p.description)}</textarea></label><label>Working notes<textarea name="notes" rows="10" placeholder="Ideas, next steps, the spark of something…">${escape(p.notes)}</textarea></label><div class="section-heading"><button class="primary">Save project</button><span class="muted" id="save-state">All changes saved</span></div></form></section><section class="card"><h2>A little forward motion.</h2><p class="muted">${p.tasks.filter(t => t.done).length} of ${p.tasks.length} tasks complete</p><form id="add-task" class="inline-form"><label>New task<input name="title" required maxlength="300" placeholder="What's the next step?"></label><button>Add</button></form>${p.tasks.map(t => `<label class="task ${t.done ? 'done' : ''}"><input type="checkbox" data-task="${escape(t.id)}" ${t.done ? 'checked' : ''}><span>${escape(t.title)}</span></label>`).join('') || '<p class="muted">Small steps become great things. Add your first task.</p>'}</section></div>`;
}
function render() {
  const s = store.get();
  document.documentElement.dataset.theme = s.theme;
  $('#breadcrumb').textContent = `Workspace / ${s.view === 'dashboard' ? 'Overview' : s.view === 'jarvis' ? 'Jarvis' : 'Project'}`;
  document.querySelectorAll('nav [data-view]').forEach(b => { if (b.dataset.view === s.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  $('#main').innerHTML = s.view === 'dashboard' ? dashboard(s) : s.view === 'project' ? projectView(s) : '<h1>Jarvis</h1><p>Command center is being connected.</p>';
  bindMain();
}
function bindMain() {
  $('#search')?.addEventListener('input', event => { search = event.target.value; const s = store.get(), q = search.toLowerCase(); $('#project-results').innerHTML = projectCards(s.projects.filter(p => [p.name,p.description,p.notes,...p.tasks.map(t=>t.title)].some(t=>t.toLowerCase().includes(q))),q); });
  $('#edit-project')?.addEventListener('input', () => { dirty = true; $('#save-state').textContent = 'Unsaved changes'; });
  $('#edit-project')?.addEventListener('submit', event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); run(() => { store.saveProject(store.get().activeProjectId, data); dirty = false; render(); notify('Project saved on this device.'); }); });
  $('#add-task')?.addEventListener('submit', event => { event.preventDefault(); if(dirty) { notify('Save your project changes before adding a task.', true); return; } run(() => { store.addTask(store.get().activeProjectId, new FormData(event.target).get('title')); render(); $('#add-task input').focus(); }); });
  document.querySelectorAll('[data-task]').forEach(input => input.onchange = () => { if(dirty) { input.checked = !input.checked; notify('Save your project changes before updating tasks.',true); return; } if(run(() => { store.toggleTask(store.get().activeProjectId, input.dataset.task); render(); }) === false) input.checked = !input.checked; });
}
if (store) {
  document.addEventListener('click', event => { const button = event.target.closest('button'); if (!button) return; if (button.hasAttribute('data-new')) { if(dirty && !confirm('Discard unsaved changes?')) return; $('#form-error').textContent = ''; $('#project-dialog').showModal(); } if (button.dataset.view) navigate(button.dataset.view); if (button.dataset.open) navigate('project', button.dataset.open); });
  $('#close-dialog').onclick = () => $('#project-dialog').close();
  $('#project-form').onsubmit = event => { event.preventDefault(); const data = new FormData(event.target); try { store.createProject(data.get('name'), data.get('description')); dirty = false; $('#project-dialog').close(); event.target.reset(); render(); notify('Project created and saved on this device.'); $('#main').focus(); } catch(error) { $('#form-error').textContent = error.message; } };
  $('#theme').onclick = () => run(() => { store.setTheme(store.get().theme === 'dark' ? 'light' : 'dark'); document.documentElement.dataset.theme = store.get().theme; });
  $('#backup').onclick = () => run(() => download(JSON.stringify(store.get(), null, 2), 'halo-backup.json'));
  $('#restore').onclick = () => $('#backup-file').click();
  $('#backup-file').onchange = async event => { const file = event.target.files[0]; if (!file) return; try { if (file.size > 5_000_000) throw new Error('Backup must be smaller than 5 MB.'); const raw = await file.text(); if(confirm('Restore this backup? This replaces current projects, tasks, and history. Export a backup first if you want to keep them.')) { store.restore(raw); dirty = false; render(); notify('Workspace restored.'); } } catch(error) { notify(error.message,true); } event.target.value = ''; };
  window.addEventListener('beforeunload', event => { if(dirty) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('storage', event => { if(event.key === STORAGE_KEY) notify('Workspace changed in another tab. Reload before saving.',true); });
  render();
}
