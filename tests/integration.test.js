import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, STORAGE_KEY } from '../halo/store.js';
import { createJarvis } from '../halo/jarvis.js';
import { projectJobs } from '../halo/project-state.js';

function workspace() {
  const data = new Map();
  const disk = { getItem: key => data.get(key) ?? null, setItem: (key,value) => data.set(key,value) };
  const store = createStore(disk);
  return { store, disk, jarvis: createJarvis(store) };
}
test('Halo task → Jarvis completion → Halo state → reopen uses the same task ID', async () => {
  const {store,jarvis,disk} = workspace();
  const projectId = store.createProject('Record');
  const taskId = store.addTask(projectId,'Mix vocals');
  const jobId = jarvis.plan('complete_task',projectId,'',{taskId});
  assert.equal(store.get().projects[0].tasks[0].done,false);
  await assert.rejects(()=>jarvis.execute(jobId), /permission is disabled/);
  jarvis.setPermission('complete_task',true);
  await jarvis.execute(jobId);
  const reopened = createStore(disk).get();
  assert.deepEqual(reopened.projects[0].tasks,[{id:taskId,title:'Mix vocals',done:true}]);
  assert.deepEqual(projectJobs(reopened,projectId)[0].resultTaskIds,[taskId]);
  assert.equal(reopened.jobs[0].status,'completed');
  assert.deepEqual(reopened.jobs[0].logs.map(l=>l.event),['planned','started','verified']);
});
test('Jarvis-created task is editable in Halo and usable by a later plan without copying', async () => {
  const {store,jarvis} = workspace(); const projectId=store.createProject('Album');
  const create=jarvis.plan('add_task',projectId,'Record drums'); await jarvis.execute(create);
  const taskId=store.get().jobs[0].resultTaskIds[0];
  store.toggleTask(projectId,taskId);
  const summary=jarvis.plan('summarize',projectId); await jarvis.execute(summary);
  assert.match(store.get().jobs[0].result,/1 completed, 0 open/);
  store.toggleTask(projectId,taskId);
  jarvis.setPermission('complete_task',true);
  await jarvis.execute(jarvis.plan('complete_task',projectId,'',{taskId}));
  assert.equal(store.get().projects[0].tasks.length,1);
  assert.equal(store.get().projects[0].tasks[0].done,true);
});
test('renaming and switching projects keeps plans bound by ID and audit snapshots intact', async () => {
  const {store,jarvis,disk}=workspace(); const a=store.createProject('Original'); const taskId=store.addTask(a,'A only');
  const job=jarvis.plan('complete_task',a,'',{taskId}); const originalPlan=store.get().jobs[0].plan;
  const b=store.createProject('Other'); store.addTask(b,'B only');
  store.saveProject(a,{name:'Renamed'}); jarvis.setPermission('complete_task',true); await jarvis.execute(job);
  const state=createStore(disk).get();
  assert.equal(state.activeProjectId,b);
  assert.equal(state.projects.find(p=>p.id===b).tasks[0].done,false);
  assert.equal(state.projects.find(p=>p.id===a).tasks[0].done,true);
  assert.equal(projectJobs(state,b).length,0);
  assert.equal(projectJobs(state,a)[0].projectName,'Original');
  assert.deepEqual(projectJobs(state,a)[0].plan,originalPlan);
  assert.match(projectJobs(state,a)[0].result,/Renamed/);
});
test('plans cannot complete a task from another project or resurrect an approved deletion', async () => {
  const {store,jarvis}=workspace(); const a=store.createProject('A'), taskId=store.addTask(a,'Delete me'), b=store.createProject('B');
  assert.throws(()=>jarvis.plan('complete_task',b,'',{taskId}),/Task no longer exists/);
  const complete=jarvis.plan('complete_task',a,'',{taskId});
  store.toggleTask(a,taskId); const deletion=jarvis.plan('delete_completed',a);
  jarvis.setPermission('delete_completed',true); jarvis.approve(deletion); await jarvis.execute(deletion);
  jarvis.setPermission('complete_task',true); await assert.rejects(()=>jarvis.execute(complete),/Task no longer exists/);
  assert.equal(store.get().projects.find(p=>p.id===a).tasks.length,0);
  assert.equal(store.get().jobs.find(j=>j.id===complete).status,'failed');
  assert.equal(store.get().jobs.find(j=>j.id===deletion).status,'completed');
});
test('background note execution rejects stale editor saves but unrelated task updates do not', async () => {
  const {store,jarvis}=workspace(); const projectId=store.createProject('Draft'); store.saveProject(projectId,{notes:'Original'});
  const editor=store.get().projects[0];
  const note=jarvis.plan('append_note',projectId,'Jarvis addition'); await jarvis.execute(note);
  assert.throws(()=>store.saveProject(projectId,{name:'Draft',description:'',notes:'Stale draft'},editor),/Project changed/);
  assert.equal(store.get().projects[0].notes,'Original\n\nJarvis addition');
  const fresh=store.get().projects[0];
  await jarvis.execute(jarvis.plan('add_task',projectId,'Does not change notes'));
  store.saveProject(projectId,{name:'Draft',description:'',notes:'Merged draft'},fresh);
  assert.equal(store.get().projects[0].tasks.length,1);
  assert.equal(store.get().projects[0].notes,'Merged draft');
});
test('completion recovery, permission revocation, retry and duplicate execution stay safe', async () => {
  const {store,jarvis,disk}=workspace(); const projectId=store.createProject('Recovery'), taskId=store.addTask(projectId,'One task');
  const jobId=jarvis.plan('complete_task',projectId,'',{taskId}); jarvis.setPermission('complete_task',true);
  const running=jarvis.execute(jobId); jarvis.setPermission('complete_task',false);
  await assert.rejects(()=>running,/permission is disabled/);
  assert.equal(store.get().projects[0].tasks[0].done,false);
  jarvis.retry(jobId); store.transact(s=>{s.jobs[0].status='running';});
  const restored=createStore(disk), worker=createJarvis(restored); worker.recover();
  assert.equal(restored.get().jobs[0].status,'failed');
  worker.retry(jobId); worker.setPermission('complete_task',true); await worker.execute(jobId);
  await assert.rejects(()=>worker.execute(jobId),/Only a pending/);
  assert.equal(restored.get().projects[0].tasks.length,1);
  assert.equal(restored.get().projects[0].tasks[0].done,true);
  assert.ok(restored.get().jobs[0].logs.some(l=>l.event==='interrupted'));
});
test('legacy workspaces load safely with completion disabled and history unchanged', () => {
  const {store,disk,jarvis}=workspace(); const project=store.createProject('Legacy'); jarvis.plan('add_task',project,'Pending');
  const legacy=store.get(); delete legacy.permissions.complete_task; delete legacy.jobs[0].resultTaskIds;
  disk.setItem(STORAGE_KEY,JSON.stringify(legacy));
  const reopened=createStore(disk); assert.equal(reopened.get().permissions.complete_task,false);
  reopened.addTask(project,'New task');
  assert.deepEqual(reopened.get().jobs,legacy.jobs);
  // Only the new permission is optional for compatibility. Missing established
  // permission flags must still be rejected, not silently grant access.
  const invalid = structuredClone(legacy); delete invalid.permissions.delete_completed;
  assert.throws(()=>reopened.restore(JSON.stringify(invalid)),/Invalid tool permissions/);
});
