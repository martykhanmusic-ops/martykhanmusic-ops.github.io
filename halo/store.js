import { getProject, addProjectTask, getTask, setTaskDone } from './project-state.js';
export const STORAGE_KEY = 'halo.workspace.v1';
const stamp = () => new Date().toISOString();
const id = () => crypto.randomUUID();
export const defaultPermissions = () => ({ add_task: true, complete_task: false, append_note: true, summarize: true, delete_completed: false });
export const emptyState = () => ({ version: 1, projects: [], activeProjectId: null, view: 'dashboard', theme: 'dark', activity: [], jobs: [], chat: [], reminders: [], permissions: defaultPermissions() });
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
    if (p.musicResources !== undefined) {
      if (!Array.isArray(p.musicResources) || p.musicResources.length > 100) throw new Error('Invalid music resources.');
      const resourceIds = new Set();
      for (const resource of p.musicResources) {
        if (!resource || !isText(resource.id) || resourceIds.has(resource.id) || !['audio', 'sample', 'daw-project'].includes(resource.kind) || !isText(resource.name) || !resource.name.trim() || resource.name.length > 160 || !isText(resource.root) || !resource.root || resource.root.length > 500 || !isText(resource.relative) || !resource.relative || resource.relative.length > 500 || !Number.isSafeInteger(resource.bytes) || resource.bytes < 0 || !isDate(resource.modifiedAt) || !isDate(resource.verifiedAt) || !isDate(resource.createdAt) || !Array.isArray(resource.tags) || resource.tags.length > 10 || resource.tags.some(tag => !isText(tag) || !tag.trim() || tag.length > 30) || !isText(resource.notes) || resource.notes.length > 2000) throw new Error('Invalid music resource.');
        resourceIds.add(resource.id);
      }
    }
  }
  if (state.activeProjectId !== null && !ids.has(state.activeProjectId)) throw new Error('The saved project could not be found.');
  if (state.chat !== undefined && (!Array.isArray(state.chat) || state.chat.length > 60 || state.chat.some(message => !message || !isText(message.id) || !['user','assistant'].includes(message.role) || !isText(message.text) || !message.text.trim() || message.text.length > 4000 || !isDate(message.at)))) throw new Error('Invalid Jarvis chat data.');
  if (state.reminders !== undefined && (!Array.isArray(state.reminders) || state.reminders.length > 200 || state.reminders.some(reminder => !reminder || !isText(reminder.id) || !isText(reminder.title) || !reminder.title.trim() || reminder.title.length > 200 || !isDate(reminder.dueAt) || !isDate(reminder.createdAt) || !['pending','done','cancelled'].includes(reminder.status) || (reminder.alertedAt !== null && !isDate(reminder.alertedAt))))) throw new Error('Invalid reminder data.');
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
    state.chat = state.chat || [];
    state.reminders = state.reminders || [];
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
        s.projects.unshift({ id: projectId, name, description: description.trim(), notes: '', tasks: [], musicResources: [], createdAt: stamp(), updatedAt: stamp() });
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
    addMusicResource(projectId, verified, details = {}) {
      if (!verified || !['audio', 'sample', 'daw-project'].includes(verified.kind) || !isText(verified.root) || !isText(verified.relative) || !Number.isSafeInteger(verified.bytes) || verified.bytes < 0 || !isDate(verified.modifiedAt) || !isDate(verified.verifiedAt)) throw new Error('A verified local music file is required.');
      const name = (details.name || verified.name || '').trim();
      const notes = (details.notes || '').trim();
      const tags = (details.tags || []).map(tag => tag.trim()).filter(Boolean);
      if (!name || name.length > 160 || notes.length > 2000 || tags.length > 10 || tags.some(tag => tag.length > 30)) throw new Error('Check the music title, notes and tags.');
      const resourceId = id();
      transact(s => {
        const p = project(s, projectId);
        p.musicResources ||= [];
        if (p.musicResources.length >= 100) throw new Error('Music resource limit reached.');
        if (p.musicResources.some(item => item.root === verified.root && item.relative === verified.relative)) throw new Error('This file is already linked to the project.');
        p.musicResources.push({ id: resourceId, kind: verified.kind, name, root: verified.root, relative: verified.relative, bytes: verified.bytes, modifiedAt: verified.modifiedAt, verifiedAt: verified.verifiedAt, createdAt: stamp(), tags, notes });
        p.updatedAt = stamp(); activity(s, `Linked music file to ${p.name}`);
      });
      return resourceId;
    },
    updateMusicResource(projectId, resourceId, details) {
      const name = (details.name || '').trim(), notes = (details.notes || '').trim();
      const tags = (details.tags || []).map(tag => tag.trim()).filter(Boolean);
      if (!name || name.length > 160 || notes.length > 2000 || tags.length > 10 || tags.some(tag => tag.length > 30)) throw new Error('Check the music title, notes and tags.');
      transact(s => {
        const p = project(s, projectId), resource = (p.musicResources || []).find(item => item.id === resourceId);
        if (!resource) throw new Error('Music resource not found.');
        Object.assign(resource, { name, notes, tags }); p.updatedAt = stamp();
      });
    },
    removeMusicResource(projectId, resourceId) {
      transact(s => {
        const p = project(s, projectId), index = (p.musicResources || []).findIndex(item => item.id === resourceId);
        if (index < 0) throw new Error('Music resource not found.');
        p.musicResources.splice(index, 1); p.updatedAt = stamp();
      });
    },
    setTheme(theme) { transact(s => { s.theme = theme; }); },
    addChatExchange(user, assistant) {
      if (!isText(user) || !user.trim() || user.length > 2000 || !isText(assistant) || !assistant.trim() || assistant.length > 4000) throw new Error('Invalid Jarvis chat exchange.');
      transact(s => {
        s.chat = (s.chat || []).slice(-58);
        s.chat.push({ id: id(), role: 'user', text: user.trim(), at: stamp() }, { id: id(), role: 'assistant', text: assistant.trim(), at: stamp() });
      });
    },
    clearChat() { transact(s => { s.chat = []; }); },
    addReminder(title, dueAt) {
      if (!isText(title) || !title.trim() || title.length > 200 || !isDate(dueAt) || Date.parse(dueAt) <= Date.now()) throw new Error('Enter a reminder and a future date and time.');
      const reminderId = id();
      transact(s => {
        if (s.reminders.length >= 200) throw new Error('Reminder limit reached. Remove an old reminder before adding another.');
        s.reminders.push({ id: reminderId, title: title.trim(), dueAt: new Date(dueAt).toISOString(), createdAt: stamp(), status: 'pending', alertedAt: null });
      });
      return reminderId;
    },
    setReminderStatus(reminderId, status) {
      if (!['done','cancelled'].includes(status)) throw new Error('Unsupported reminder status.');
      transact(s => {
        const reminder = s.reminders.find(item => item.id === reminderId);
        if (!reminder || reminder.status !== 'pending') throw new Error('Pending reminder not found.');
        reminder.status = status;
      });
    },
    markReminderAlerted(reminderId) {
      transact(s => {
        const reminder = s.reminders.find(item => item.id === reminderId);
        if (!reminder || reminder.status !== 'pending' || reminder.alertedAt || Date.parse(reminder.dueAt) > Date.now()) throw new Error('Reminder is not ready for an alert.');
        reminder.alertedAt = stamp();
      });
    },
    removeReminder(reminderId) {
      transact(s => {
        const index = s.reminders.findIndex(item => item.id === reminderId);
        if (index < 0) throw new Error('Reminder not found.');
        s.reminders.splice(index, 1);
      });
    },
    restore(raw) {
      const imported = validate(JSON.parse(raw));
      imported.chat = imported.chat || [];
      imported.reminders = imported.reminders || [];
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
