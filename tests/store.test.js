import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, STORAGE_KEY } from '../halo/store.js';
import { dueReminders } from '../halo/reminders.js';
export function memory() { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) }; }
test('create → save → reopen → resume retains notes, tasks, route and theme', () => {
  const disk = memory(), first = createStore(disk);
  const id = first.createProject('First album', 'Recording');
  first.saveProject(id, { notes: 'Verse one\nKeep this exact draft.' });
  first.addTask(id, 'Record hook');
  first.toggleTask(id, first.get().projects[0].tasks[0].id);
  first.setTheme('light');
  const reopened = createStore(disk);
  assert.deepEqual(reopened.get(), first.get());
  assert.equal(reopened.get().activeProjectId, id);
  assert.equal(reopened.get().view, 'project');
  reopened.navigate('dashboard'); reopened.navigate('project', id);
  assert.equal(reopened.get().projects[0].notes, 'Verse one\nKeep this exact draft.');
});
test('failed save leaves previous data and memory unchanged', () => {
  const disk = memory(), store = createStore(disk); store.createProject('Safe');
  const before = store.get(); disk.setItem = () => { throw new Error('Quota exceeded'); };
  assert.throws(() => store.saveProject(before.activeProjectId, {notes:'lost?'}), /Save failed/);
  assert.deepEqual(store.get(), before); assert.deepEqual(createStore(disk).get(),before);
});
test('corrupt data is preserved and never silently reset', () => {
  const disk = memory(); disk.setItem(STORAGE_KEY, '{invalid');
  assert.throws(() => createStore(disk), /has not been changed/);
  assert.equal(disk.getItem(STORAGE_KEY), '{invalid');
});
test('stale tab cannot overwrite another tab', () => {
  const disk = memory(), a = createStore(disk), b = createStore(disk);
  a.createProject('Keep me'); assert.throws(()=>b.createProject('Stale'), /Another tab/);
  assert.equal(createStore(disk).get().projects[0].name,'Keep me');
});
test('backup restores data; invalid backup leaves state untouched', () => {
  const a = createStore(memory()), b = createStore(memory()); a.createProject('Portable');
  b.restore(JSON.stringify(a.get())); assert.equal(b.get().projects[0].name,'Portable');
  const before = b.get(); assert.throws(()=>b.restore('{"version":2}')); assert.deepEqual(b.get(),before);
});
test('empty project names and tasks are rejected', () => {
  const s = createStore(memory()); assert.throws(()=>s.createProject(' ')); const id=s.createProject('Valid'); assert.throws(()=>s.addTask(id,' '));
});
test('music links share the project store and backup without storing audio bytes', () => {
  const disk = memory(), store = createStore(disk), projectId = store.createProject('Album');
  store.saveProject(projectId, { notes: 'Vocal draft' });
  const taskId = store.addTask(projectId, 'Mix chorus');
  const verified = { kind: 'audio', root: 'C:\\Music', relative: 'demo.wav', name: 'demo.wav', bytes: 1234, modifiedAt: new Date().toISOString(), verifiedAt: new Date().toISOString() };
  const resourceId = store.addMusicResource(projectId, verified, { tags: ['demo'], notes: 'Take one' });
  assert.throws(() => store.addMusicResource(projectId, verified), /already linked/);
  store.updateMusicResource(projectId, resourceId, { name: 'Chorus demo', tags: ['vocals'], notes: 'Take two' });
  const reopened = createStore(disk), project = reopened.get().projects[0];
  assert.equal(project.notes, 'Vocal draft');
  assert.equal(project.tasks[0].id, taskId);
  assert.equal(project.musicResources[0].name, 'Chorus demo');
  assert.equal(project.musicResources[0].notes, 'Take two');
  assert.equal(JSON.stringify(reopened.get()).includes('audioBytes'), false);
  reopened.removeMusicResource(projectId, resourceId);
  assert.equal(reopened.get().projects[0].musicResources.length, 0);
  assert.equal(reopened.get().projects[0].tasks[0].id, taskId);
});
test('Jarvis chat stays in the canonical backup and cannot alter tasks or jobs', () => {
  const disk = memory(), store = createStore(disk); const projectId = store.createProject('Chat project');
  store.addChatExchange('How should I start?', 'Sketch the chorus.');
  assert.equal(store.get().chat.length, 2);
  assert.equal(store.get().projects[0].tasks.length, 0);
  assert.equal(store.get().jobs.length, 0);
  const reopened = createStore(disk);
  assert.equal(reopened.get().chat[1].text, 'Sketch the chorus.');
  const restored = createStore(memory()); restored.restore(JSON.stringify(reopened.get()));
  assert.equal(restored.get().chat.length, 2);
  assert.equal(restored.get().activeProjectId, projectId);
  restored.clearChat();
  assert.equal(restored.get().chat.length, 0);
  assert.equal(restored.get().projects[0].id, projectId);
  assert.throws(() => restored.addChatExchange('', 'reply'), /Invalid/);
});
test('reminders persist with workspace backups and preserve project and Jarvis state', () => {
  const disk = memory(), store = createStore(disk);
  const projectId = store.createProject('Album');
  const dueAt = new Date(Date.now() + 120000).toISOString();
  const id = store.addReminder('Record chorus', dueAt);
  assert.equal(store.get().reminders[0].id, id);
  assert.equal(dueReminders(store.get().reminders, Date.parse(dueAt) - 1).length, 0);
  assert.equal(dueReminders(store.get().reminders, Date.parse(dueAt)).length, 1);
  assert.equal(createStore(disk).get().reminders[0].title, 'Record chorus');
  const restored = createStore(memory());
  restored.restore(JSON.stringify(store.get()));
  assert.equal(restored.get().reminders.length, 1);
  restored.setReminderStatus(id, 'done');
  assert.equal(dueReminders(restored.get().reminders, Date.parse(dueAt)).length, 0);
  assert.equal(restored.get().projects[0].id, projectId);
  assert.equal(restored.get().jobs.length, 0);
  restored.removeReminder(id);
  assert.equal(restored.get().reminders.length, 0);
});
test('reminder dates and status are validated; older backups gain an empty list', () => {
  const store = createStore(memory());
  assert.throws(() => store.addReminder('Late', new Date(Date.now() - 1000).toISOString()), /future/);
  assert.throws(() => store.addReminder('', new Date(Date.now() + 60000).toISOString()), /future/);
  const id = store.addReminder('Future', new Date(Date.now() + 60000).toISOString());
  assert.throws(() => store.setReminderStatus(id, 'pending'), /Unsupported/);
  assert.throws(() => store.markReminderAlerted(id), /not ready/);
  store.setReminderStatus(id, 'cancelled');
  assert.throws(() => store.setReminderStatus(id, 'done'), /Pending/);
  const legacy = store.get(); delete legacy.reminders;
  const restored = createStore(memory()); restored.restore(JSON.stringify(legacy));
  assert.deepEqual(restored.get().reminders, []);
});
