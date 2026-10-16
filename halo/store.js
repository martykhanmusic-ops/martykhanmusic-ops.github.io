import { getProject, addProjectTask, getTask, setTaskDone } from './project-state.js';
export const STORAGE_KEY = 'halo.workspace.v1';
const stamp = () => new Date().toISOString();
const id = () => crypto.randomUUID();
export const defaultPermissions = () => ({ add_task: true, complete_task: false, append_note: true, summarize: true, delete_completed: false });
export const emptyState = () => ({ version: 1, projects: [], activeProjectId: null, view: 'dashboard', theme: 'dark', activity: [], jobs: [], permissions: defaultPermissions() });
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
  if (state.permissions !== undefined) {
    const required = ['add_task', 'append_note', 'summarize', 'delete_completed'];
    if (!state.permissions || typeof state.permissions !== 'object' || Array.isArray(state.permissions) || required.some(key => typeof state.permissions[key] !== 'boolean') || Object.keys(state.permissions).some(key => !Object.hasOwn(defaultPermissions(), key) || typeof state.permissions[key] !== 'boolean')) throw new Error('Invalid tool permissions.');
  }
  const jobIds = new Set();
  for (const j of state.jobs) {
    if (!j || !isText(j.id) || jobIds.has(j.id) || !['add_task','complete_task','append_note','summarize','delete_completed'].includes(j.action) || !['pending','awaiting_approval','running','completed','failed','cancelled'].includes(j.status) || !isText(j.projectId) || !isText(j.projectName) || !isText(j.input) || !isText(j.result) || !isText(j.error) || typeof j.approved !== 'boolean' || !isDate(j.createdAt) || !isDate(j.updatedAt) || !Array.isArray(j.plan) || !j.plan.every(isText) || !Array.isArray(j.targetIds) || !j.targetIds.every(isText) || !Array.isArray(j.logs) || j.logs.some(l => !l || !isDate(l.at) || !isText(l.event) || !isText(l.message) || !['info','error'].includes(l.level)) || (j.resultTaskIds !== undefined && (!Array.isArray(j.resultTaskIds) || !j.resultTaskIds.every(isText)))) throw new Error('Invalid Jarvis workflow data.');
    if (j.action === 'complete_task' && j.targetIds.length !== 1) throw new Error('Invalid task completion target.');
    jobIds.add(j.id);
  }
  return state;
}
export function createStore(storage) {
  let state, lastSaved;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    lastSaved = raw;
    state = raw === null ? emptyState() : validate(JSON.parse(raw));
    state.permissions = { ...defaultPermissions(), ...state.permissions };
  } catch (error) { throw new Error(`Halo could not read saved data. Your stored data has not been changed. ${error.message}`); }
  const listeners = new Set();
  function transact(change) {
    const next = structuredClone(state);
    change(next);
    validate(next);
    try {
      const existing = storage.getItem(STORAGE_KEY);
      if (existing !== lastSaved) throw new Error('Another tab changed this workspace. Reload before saving.');
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) { throw new Error(`Save failed. ${error.message}`); }
    state = next;
    lastSaved = JSON.stringify(next);
    listeners.forEach(fn => fn());
  }
  function activity(s, message) { s.activity.unshift({ id: id(), message, at: stamp() }); s.activity = s.activity.slice(0, 100); }
  const project = getProject;
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
    saveProject(projectId, fields, expected) {
      transact(s => {
        const p = project(s, projectId);
        if (expected && Object.keys(fields).some(key => p[key] !== expected[key])) throw new Error('Project changed since this editor opened. Your draft is intact. Copy your changes, then reload the saved project before saving.');
        if (fields.name !== undefined) { if (!fields.name.trim() || fields.name.trim().length > 120) throw new Error('Enter a project name of 1–120 characters.'); p.name = fields.name.trim(); }
        if (fields.description !== undefined) p.description = fields.description;
        if (fields.notes !== undefined) p.notes = fields.notes;
        p.updatedAt = stamp(); activity(s, `Saved ${p.name}`);
      });
    },
    addTask(projectId, title) {
      let taskId;
      transact(s => { const p = project(s, projectId); taskId = addProjectTask(p, title).id; activity(s, `Added task to ${p.name}`); });
      return taskId;
    },
    toggleTask(projectId, taskId) {
      transact(s => { const p = project(s, projectId); setTaskDone(p, taskId, !getTask(p, taskId).done); activity(s, `Updated task in ${p.name}`); });
    },
    setTheme(theme) { transact(s => { s.theme = theme; }); },
    restore(raw) {
      const imported = validate(JSON.parse(raw));
      imported.permissions = defaultPermissions();
      for (const job of imported.jobs) {
        if (['running', 'pending', 'awaiting_approval'].includes(job.status)) {
          job.approved = false;
          job.status = job.action === 'delete_completed' ? 'awaiting_approval' : 'pending';
          job.logs.push({ at: stamp(), level: 'info', event: 'restore', message: 'Imported workflow requires manual review and execution.' });
        }
      }
      transact(s => { Object.assign(s, imported); activity(s, 'Restored workspace backup'); });
    }
  };
}
