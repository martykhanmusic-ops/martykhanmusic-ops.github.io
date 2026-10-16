import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, STORAGE_KEY } from '../halo/store.js';
import { createJarvis } from '../halo/jarvis.js';
function setup() {
  const data = new Map(), disk = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const store = createStore(disk), project = store.createProject('Album'), jarvis = createJarvis(store);
  return {store,project,jarvis,disk};
}
test('plan has no side effects; execute persists verified result exactly once', async () => {
  const {store,project,jarvis,disk} = setup(); const id=jarvis.plan('add_task',project,'Record vocals');
  assert.equal(store.get().projects[0].tasks.length,0);
  assert.equal(createStore(disk).get().jobs[0].status,'pending');
  await jarvis.execute(id);
  assert.equal(createStore(disk).get().jobs[0].status,'completed');
  assert.equal(store.get().projects[0].tasks.length,1);
  assert.match(store.get().jobs[0].result,/Verified task created/);
  await assert.rejects(()=>jarvis.execute(id),/Only a pending/);
  assert.equal(store.get().projects[0].tasks.length,1);
});
test('append note and recorded-data summary execute without destroying existing notes', async () => {
  const {store,project,jarvis}=setup(); store.saveProject(project,{notes:'Original'});
  await jarvis.execute(jarvis.plan('append_note',project,'Another thought'));
  assert.equal(store.get().projects[0].notes,'Original\n\nAnother thought');
  const before=store.get().projects[0]; const id=jarvis.plan('summarize',project); await jarvis.execute(id);
  assert.match(store.get().jobs[0].result,/0 recorded task/); assert.deepEqual(store.get().projects[0],before);
});
test('deletion needs tool permission and per-plan approval; new tasks are excluded', async () => {
  const {store,project,jarvis}=setup(); store.addTask(project,'Finished'); store.toggleTask(project,store.get().projects[0].tasks[0].id);
  const id=jarvis.plan('delete_completed',project);
  await assert.rejects(()=>jarvis.execute(id),/Only a pending/);
  assert.throws(()=>jarvis.approve(id),/Enable the deletion/);
  jarvis.setPermission('delete_completed',true); jarvis.approve(id);
  store.addTask(project,'Keep this'); const second=store.get().projects[0].tasks[1].id; store.toggleTask(project,second);
  await jarvis.execute(id);
  assert.deepEqual(store.get().projects[0].tasks.map(t=>t.title),['Keep this']);
});
test('revoked tool cannot run and revocation during execution fails recoverably', async () => {
  const {store,project,jarvis}=setup(); const id=jarvis.plan('add_task',project,'Do not create');
  jarvis.setPermission('add_task',false); await assert.rejects(()=>jarvis.execute(id),/permission is disabled/);
  assert.equal(store.get().jobs[0].status,'pending');
  jarvis.setPermission('add_task',true); const running=jarvis.execute(id); jarvis.setPermission('add_task',false);
  await assert.rejects(()=>running,/permission is disabled/);
  assert.equal(store.get().jobs[0].status,'failed'); assert.equal(store.get().projects[0].tasks.length,0);
  jarvis.retry(id); jarvis.setPermission('add_task',true); await jarvis.execute(id);
  assert.equal(store.get().projects[0].tasks.length,1);
});
test('changed deletion targets fail without changes and retry requires fresh approval', async () => {
  const {store,project,jarvis}=setup(); store.addTask(project,'Changed task'); const task=store.get().projects[0].tasks[0].id;
  store.toggleTask(project,task); const id=jarvis.plan('delete_completed',project); jarvis.setPermission('delete_completed',true); jarvis.approve(id);
  store.toggleTask(project,task); await assert.rejects(()=>jarvis.execute(id),/Planned tasks changed/);
  assert.equal(store.get().projects[0].tasks.length,1); jarvis.retry(id);
  assert.equal(store.get().jobs[0].status,'awaiting_approval'); assert.equal(store.get().jobs[0].approved,false);
});
test('interrupted jobs recover as failed without automatic execution', () => {
  const {store,project,jarvis,disk}=setup(); jarvis.plan('add_task',project,'No duplicate');
  store.transact(s=>{s.jobs[0].status='running';});
  const reopened=createStore(disk); createJarvis(reopened).recover();
  assert.equal(reopened.get().jobs[0].status,'failed'); assert.equal(reopened.get().projects[0].tasks.length,0);
});
test('restore never carries forward destructive permissions or approvals', () => {
  const {store,project,jarvis}=setup(); store.addTask(project,'Done'); store.toggleTask(project,store.get().projects[0].tasks[0].id);
  const id=jarvis.plan('delete_completed',project); jarvis.setPermission('delete_completed',true); jarvis.approve(id);
  store.restore(JSON.stringify(store.get()));
  assert.equal(store.get().permissions.delete_completed,false); assert.equal(store.get().jobs[0].approved,false); assert.equal(store.get().jobs[0].status,'awaiting_approval');
});
test('unsupported tools and malformed imported workflows are rejected', () => {
  const {store,project,jarvis}=setup(); assert.throws(()=>jarvis.plan('send_email',project)); assert.throws(()=>jarvis.plan('add_task',project,''));
  const backup=store.get(); backup.jobs=[{action:'shell'}]; assert.throws(()=>store.restore(JSON.stringify(backup)),/Invalid Jarvis/);
});
test('quota failure never leaves a tool effect partially committed', async () => {
  const {store,project,jarvis,disk}=setup(); const id=jarvis.plan('add_task',project,'Atomic task');
  const execution=jarvis.execute(id); const original=disk.setItem; disk.setItem=()=>{throw new Error('Quota exceeded');};
  await assert.rejects(()=>execution,/Save failed/); assert.equal(store.get().projects[0].tasks.length,0);
  disk.setItem=original; const reopened=createStore(disk); createJarvis(reopened).recover(); assert.equal(reopened.get().jobs[0].status,'failed');
});
test('clearing storage in another tab cannot be silently overwritten', () => {
  const {store,disk}=setup(); disk.setItem(STORAGE_KEY,null);
  assert.throws(()=>store.createProject('Stale'),/Another tab/);
});
