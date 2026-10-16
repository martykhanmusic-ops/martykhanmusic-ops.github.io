import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../halo/store.js';
import {createJarvis} from '../halo/jarvis.js';
function workspace(){
  const data=new Map(), disk={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const store=createStore(disk),jarvis=createJarvis(store),projectId=store.createProject('Cancellation');
  return {store,jarvis,projectId,disk};
}
test('cancelled queued and approved destructive plans survive reopen without effects or replay',async()=>{
  const {store,jarvis,projectId,disk}=workspace();
  const taskId=store.addTask(projectId,'Keep this task');store.toggleTask(projectId,taskId);
  const add=jarvis.plan('add_task',projectId,'Must never appear');
  const deletion=jarvis.plan('delete_completed',projectId);
  jarvis.setPermission('delete_completed',true);jarvis.approve(deletion);
  for(const id of [add,deletion])jarvis.cancel(id);
  const reopened=createStore(disk),worker=createJarvis(reopened);worker.recover();
  for(const id of [add,deletion]){
    await assert.rejects(()=>worker.execute(id),/Only a pending/);
    assert.throws(()=>worker.retry(id),/Only failed/);
    const job=reopened.get().jobs.find(j=>j.id===id);
    assert.equal(job.status,'cancelled');assert.equal(job.approved,false);
    assert.equal(job.logs.at(-1).event,'cancelled');
  }
  assert.deepEqual(reopened.get().projects[0].tasks,[{id:taskId,title:'Keep this task',done:true}]);
});
test('concurrent execute requests admit one local effect and retain a verified audit after reopen',async()=>{
  const {store,jarvis,projectId,disk}=workspace();
  const id=jarvis.plan('add_task',projectId,'Exactly once');
  const results=await Promise.allSettled([jarvis.execute(id),jarvis.execute(id)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.match(results.find(r=>r.status==='rejected').reason.message,/Only a pending/);
  const reopened=createStore(disk).get();assert.equal(reopened.projects[0].tasks.length,1);
  assert.equal(reopened.jobs[0].resultTaskIds[0],reopened.projects[0].tasks[0].id);
  assert.deepEqual(reopened.jobs[0].logs.map(l=>l.event),['planned','started','verified']);
});
test('running atomic operation rejects late cancellation rather than promising rollback',async()=>{
  const {store,jarvis,projectId}=workspace();const id=jarvis.plan('append_note',projectId,'Atomic note');
  const pending=jarvis.execute(id);
  assert.throws(()=>jarvis.cancel(id),/cannot be cancelled/);
  await pending;
  assert.equal(store.get().projects[0].notes,'Atomic note');
  assert.equal(store.get().jobs[0].status,'completed');
  assert.equal(store.get().jobs[0].logs.some(l=>l.event==='cancelled'),false);
});
