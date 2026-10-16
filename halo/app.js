import { createStore, STORAGE_KEY } from './store.js';
import { createJarvis, adapters } from './jarvis.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const date = value => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
let store, jarvis, search = '', dirty = false, jobFilter = 'all';
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
  <section class="hero" aria-label="Resume work"><div><span class="badge">YOUR CREATIVE WORKSPACE</span><h2>${active ? `Pick up where you left off.` : 'Every great thing starts somewhere.'}</h2><p class="muted">${active ? escape(active.name) + (active.description ? ' · ' + escape(active.description) : '') : 'Give your next idea a home. Create a project, capture your thoughts, and keep moving.'}</p><button ${active ? `data-open="${escape(active.id)}"` : 'data-new'} class="primary">${active ? 'Resume project' : 'Create your first project'} ↗</button>${active ? `<p><small class="muted">Last saved ${date(active.updatedAt)}</small></p>` : ''}</div><div class="orbit"><span class="planet" aria-hidden="true"></span><span class="ring" aria-hidden="true"></span><button data-view="jarvis" aria-label="Open Jarvis portal"><span class="portal-label">JARVIS PORTAL</span></button></div></section>
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
function jarvisView(s) {
  const statuses = ['all','awaiting_approval','pending','running','completed','failed','cancelled'];
  const jobs = s.jobs.filter(j => jobFilter === 'all' || j.status === jobFilter);
  return `<div class="section-heading"><div><p class="eyebrow">A LITTLE HELP. A CLEARER PATH.</p><h1>Your command center.</h1><p class="muted">Plan it. Review it. Make it happen.</p></div><span class="badge">LOCAL TOOLS / YOU'RE IN CONTROL</span></div>
  <div class="metrics"><div class="metric"><strong>${s.jobs.filter(j=>['pending','awaiting_approval'].includes(j.status)).length}</strong><span>IN THE QUEUE</span></div><div class="metric"><strong>${s.jobs.filter(j=>j.status==='running').length}</strong><span>RUNNING</span></div><div class="metric"><strong>${s.jobs.filter(j=>j.status==='completed').length}</strong><span>VERIFIED & COMPLETE</span></div></div>
  <div class="editor-grid"><section class="card"><h2>What's the next move?</h2><p class="muted">Choose a supported action. Jarvis builds a fixed execution plan for your review; creating a plan does not run it.</p>${s.projects.length ? `<form id="plan-form"><label>Project<select name="projectId">${s.projects.map(p=>`<option value="${escape(p.id)}" ${p.id===s.activeProjectId?'selected':''}>${escape(p.name)}</option>`).join('')}</select></label><label>Action<select name="action" id="plan-action">${Object.entries(adapters).map(([key,a])=>`<option value="${key}">${escape(a.label)}</option>`).join('')}</select></label><label id="instruction-label">Task title<textarea name="input" id="plan-input" rows="3" maxlength="300" required placeholder="Record the final vocal take"></textarea></label><p id="action-help" class="muted">Adds one task with exactly the title you enter.</p><button class="primary">Generate plan ↗</button></form>` : '<div class="empty"><p>Create a project before planning a job.</p><button data-new>Create project ↗</button></div>'}</section>
  <section class="card"><h2>Permission, by design.</h2><p class="muted">Grant access to each local tool. Deletions also require approval of the specific plan.</p>${Object.entries(adapters).map(([key,a])=>`<label class="task"><input type="checkbox" data-permission="${key}" ${s.permissions[key]?'checked':''}><span>${escape(a.permission)}<br><small class="muted">${escape(a.impact)}</small></span></label>`).join('')}<p class="muted">No AI provider, external integrations, messages, shell execution, or filesystem tools are connected. Status summaries use recorded data only.</p></section></div>
  <section><div class="section-heading"><h2>Execution history</h2><small class="muted">Plans and results are saved on this device.</small></div><div class="filters" aria-label="Filter jobs">${statuses.map(status=>`<button data-filter="${status}" aria-pressed="${status===jobFilter}">${status.replaceAll('_',' ')}</button>`).join('')}</div>${jobs.map(j=>`<article class="card job-card" data-job="${escape(j.id)}"><div class="section-heading"><div><p class="eyebrow">${escape(j.projectName)}</p><h3>${escape(adapters[j.action].label)}</h3></div><span class="badge">${j.status.replaceAll('_',' ')}</span></div><ol>${j.plan.map(step=>`<li>${escape(step)}</li>`).join('')}</ol>${j.result?`<p class="task-result">${escape(j.result)}</p>`:''}${j.error?`<p role="alert" class="job-error">${escape(j.error)}</p>`:''}<div class="job-actions">${j.status==='awaiting_approval'?`<button data-job-action="approve" class="primary">Approve deletion plan</button>`:''}${j.status==='pending'?'<button data-job-action="execute" class="primary">Run job</button>':''}${j.status==='failed'?'<button data-job-action="retry">Review & retry</button>':''}${['pending','awaiting_approval','failed'].includes(j.status)?'<button data-job-action="cancel">Cancel job</button>':''}</div><details><summary>Execution log · ${j.logs.length} events</summary><div class="log">${j.logs.map(l=>`${escape(date(l.at))} · ${escape(l.level)} · ${escape(l.event)}\n${escape(l.message)}`).join('\n\n')}</div><small class="muted">Job ${escape(j.id)}</small></details></article>`).join('') || '<div class="empty"><h3>Clear skies.</h3><p class="muted">No jobs in this view. Generate a plan to get started.</p></div>'}</section>`;
}
function render() {
  const s = store.get();
  document.documentElement.dataset.theme = s.theme;
  $('#breadcrumb').textContent = `Workspace / ${s.view === 'dashboard' ? 'Overview' : s.view === 'jarvis' ? 'Jarvis' : 'Project'}`;
  document.querySelectorAll('nav [data-view]').forEach(b => { if (b.dataset.view === s.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  $('#main').innerHTML = s.view === 'dashboard' ? dashboard(s) : s.view === 'project' ? projectView(s) : jarvisView(s);
  bindMain();
}
function bindMain() {
  $('#plan-action')?.addEventListener('change', event => {
    const action = event.target.value, usesInput = ['add_task','append_note'].includes(action);
    $('#instruction-label').hidden = !usesInput;
    $('#plan-input').required = usesInput;
    $('#plan-input').maxLength = action === 'add_task' ? 300 : 10000;
    $('#instruction-label').firstChild.textContent = action === 'append_note' ? 'Note to append' : 'Task title';
    $('#action-help').textContent = action === 'delete_completed' ? 'A plan captures the currently completed tasks. Review their names before approving deletion.' : action === 'summarize' ? 'Reports current task counts and note length. Does not modify your project.' : action === 'append_note' ? 'Appends your exact text. Existing notes stay intact.' : 'Adds one task with exactly the title you enter.';
  });
  $('#plan-form')?.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); run(() => { jarvis.plan(data.get('action'),data.get('projectId'),['add_task','append_note'].includes(data.get('action')) ? data.get('input') : ''); jobFilter = 'all'; render(); notify('Plan saved. Review it before running.'); }); });
  $('#search')?.addEventListener('input', event => { search = event.target.value; const s = store.get(), q = search.toLowerCase(); $('#project-results').innerHTML = projectCards(s.projects.filter(p => [p.name,p.description,p.notes,...p.tasks.map(t=>t.title)].some(t=>t.toLowerCase().includes(q))),q); });
  $('#edit-project')?.addEventListener('input', () => { dirty = true; $('#save-state').textContent = 'Unsaved changes'; });
  $('#edit-project')?.addEventListener('submit', event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); run(() => { store.saveProject(store.get().activeProjectId, data); dirty = false; render(); notify('Project saved on this device.'); }); });
  $('#add-task')?.addEventListener('submit', event => { event.preventDefault(); if(dirty) { notify('Save your project changes before adding a task.', true); return; } run(() => { store.addTask(store.get().activeProjectId, new FormData(event.target).get('title')); render(); $('#add-task input').focus(); }); });
  document.querySelectorAll('[data-task]').forEach(input => input.onchange = () => { if(dirty) { input.checked = !input.checked; notify('Save your project changes before updating tasks.',true); return; } if(run(() => { store.toggleTask(store.get().activeProjectId, input.dataset.task); render(); document.querySelector(`[data-task="${input.dataset.task}"]`)?.focus(); }) === false) input.checked = !input.checked; });
}
if (store) {
  jarvis = createJarvis(store);
  run(() => jarvis.recover());
  document.addEventListener('click', async event => {
    const permission = event.target.closest('[data-permission]');
    if(permission) { if(run(()=>jarvis.setPermission(permission.dataset.permission,permission.checked))===false) permission.checked = !permission.checked; return; }
    const button = event.target.closest('button'); if (!button) return;
    if (button.hasAttribute('data-new')) { if(dirty && !confirm('Discard unsaved changes?')) return; $('#form-error').textContent = ''; $('#project-dialog').showModal(); }
    if (button.dataset.view) navigate(button.dataset.view);
    if (button.dataset.open) navigate('project', button.dataset.open);
    if (button.dataset.filter) { jobFilter = button.dataset.filter; render(); }
    if (button.dataset.jobAction) {
      const action = button.dataset.jobAction, id = button.closest('[data-job]').dataset.job;
      try {
        if(action==='execute') { const execution = jarvis.execute(id); render(); await execution; }
        else { jarvis[action](id); }
        if(store.get().view==='jarvis') render(); notify(action==='execute'?'Job completed. Local result verified and saved.':action==='approve'?'Plan approved. Run the job when ready.':'Queue updated.');
      } catch(error) { if(store.get().view==='jarvis') render(); notify(error.message,true); }
    }
  });
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
