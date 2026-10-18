import { createStore, STORAGE_KEY } from './store.js';
import { createJarvis, adapters } from './jarvis.js';
import { createJarvisVoice } from './voicebox.js';
import { createLocalLlm } from './local-llm.js';
import { setOrbState } from './orb-state.js';
import { mountDesktopRing } from './portals/DesktopRing.js';
import { destinationRoute } from './world/DestinationRegistry.js';
import { createReminders } from './reminders.js';
import { createMusicReference } from './music-reference.js';
import { createMusicHub } from './music-hub.js';
import { projectJobs } from './project-state.js';
import { createApplicationRegistry, coreApplications } from './framework.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const date = value => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
let store, jarvis, voice, localLlm, reminders, musicHub, search = '', dirty = false, jobFilter = 'all', jobScope = 'all', editorBase = null;
const musicReference = createMusicReference();
let applications, applicationWarning = '';
try {
  applications = createApplicationRegistry({ storage: localStorage, platform: matchMedia('(max-width: 699px)').matches ? 'mobile' : 'desktop' });
  for (const application of coreApplications) applications.register(application);
} catch (error) {
  applications = createApplicationRegistry();
  for (const application of coreApplications) applications.register(application);
  applicationWarning = error.message;
}
window.haloApplications = applications;
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
function focusRoute(route) {
  if (route.focus === 'music' && store.get().view === 'project') {
    try { applications.open('music', {view:'project',projectId:store.get().activeProjectId}); }
    catch (error) { notify(`Music Shelf registry: ${error.message}`, true); }
    const target = document.querySelector('.music-hub');
    target?.scrollIntoView({ block: 'start' });
    target?.querySelector('button')?.focus({ preventScroll: true });
  }
}
function dashboard(s) {
  const active = s.projects.find(p => p.id === s.activeProjectId);
  const tasks = s.projects.flatMap(p => p.tasks);
  const nextTask = active?.tasks.find(t => !t.done);
  const nextReminder = [...(s.reminders || [])].filter(r => r.status === 'pending').sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))[0];
  const session = active?.sessions?.[0];
  const dawLink = active?.musicResources?.find(r => r.kind === 'daw-project');
  const q = search.toLowerCase();
  const projects = s.projects.filter(p => [p.name, p.description, p.notes, ...p.tasks.map(t => t.title)].some(text => text.toLowerCase().includes(q)));
  return `<div class="section-heading"><div><p class="eyebrow">YOUR ORBIT / TODAY</p><h1>Welcome back to Halo.</h1><p class="muted">Your music, your next move, and Jarvis in one place.</p></div><button class="primary" data-new>＋ New project</button></div>
  <section class="hero" aria-label="Resume work"><div><span class="badge">YOUR CREATIVE WORKSPACE</span><h2>${active ? `Pick up where you left off.` : 'Every great thing starts somewhere.'}</h2><p class="muted">${active ? escape(active.name) + (active.description ? ' · ' + escape(active.description) : '') : 'Give your next idea a home. Create a project, capture your thoughts, and keep moving.'}</p><button ${active ? `data-open="${escape(active.id)}"` : 'data-new'} class="primary">${active ? 'Resume project' : 'Create your first project'} ↗</button>${active ? `<p><small class="muted">Last saved ${date(active.updatedAt)}</small></p>` : ''}</div><div class="orbit"><span class="planet" aria-hidden="true"></span><span class="ring" aria-hidden="true"></span><button data-view="jarvis" aria-label="Open Jarvis portal"><span class="portal-label">JARVIS PORTAL</span></button></div></section>
  <div class="metrics"><div class="metric"><strong>${s.projects.length}</strong><span>PROJECTS IN ORBIT</span></div><div class="metric"><strong>${tasks.filter(t => !t.done).length}</strong><span>OPEN TASKS</span></div><div class="metric"><strong>${tasks.filter(t => t.done).length}</strong><span>TASKS COMPLETED</span></div></div>
  <section class="home-pulse" aria-label="Your current creative orbit"><article class="card"><p class="eyebrow">NEXT MOVE</p><h2>${nextTask ? escape(nextTask.title) : 'Choose your next move.'}</h2><p class="muted">${active ? escape(active.name) : 'Create a project to begin.'}</p>${active ? `<button data-open="${escape(active.id)}">Open project</button>` : '<button data-new>Create project</button>'}</article><article class="card"><p class="eyebrow">MUSIC SESSION</p><h2>${session?.endedAt === null ? 'Session in progress' : session ? 'Ready to resume' : 'Start when you are ready'}</h2><p class="muted">${session?.recap ? escape(session.recap) : dawLink ? escape(dawLink.name) : 'Link an approved DAW project in your music workspace.'}</p>${active ? `<button data-open="${escape(active.id)}" data-focus-session>Go to session</button>` : '<button data-new>Create project</button>'}</article><article class="card"><p class="eyebrow">YOUR TIME</p><h2>${nextReminder ? escape(nextReminder.title) : 'A clear horizon'}</h2><p class="muted">${nextReminder ? `Due ${date(nextReminder.dueAt)}` : 'No pending reminder.'}</p><button data-view="jarvis">Ask Jarvis</button></article></section>
  <section><div class="section-heading"><h2>Your projects <span class="muted">/ ${projects.length}</span></h2><label class="search">Search projects, notes & tasks<input id="search" type="search" value="${escape(search)}" placeholder="Find something in your orbit…"></label></div><div id="project-results">${projectCards(projects, q)}</div></section>
  <section class="card music-reference" aria-label="Music reference"><div class="section-heading"><div><p class="eyebrow">PUBLIC MUSIC REFERENCE / READ ONLY</p><h2>Explore music credits.</h2></div></div><p class="muted">Search MusicBrainz for artists, recordings or releases. Results are reference links and do not change your Halo projects or Jarvis plans.</p><form id="music-search"><label>Search type<select name="kind"><option value="artists">Artists</option><option value="recordings">Recordings</option><option value="releases">Releases</option></select></label><label>Search term<input name="name" required minlength="2" maxlength="80" placeholder="Artist, song or release title"></label><button class="primary">Search music</button></form><p id="music-status" role="status" aria-live="polite">The local Halo launcher is needed for this search.</p><div id="music-results"></div><small>Data from <a href="https://musicbrainz.org" target="_blank" rel="noopener noreferrer">MusicBrainz</a>.</small></section>
  <section><h2>Recent activity</h2>${s.activity.slice(0, 6).map(a => `<div class="activity"><span>${escape(a.message)}</span><time datetime="${a.at}">${date(a.at)}</time></div>`).join('') || '<p class="muted">Your story starts with your first project.</p>'}</section>`;
}
function projectCards(projects, query) {
  return projects.length ? `<div class="cards">${projects.map(p => `<article class="card"><p class="eyebrow">PROJECT / ${p.tasks.filter(t => t.done).length} OF ${p.tasks.length} TASKS COMPLETE</p><h3>${escape(p.name)}</h3><p class="muted">${escape(p.description || 'A little room for a big idea.')}</p><small>Saved ${date(p.updatedAt)}</small><br><button data-open="${escape(p.id)}">Open project ↗</button></article>`).join('')}</div>` : `<div class="empty"><h3>${query ? 'Nothing in this orbit yet.' : 'A blank canvas. A fresh start.'}</h3><p class="muted">${query ? 'Try another project name, note, or task.' : 'Create a project to start building your workspace.'}</p>${query ? '' : '<button data-new>Create a project ↗</button>'}</div>`;
}
function projectTaskList(p) {
  return p.tasks.map(t => `<div class="task-row"><label class="task ${t.done ? 'done' : ''}"><input type="checkbox" data-task="${escape(t.id)}" ${t.done ? 'checked' : ''}><span>${escape(t.title)}</span></label>${!t.done ? `<button class="quiet" data-plan-task="${escape(t.id)}">Plan completion</button>` : ''}</div>`).join('') || '<p class="muted">Small steps become great things. Add your first task.</p>';
}
function jobCards(s, jobs) {
  return jobs.map(j => {
    const project = s.projects.find(p => p.id === j.projectId);
    const linkedTasks = (j.resultTaskIds?.length ? j.resultTaskIds : j.targetIds).map(id => project?.tasks.find(t => t.id === id)).filter(Boolean);
    return `<article class="card job-card" data-job="${escape(j.id)}"><div class="section-heading"><div><p class="eyebrow">${escape(project?.name || j.projectName)}</p><h3>${escape(adapters[j.action].label)}</h3></div><span class="badge">${j.status.replaceAll('_',' ')}</span></div><ol>${j.plan.map(step=>`<li>${escape(step)}</li>`).join('')}</ol>${j.result?`<p class="task-result">${escape(j.result)}</p>`:''}${j.error?`<p role="alert" class="job-error">${escape(j.error)}</p>`:''}<div class="job-actions">${project?`<button data-open="${escape(project.id)}">Open linked project</button>`:''}${linkedTasks.map(t=>`<button data-open="${escape(project.id)}" data-open-task="${escape(t.id)}">View task: ${escape(t.title)}</button>`).join('')}${j.status==='awaiting_approval'?'<button data-job-action="approve" class="primary">Approve deletion plan</button>':''}${j.status==='pending'?'<button data-job-action="execute" class="primary">Run job</button>':''}${j.status==='failed'?'<button data-job-action="retry">Review & retry</button>':''}${['pending','awaiting_approval','failed'].includes(j.status)?'<button data-job-action="cancel">Cancel job</button>':''}</div><details><summary>Execution log · ${j.logs.length} events</summary><p class="muted">Project name when planned: ${escape(j.projectName)}</p><div class="log">${j.logs.map(l=>`${escape(date(l.at))} · ${escape(l.level)} · ${escape(l.event)}\n${escape(l.message)}`).join('\n\n')}</div><small class="muted">Job ${escape(j.id)}</small></details></article>`;
  }).join('') || '<div class="empty"><p class="muted">No execution plans in this view.</p></div>';
}
function projectExecutionList(s, p) {
  return `<div class="section-heading"><h2>Project execution plans</h2><button data-project-jobs="${escape(p.id)}">Plan with Jarvis</button></div>${jobCards(s, projectJobs(s,p.id))}`;
}
function filteredJobs(s) { return s.jobs.filter(j => (jobFilter === 'all' || j.status === jobFilter) && (jobScope === 'all' || j.projectId === jobScope)); }
function bindTaskInputs() {
  document.querySelectorAll('[data-task]').forEach(input => input.onchange = () => {
    if(dirty) { input.checked = !input.checked; notify('Save your project changes before updating tasks.',true); return; }
    if(run(() => { store.toggleTask(store.get().activeProjectId, input.dataset.task); [...document.querySelectorAll('[data-task]')].find(el=>el.dataset.task===input.dataset.task)?.focus(); }) === false) input.checked = !input.checked;
  });
}
function syncView() {
  const s = store.get();
  reminders?.render(s);
  const p = s.projects.find(p=>p.id===s.activeProjectId);
  if(s.view === 'project' && p && editorBase?.id === p.id && $('#project-tasks')) {
    $('#project-title').textContent=p.name;
    $('#project-saved').textContent=`Last saved ${date(p.updatedAt)}`;
    $('#project-tasks').innerHTML = projectTaskList(p);
    $('#task-count').textContent = `${p.tasks.filter(t=>t.done).length} of ${p.tasks.length} tasks complete`;
    $('#project-jobs').innerHTML = projectExecutionList(s,p);
    musicHub?.render(s);
    if(!dirty) {
      for(const key of ['name','description','notes']) $('#edit-project').elements[key].value = p[key];
      editorBase = structuredClone(p);
    } else if(['name','description','notes'].some(key=>editorBase[key]!==p[key])) {
      $('#save-state').textContent = 'Saved project changed; copy your draft before reloading.';
    }
    bindTaskInputs();
  }
  if(s.view === 'jarvis' && $('#job-results')) {
    if(s.jobs.some(job=>job.status==='running'))setOrbState('executing');
    else if(s.jobs.some(job=>job.status==='awaiting_approval'))setOrbState('waiting');
    localLlm?.renderChat(s.chat || []);
    $('#job-results').innerHTML = jobCards(s,filteredJobs(s));
    if($('#plan-task')) taskChoices();
    const counts = [s.jobs.filter(j=>['pending','awaiting_approval'].includes(j.status)).length, s.jobs.filter(j=>j.status==='running').length, s.jobs.filter(j=>j.status==='completed').length];
    document.querySelectorAll('#job-metrics strong').forEach((el,i)=>el.textContent=counts[i]);
  }
  if(s.view === 'dashboard' && $('#search')) render();
}
function sessionView(p) {
  const current = p.sessions?.find(item => item.endedAt === null);
  const recent = p.sessions?.find(item => item.endedAt !== null);
  const next = p.tasks.find(task => !task.done);
  return `<section class="card session-stage" id="session-stage" aria-label="Music working session"><div class="section-heading"><div><p class="eyebrow">YOUR CREATIVE SESSION</p><h2>${current ? 'You are in session.' : 'Pick up the thread.'}</h2></div><span class="badge">${current ? 'SESSION ACTIVE' : 'READY WHEN YOU ARE'}</span></div><p class="muted">${current ? `Started ${date(current.startedAt)}${current.focus ? ` · ${escape(current.focus)}` : ''}` : recent ? `Last session ${date(recent.endedAt)}${recent.recap ? ` · ${escape(recent.recap)}` : ''}` : 'Give this project a focus and begin your first session.'}</p>${next ? `<p><strong>Next move:</strong> ${escape(next.title)}</p>` : ''}<form id="session-form">${current ? '<label>What did you make or decide?<textarea name="recap" maxlength="2000" rows="2" placeholder="A short note for next time"></textarea></label><button class="primary">Finish session</button>' : '<label>Focus for this session<input name="focus" maxlength="300" placeholder="Sketch the chorus, arrange drums…"></label><button class="primary">Start session</button>'}</form><div class="session-actions"><button type="button" data-view="jarvis">Talk with Jarvis about this project</button><button type="button" data-focus-music>Music files and DAW</button></div></section>`;
}
function projectView(s) {
  const p = s.projects.find(p => p.id === s.activeProjectId);
  if (!p) return '<div class="empty"><h1>Choose your next project.</h1><button data-view="dashboard">Back to overview</button></div>';
  editorBase = structuredClone(p);
  return `<button class="quiet" data-view="dashboard">← All projects</button><div class="section-heading"><div><p class="eyebrow">PROJECT WORKSPACE</p><h1 id="project-title">${escape(p.name)}</h1><p class="muted" id="project-saved">Last saved ${date(p.updatedAt)}</p></div><button data-view="jarvis">✧ Open Jarvis</button></div>${sessionView(p)}<div class="editor-grid"><section class="card"><h2>Make it yours.</h2><form id="edit-project"><label>Project name<input name="name" required maxlength="120" value="${escape(p.name)}"></label><label>Description<textarea name="description" rows="2" maxlength="2000">${escape(p.description)}</textarea></label><label>Working notes<textarea name="notes" rows="10" placeholder="Ideas, next steps, the spark of something…">${escape(p.notes)}</textarea></label><div class="section-heading"><button class="primary">Save project</button><span class="muted" id="save-state">All changes saved</span><button type="button" class="quiet" data-reload-project>Reload saved project</button></div></form></section><section class="card"><h2>A little forward motion.</h2><p class="muted" id="task-count">${p.tasks.filter(t => t.done).length} of ${p.tasks.length} tasks complete</p><form id="add-task" class="inline-form"><label>New task<input name="title" required maxlength="300" placeholder="What's the next step?"></label><button>Add</button></form><div id="project-tasks">${projectTaskList(p)}</div></section></div><section class="card music-hub" aria-label="Project music library"><p class="eyebrow">LOCAL MUSIC LIBRARY</p><h2>Files in this project’s orbit.</h2><p class="muted">Pair the Windows companion with an approved folder first. Halo verifies each file before linking it. Audio stays on disk; backup includes links and notes only.</p><button type="button" id="music-browse">Browse approved folder</button><div id="music-browser" role="region" aria-label="Approved folder contents"></div><form id="music-hub-form"><label>Path under approved folder<input name="relative" required maxlength="500" placeholder="Sessions/demo.wav"></label><label>Display title<input name="title" maxlength="120" placeholder="Optional"></label><label>Tags<input name="tags" maxlength="300" placeholder="demo, vocals"></label><label>Notes<input name="notes" maxlength="1000" placeholder="Optional"></label><button class="primary">Verify and link file</button></form><p id="music-hub-status" role="status" aria-live="polite">No file checked yet.</p><div id="music-hub-list"></div></section><section class="card music-daw" aria-label="Approved DAW shortcuts"><p class="eyebrow">WINDOWS DAW CONNECTION</p><h2>Open an approved DAW.</h2><p class="muted">Discover only DAW shortcuts allowlisted when the Windows companion started. Launch requires a one-time code shown in the companion window. Launching a DAW alone does not open a project file. Linked DAW projects below need a separate one-time code.</p><button type="button" id="music-daw-discover">Discover approved DAWs</button><label>Approved DAW<select id="music-daw-select"><option value="">Discover DAWs first</option></select></label><button type="button" id="music-daw-approval">Request launch code</button><label>Code from companion window<input id="music-daw-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off"></label><button type="button" id="music-daw-launch" disabled>Launch selected DAW</button><p id="music-daw-status" role="status" aria-live="polite">No DAW checked yet.</p><div class="music-project-open"><h3>Open a linked DAW project.</h3><p class="muted">Select a previously verified .als or .flp link. Halo checks the same approved folder and file details again before requesting a separate local code.</p><label>Linked DAW project<select id="music-project-select"><option value="">Select an approved DAW first</option></select></label><button type="button" id="music-project-approval">Request project-open code</button><label>Project code from companion window<input id="music-project-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off"></label><button type="button" id="music-project-open" disabled>Open linked project in selected DAW</button><p id="music-project-status" role="status" aria-live="polite">No project checked yet.</p></div></section><section id="project-jobs">${projectExecutionList(s,p)}</section>`;
}
function jarvisView(s) {
  const statuses = ['all','awaiting_approval','pending','running','completed','failed','cancelled'];
  const jobs = filteredJobs(s);
  return `<section class="jarvis-intro jarvis-orb-stage" aria-label="Jarvis conversation"><p class="eyebrow">JARVIS / LOCAL CREATIVE COMPANION</p><div class="jarvis-orb" role="img" aria-label="Glowing Halo orb"><span class="jarvis-orb-core"></span><span class="jarvis-orb-ring"></span></div><h1>Talk to Jarvis.</h1><p class="muted">Your ideas, your music, your next move. Type below or use your voice.</p><div class="jarvis-orb-actions"><button id="orb-talk" type="button">● Talk to Jarvis</button><button id="orb-hear" type="button">Hear latest reply</button></div><p id="orb-voice-status" role="status" aria-live="polite">Voice is optional. Your message is always yours to review before sending.</p><a href="#job-metrics" class="jarvis-tools-link">Plans, reminders and permissions ↓</a></section>
  <div class="metrics" id="job-metrics"><div class="metric"><strong>${s.jobs.filter(j=>['pending','awaiting_approval'].includes(j.status)).length}</strong><span>IN THE QUEUE</span></div><div class="metric"><strong>${s.jobs.filter(j=>j.status==='running').length}</strong><span>RUNNING</span></div><div class="metric"><strong>${s.jobs.filter(j=>j.status==='completed').length}</strong><span>VERIFIED & COMPLETE</span></div></div>
  <section class="card reminder-panel" aria-label="Reminders"><div class="section-heading"><div><p class="eyebrow">LOCAL REMINDERS / YOU DECIDE</p><h2>Reminders.</h2></div><button type="button" id="reminder-alerts">Enable browser alerts</button></div><p class="muted">Halo checks reminders while this page is open. Due items stay visible here and in the top bar. Browser alerts need permission; Halo cannot alert you while it is closed.</p><form id="reminder-form"><div class="reminder-form-grid"><label>Remind me to<input name="title" maxlength="200" required placeholder="Record the chorus"></label><label>Date and time<input name="due" type="datetime-local" required></label></div><button class="primary">Save reminder</button></form><p id="reminder-status" role="status" aria-live="polite">Reminders are saved in your Halo backup.</p><div id="reminder-list" aria-label="Saved reminders"></div></section>
  <section class="card voice-box" aria-label="Jarvis voice box"><div class="section-heading"><div><p class="eyebrow">LOCAL VOICE / YOU DECIDE</p><h2>Talk with Jarvis.</h2></div><button type="button" id="voice-check">Check Voicebox</button></div><p class="muted">Record through local Voicebox, review the transcript, then copy it into a task plan. Jarvis never runs a spoken command automatically.</p><div class="voice-actions"><button type="button" id="voice-record">● Record</button><button type="button" id="voice-stop" disabled>■ Stop recording</button><button type="button" id="voice-use">Use as task title</button></div><label>Voice text<textarea id="voice-text" rows="3" maxlength="10000" placeholder="Your transcript or words for Jarvis to speak"></textarea></label><label>Voicebox profile<input id="voice-profile" value="Jarvis" autocomplete="off" placeholder="Voicebox profile name"></label><div class="voice-actions"><button type="button" id="voice-speak">Speak with Voicebox</button><button type="button" id="voice-browser">Browser voice fallback</button><button type="button" id="voice-result">Speak latest verified result</button><button type="button" id="voice-stop-playback">Stop playback</button></div><p id="voice-status" role="status" aria-live="polite">Voicebox is optional. Start its local backend to use microphone transcription or speech.</p></section>
  <section class="card jarvis-chat" aria-label="Jarvis chat"><div class="section-heading"><div><p class="eyebrow">LOCAL CONVERSATION / PROJECT AWARE</p><h2>Chat with Jarvis.</h2></div><button type="button" id="chat-clear">Clear chat</button></div><p class="muted">Jarvis receives a short summary of the selected project. Replies can propose a reviewed plan; only your approval creates one. The latest 30 exchanges are saved in your Halo backup.</p><p id="jarvis-connection" class="jarvis-connection" role="status" aria-live="polite">Checking local model…</p><label class="chat-project-label">Talking about<select id="chat-project"><option value="">No project selected</option>${s.projects.map(p=>`<option value="${escape(p.id)}" ${p.id===s.activeProjectId?'selected':''}>${escape(p.name)}</option>`).join('')}</select></label><div id="chat-log" role="log" aria-label="Jarvis conversation" aria-live="polite"></div><section id="chat-proposal" class="chat-proposal" aria-label="Reviewed Jarvis proposal" hidden></section><form id="chat-form"><label>Chat model<select id="chat-model" required><option value="">Find models first</option></select></label><label>Your message<textarea id="chat-input" rows="3" maxlength="2000" required placeholder="What should I work on next?"></textarea></label><p class="chat-keyboard-hint muted">Enter to send · Shift+Enter for a new line</p><label class="chat-attachment-label">Attach a small text file (optional)<input id="chat-attachment" type="file" accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"></label><p id="chat-attachment-status" class="muted">Files stay in this browser until you send; only a bounded excerpt goes to local Ollama.</p><div class="voice-actions"><button type="button" id="chat-models">Retry connection</button><button type="button" id="chat-use-voice">Use voice text</button><button type="button" id="chat-stop" hidden>Stop</button><button class="primary" id="chat-send" type="submit">Send message</button></div></form><button type="button" id="chat-to-voice">Copy latest reply to voice box</button><p id="chat-status" role="status" aria-live="polite">Checking local model.</p></section>
  <section class="card local-llm" aria-label="Local model draft"><div class="section-heading"><div><p class="eyebrow">OPTIONAL LOCAL MODEL / DRAFT ONLY</p><h2>Draft with a local model.</h2></div><button type="button" id="llm-refresh">Find models</button></div><p class="muted">A local model may suggest one supported Jarvis form entry. Review it before creating a plan. Jarvis permissions and approval still apply.</p><label>Installed model<select id="llm-model"><option value="">Find models first</option></select></label><label>Request<textarea id="llm-request" rows="2" maxlength="2000" placeholder="Add a task to record a vocal take"></textarea></label><div class="voice-actions"><button type="button" id="llm-use-voice">Use voice text as request</button><button type="button" id="llm-suggest" ${s.projects.length ? '' : 'disabled'}>Suggest draft</button></div><p id="llm-status" role="status" aria-live="polite">${s.projects.length ? 'Local model is optional and disconnected until checked.' : 'Create a project before asking for a Jarvis draft.'}</p></section>
  <div class="editor-grid"><section class="card"><h2>What's the next move?</h2><p class="muted">Choose a supported action. Jarvis builds a fixed execution plan for your review; creating a plan does not run it.</p>${s.projects.length ? `<form id="plan-form"><label>Project<select name="projectId">${s.projects.map(p=>`<option value="${escape(p.id)}" ${p.id===s.activeProjectId?'selected':''}>${escape(p.name)}</option>`).join('')}</select></label><label>Action<select name="action" id="plan-action">${Object.entries(adapters).map(([key,a])=>`<option value="${key}">${escape(a.label)}</option>`).join('')}</select></label><label id="task-target-label" hidden>Existing task<select name="taskId" id="plan-task"></select></label><label id="instruction-label">Task title<textarea name="input" id="plan-input" rows="3" maxlength="300" required placeholder="Record the final vocal take"></textarea></label><p id="action-help" class="muted">Adds one task with exactly the title you enter.</p><button class="primary">Generate plan ↗</button></form>` : '<div class="empty"><p>Create a project before planning a job.</p><button data-new>Create project ↗</button></div>'}</section>
  <section class="card"><h2>Permission, by design.</h2><p class="muted">Grant access to each local tool. Deletions also require approval of the specific plan.</p>${Object.entries(adapters).map(([key,a])=>`<label class="task"><input type="checkbox" data-permission="${key}" ${s.permissions[key]?'checked':''}><span>${escape(a.permission)}<br><small class="muted">${escape(a.impact)}</small></span></label>`).join('')}<p class="muted">Local chat can answer questions, and local model drafts can fill the form above. Neither runs Jarvis tools. No external AI provider, messaging integration, shell execution, or filesystem tools are connected. Status summaries use recorded data only.</p></section></div>
  <section><div class="section-heading"><h2>Execution history</h2><small class="muted">Plans and results are saved on this device.</small></div><label>Filter by project<select id="job-project-filter"><option value="all">All projects</option>${s.projects.map(p=>`<option value="${escape(p.id)}" ${jobScope===p.id?'selected':''}>${escape(p.name)}</option>`).join('')}</select></label><div class="filters" aria-label="Filter jobs">${statuses.map(status=>`<button data-filter="${status}" aria-pressed="${status===jobFilter}">${status.replaceAll('_',' ')}</button>`).join('')}</div><div id="job-results">${jobCards(s,jobs)}</div></section>`;
}
function render() {
  const s = store.get();
  document.documentElement.dataset.theme = s.theme;
  document.body.dataset.view = s.view;
  $('#main').classList.toggle('jarvis-surface', s.view === 'jarvis');
  $('#breadcrumb').textContent = `Workspace / ${s.view === 'dashboard' ? 'Overview' : s.view === 'jarvis' ? 'Jarvis' : 'Project'}`;
  document.querySelectorAll('nav [data-view]').forEach(b => { if (b.dataset.view === s.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  $('#main').innerHTML = s.view === 'dashboard' ? dashboard(s) : s.view === 'project' ? projectView(s) : jarvisView(s);
  bindMain();
  if (s.view === 'project') { musicHub.bind(); musicHub.render(s); }
  if (s.view === 'dashboard') musicReference.bind();
  if (s.view === 'jarvis') { voice.bind(() => store.get().jobs.find(job => job.status === 'completed')?.result || ''); localLlm.bind(); localLlm.renderChat(s.chat || []); reminders.bind(); mountDesktopRing(document.querySelector('.jarvis-intro'), portal => { const route=destinationRoute(portal,store.get());navigate(route.view,route.projectId);focusRoute(route); }); }
  if (s.view === 'jarvis') setOrbState(s.jobs.some(job=>job.status==='running')?'executing':s.jobs.some(job=>['pending','awaiting_approval'].includes(job.status))?'waiting':'idle');
  reminders.render(s);
}
function taskChoices() {
  const p = store.get().projects.find(p=>p.id === $('#plan-form select[name="projectId"]').value);
  const tasks = p?.tasks || [];
  const selected = $('#plan-task').value;
  $('#plan-task').innerHTML = tasks.filter(t=>!t.done).map(t=>`<option value="${escape(t.id)}">${escape(t.title)}</option>`).join('');
  if(tasks.some(t=>t.id===selected && !t.done)) $('#plan-task').value=selected;
}
function bindMain() {
  $('#plan-form select[name="projectId"]')?.addEventListener('change', event=>{ run(()=>store.navigate('jarvis',event.target.value));taskChoices(); });
  $('#job-project-filter')?.addEventListener('change',event=>{jobScope=event.target.value;syncView();});
  if($('#plan-task')) taskChoices();
  bindTaskInputs();
  $('#plan-action')?.addEventListener('change', event => {
    const action = event.target.value, usesInput = ['add_task','append_note'].includes(action);
    taskChoices();
    $('#task-target-label').hidden = action !== 'complete_task';
    $('#plan-task').required = action === 'complete_task';
    $('#instruction-label').hidden = !usesInput;
    $('#plan-input').required = usesInput;
    $('#plan-input').maxLength = action === 'add_task' ? 300 : 10000;
    $('#instruction-label').firstChild.textContent = action === 'append_note' ? 'Note to append' : 'Task title';
    $('#action-help').textContent = action === 'complete_task' ? 'Targets one existing open task by ID. Enable the completion permission before running.' : action === 'delete_completed' ? 'A plan captures the currently completed tasks. Review their names before approving deletion.' : action === 'summarize' ? 'Reports current task counts and note length. Does not modify your project.' : action === 'append_note' ? 'Appends your exact text. Existing notes stay intact.' : 'Adds one task with exactly the title you enter.';
  });
  $('#plan-form')?.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); run(() => { jarvis.plan(data.get('action'),data.get('projectId'),['add_task','append_note'].includes(data.get('action')) ? data.get('input') : '', {taskId:data.get('taskId')}); jobFilter = 'all'; jobScope = data.get('projectId'); render(); notify('Plan saved. Review it before running.'); }); });
  $('#search')?.addEventListener('input', event => { search = event.target.value; const s = store.get(), q = search.toLowerCase(); $('#project-results').innerHTML = projectCards(s.projects.filter(p => [p.name,p.description,p.notes,...p.tasks.map(t=>t.title)].some(t=>t.toLowerCase().includes(q))),q); });
  $('#edit-project')?.addEventListener('input', () => { dirty = true; $('#save-state').textContent = 'Unsaved changes'; });
  $('#edit-project')?.addEventListener('submit', event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); run(() => { store.saveProject(store.get().activeProjectId, data, editorBase); dirty = false; render(); notify('Project saved on this device.'); }); });
  $('#add-task')?.addEventListener('submit', event => { event.preventDefault(); if(dirty) { notify('Save your project changes before adding a task.', true); return; } run(() => { store.addTask(store.get().activeProjectId, new FormData(event.target).get('title')); render(); $('#add-task input').focus(); }); });
  $('#session-form')?.addEventListener('submit', event => {
    event.preventDefault();
    if (dirty) { notify('Save your project changes before changing the session.', true); return; }
    const projectId = store.get().activeProjectId, data = new FormData(event.target);
    run(() => {
      if (store.get().projects.find(p => p.id === projectId)?.sessions?.some(item => item.endedAt === null)) store.finishSession(projectId, data.get('recap'));
      else store.startSession(projectId, data.get('focus'));
      render(); notify('Session saved with this project.');
    });
  });

}
if (store) {
  jarvis = createJarvis(store);
  voice = createJarvisVoice();
  localLlm = createLocalLlm(store);
  reminders = createReminders(store);
  musicHub = createMusicHub(store);
  run(() => jarvis.recover());
  store.subscribe(syncView);
  document.addEventListener('click', async event => {
    const permission = event.target.closest('[data-permission]');
    if(permission) { if(run(()=>jarvis.setPermission(permission.dataset.permission,permission.checked))===false) permission.checked = !permission.checked; return; }
    const button = event.target.closest('button'); if (!button) return;
    if (button.hasAttribute('data-new')) { if(dirty && !confirm('Discard unsaved changes?')) return; $('#form-error').textContent = ''; $('#project-dialog').showModal(); }
    if (button.dataset.view) navigate(button.dataset.view);
    if (button.hasAttribute('data-reload-project')) { if(!dirty || confirm('Discard your draft and reload the saved project?')) { dirty=false;render(); } }
    if (button.dataset.open) { navigate('project', button.dataset.open); if(button.dataset.openTask) [...document.querySelectorAll('[data-task]')].find(el=>el.dataset.task===button.dataset.openTask)?.focus(); if(button.hasAttribute('data-focus-session')) $('#session-stage')?.scrollIntoView({ block: 'start' }); }
    if (button.hasAttribute('data-focus-music')) $('#music-hub-form')?.scrollIntoView({ block: 'start' });
    if (button.dataset.projectJobs) { jobScope=button.dataset.projectJobs;jobFilter='all';navigate('jarvis',button.dataset.projectJobs); }
    if (button.dataset.planTask) {
      if(dirty) { notify('Save your project changes before planning a task.',true);return; }
      run(()=>{ const projectId=store.get().activeProjectId;jarvis.plan('complete_task',projectId,'',{taskId:button.dataset.planTask});jobScope=projectId;jobFilter='all';navigate('jarvis',projectId);notify('Task completion plan saved. Review permissions and run when ready.'); });
    }
    if (button.dataset.filter) { jobFilter = button.dataset.filter; render(); }
    if (button.dataset.jobAction) {
      const action = button.dataset.jobAction, id = button.closest('[data-job]').dataset.job;
      try {
        if(action==='execute') { setOrbState('executing'); await jarvis.execute(id); setOrbState('completed'); }
        else { jarvis[action](id); }
        notify(action==='execute'?'Job completed. Local result verified and saved.':action==='approve'?'Plan approved. Run the job when ready.':'Queue updated.');
      } catch(error) { setOrbState('error'); notify(error.message,true); }
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
  reminders.start();
  if (applicationWarning) notify(`${applicationWarning} Application settings will not be saved until the metadata is repaired.`, true);
}

// Optional presentation layers use the existing session, never another store.
if (store) window.addEventListener('halo:session-request', event => {
  event.detail.accept(Object.freeze({
    getState: () => store.get(),
    openRoute: ({view, projectId, focus}) => {
      const before = store.get();
      if (before.view !== view || (projectId && before.activeProjectId !== projectId)) navigate(view, projectId);
      const after = store.get();
      const opened=after.view === view && (!projectId || after.activeProjectId === projectId);
      if(opened)focusRoute({view,projectId,focus});
      return opened;
    }
  }));
});
