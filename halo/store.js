export const STORAGE_KEY = 'halo.workspace.v1';
const stamp = () => new Date().toISOString();
const id = () => crypto.randomUUID();
export const emptyState = () => ({ version: 1, projects: [], activeProjectId: null, view: 'dashboard', theme: 'dark', activity: [], jobs: [] });
const isText = value => typeof value === 'string';
const isDate = value => isText(value) && Number.isFinite(Date.parse(value));
export function validate(state) {
  if (!state || state.version !== 1 || !Array.isArray(state.projects) || !Array.isArray(state.activity) || !Array.isArray(state.jobs) || !['dashboard', 'project', 'jarvis'].includes(state.view) || !['dark', 'light'].includes(state.theme)) throw new Error('This is not a supported Halo backup.');
  const ids = new Set();
  for (const p of state.projects) {
    if (!isText(p.id) || ids.has(p.id) || !isText(p.name) || !p.name.trim() || !isText(p.description) || !isText(p.notes) || !isDate(p.createdAt) || !isDate(p.updatedAt) || !Array.isArray(p.tasks)) throw new Error('Invalid project data.');
    ids.add(p.id);
    const taskIds = new Set();
    for (const t of p.tasks) {
      if (!isText(t.id) || taskIds.has(t.id) || !isText(t.title) || !t.title.trim() || typeof t.done !== 'boolean') throw new Error('Invalid task data.');
      taskIds.add(t.id);
    }
  }
  if (state.activeProjectId !== null && !ids.has(state.activeProjectId)) throw new Error('The saved project could not be found.');
  for (const a of state.activity) if (!a || !isText(a.id) || !isText(a.message) || !isDate(a.at)) throw new Error('Invalid activity data.');
  return state;
}
export function createStore(storage) {
  let state;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    state = raw === null ? emptyState() : validate(JSON.parse(raw));
  } catch (error) { throw new Error(`Halo could not read saved data. Your stored data has not been changed. ${error.message}`); }
  const listeners = new Set();
  function transact(change) {
    const next = structuredClone(state);
    change(next);
    validate(next);
    try {
      const existing = storage.getItem(STORAGE_KEY);
      if (existing !== null && existing !== JSON.stringify(state)) throw new Error('Another tab changed this workspace. Reload before saving.');
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) { throw new Error(`Save failed. ${error.message}`); }
    state = next;
    listeners.forEach(fn => fn());
  }
  function activity(s, message) { s.activity.unshift({ id: id(), message, at: stamp() }); s.activity = s.activity.slice(0, 100); }
  function project(s, projectId) {
    const p = s.projects.find(p => p.id === projectId);
    if (!p) throw new Error('Project no longer exists.');
    return p;
  }
  return {
    get: () => structuredClone(state),
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    transact, activity, project,
    createProject(name, description = '') {
      name = name.trim();
      if (!name || name.length > 120) throw new Error('Enter a project name of 1–120 characters.');
      const projectId = id();
      transact(s => {
        s.projects.unshift({ id: projectId, name, description: description.trim(), notes: '', tasks: [], createdAt: stamp(), updatedAt: stamp() });
        s.activeProjectId = projectId; s.view = 'project'; activity(s, `Created ${name}`);
      });
      return projectId;
    },
    navigate(view, projectId) { transact(s => { s.view = view; if (projectId) { project(s, projectId); s.activeProjectId = projectId; } }); },
    saveProject(projectId, fields) {
      transact(s => {
        const p = project(s, projectId);
        if (fields.name !== undefined) { if (!fields.name.trim() || fields.name.trim().length > 120) throw new Error('Enter a project name of 1–120 characters.'); p.name = fields.name.trim(); }
        if (fields.description !== undefined) p.description = fields.description;
        if (fields.notes !== undefined) p.notes = fields.notes;
        p.updatedAt = stamp(); activity(s, `Saved ${p.name}`);
      });
    },
    addTask(projectId, title) {
      if (!title.trim() || title.trim().length > 300) throw new Error('Enter a task of 1–300 characters.');
      transact(s => { const p = project(s, projectId); p.tasks.push({ id: id(), title: title.trim(), done: false }); p.updatedAt = stamp(); activity(s, `Added task to ${p.name}`); });
    },
    toggleTask(projectId, taskId) {
      transact(s => { const p = project(s, projectId); const t = p.tasks.find(t => t.id === taskId); if (!t) throw new Error('Task no longer exists.'); t.done = !t.done; p.updatedAt = stamp(); activity(s, `Updated task in ${p.name}`); });
    },
    setTheme(theme) { transact(s => { s.theme = theme; }); },
    restore(raw) {
      const imported = validate(JSON.parse(raw));
      transact(s => { Object.assign(s, imported); activity(s, 'Restored workspace backup'); });
    }
  };
}
