// The adapter registry is deliberately local-only. No arbitrary code, shell,
// network requests, filesystem access, or natural-language execution is allowed.
export const adapters = Object.freeze({
  add_task: { label: 'Create a task', permission: 'Create project tasks', impact: 'local write' },
  append_note: { label: 'Append working notes', permission: 'Append project notes', impact: 'local write' },
  summarize: { label: 'Summarize project status', permission: 'Read project status', impact: 'read only' },
  delete_completed: { label: 'Delete completed tasks', permission: 'Delete completed tasks', impact: 'approval required' }
});
const now = () => new Date().toISOString();
function log(job, event, message, level = 'info') { job.logs.push({ at: now(), level, event, message }); job.updatedAt = now(); }
function findJob(s, id) { const job = s.jobs.find(j => j.id === id); if (!job) throw new Error('Job not found.'); return job; }
export function createJarvis(store) {
  function allowed(s, job) {
    if (!s.permissions[job.action]) throw new Error('Tool permission is disabled. Enable it before running this job.');
    if (job.action === 'delete_completed' && !job.approved) throw new Error('Deletion requires approval for this plan.');
  }
  return {
    plan(action, projectId, input = '') {
      if (!Object.hasOwn(adapters, action)) throw new Error('Unsupported tool.');
      if (['add_task','append_note'].includes(action) && !input.trim()) throw new Error('Describe the task or note to add.');
      if (input.length > (action === 'add_task' ? 300 : 10000)) throw new Error('Input is too long for this tool.');
      const id = crypto.randomUUID();
      store.transact(s => {
        const p = store.project(s, projectId);
        const targetIds = action === 'delete_completed' ? p.tasks.filter(t => t.done).map(t => t.id) : [];
        if(action === 'delete_completed' && !targetIds.length) throw new Error('This project has no completed tasks to delete.');
        const effect = action === 'add_task' ? `Create task: ${input.trim()}` : action === 'append_note' ? `Append note: ${input.trim()}` : action === 'summarize' ? 'Count tasks and report recorded project status (no AI inference).' : `Delete exactly ${targetIds.length} currently completed task(s). New tasks are excluded.`;
        const job = { id, action, projectId, projectName: p.name, input: input.trim(), status: action === 'delete_completed' ? 'awaiting_approval' : 'pending', approved: false, targetIds, createdAt: now(), updatedAt: now(), result: '', error: '', plan: [`Open project: ${p.name}`, effect, ...targetIds.map(id=>`Delete task: ${p.tasks.find(t=>t.id===id).title}`), 'Verify the local result and persist execution history.'], logs: [] };
        log(job,'planned',`Plan generated using ${adapters[action].label}. No action has run.`);
        s.jobs.unshift(job); store.activity(s, `Jarvis planned: ${adapters[action].label}`);
      });
      return id;
    },
    setPermission(action, enabled) {
      if(!Object.hasOwn(adapters, action)) throw new Error('Unsupported permission.');
      store.transact(s => { s.permissions[action] = !!enabled; store.activity(s, `${enabled ? 'Enabled' : 'Disabled'} Jarvis tool: ${adapters[action].label}`); });
    },
    approve(id) {
      store.transact(s => {
        const j = findJob(s,id);
        if (j.status !== 'awaiting_approval' || j.action !== 'delete_completed') throw new Error('This job is not awaiting deletion approval.');
        if (!s.permissions[j.action]) throw new Error('Enable the deletion tool permission first.');
        j.approved = true; j.status = 'pending'; log(j,'approved','User approved the displayed deletion plan.');
      });
    },
    cancel(id) { store.transact(s => { const j = findJob(s,id); if(!['pending','awaiting_approval','failed'].includes(j.status)) throw new Error('This job cannot be cancelled.'); j.status = 'cancelled'; j.approved = false; log(j,'cancelled','Cancelled by user. No pending action will run.'); }); },
    retry(id) {
      store.transact(s => {
        const j = findJob(s,id); if(j.status !== 'failed') throw new Error('Only failed jobs can be retried.');
        j.approved = false; j.status = j.action === 'delete_completed' ? 'awaiting_approval' : 'pending'; j.error = ''; log(j,'retry','Returned to queue for review.');
      });
    },
    recover() {
      if (!store.get().jobs.some(j => j.status === 'running')) return;
      store.transact(s => { for(const j of s.jobs.filter(j=>j.status === 'running')) { j.status = 'failed'; j.approved = false; j.error = 'Execution was interrupted. No partial change was committed. Review and retry.'; log(j,'interrupted',j.error,'error'); } });
    },
    async execute(id) {
      // Persist running first. Mutations and completion are committed atomically
      // below, so reloading between phases cannot create a duplicate effect.
      store.transact(s => {
        const j = findJob(s,id); if(j.status !== 'pending') throw new Error('Only a pending job can run.');
        allowed(s,j); j.status = 'running'; log(j,'started','Permission checks passed. Local adapter starting.');
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      try {
        store.transact(s => {
          const j = findJob(s,id); if(j.status !== 'running') throw new Error('Job is no longer running.');
          allowed(s,j); const p = store.project(s,j.projectId);
          if(j.action === 'add_task') {
            if(!j.input.trim() || j.input.length > 300) throw new Error('Invalid task input.');
            const taskId = crypto.randomUUID(); p.tasks.push({id:taskId,title:j.input,done:false});
            if(!p.tasks.some(t=>t.id===taskId && t.title===j.input)) throw new Error('Task verification failed.');
            j.result = `Verified task created in ${p.name}: ${j.input}`;
          } else if(j.action === 'append_note') {
            if(!j.input.trim() || j.input.length > 10000) throw new Error('Invalid note input.');
            p.notes += (p.notes ? '\n\n' : '') + j.input;
            if(!p.notes.endsWith(j.input)) throw new Error('Note verification failed.');
            j.result = `Verified note appended to ${p.name} (${j.input.length} characters).`;
          } else if(j.action === 'summarize') {
            const done = p.tasks.filter(t=>t.done).length;
            j.result = `${p.name}: ${p.tasks.length} recorded task(s), ${done} completed, ${p.tasks.length-done} open. Working notes: ${p.notes.length} characters. Last saved: ${p.updatedAt}.`;
          } else if(j.action === 'delete_completed') {
            if(!j.targetIds.length || j.targetIds.some(id=>!p.tasks.some(t=>t.id===id && t.done))) throw new Error('Planned tasks changed. Cancel this job and generate a fresh plan.');
            p.tasks = p.tasks.filter(t=>!j.targetIds.includes(t.id));
            if(p.tasks.some(t=>j.targetIds.includes(t.id))) throw new Error('Deletion verification failed.');
            j.result = `Verified deletion of ${j.targetIds.length} approved completed task(s) from ${p.name}.`;
          }
          if(j.action !== 'summarize') p.updatedAt = now();
          j.status = 'completed'; j.error = ''; log(j,'verified',j.result); store.activity(s, `Jarvis completed: ${adapters[j.action].label}`);
        });
      } catch(error) {
        // If persistence itself is unavailable this may also throw. The saved
        // running job is recovered on next load; never claim it completed.
        store.transact(s => { const j=findJob(s,id); if(j.status !== 'running') return; j.status='failed'; j.approved=false; j.error=error.message; log(j,'failed',error.message,'error'); });
        throw error;
      }
      return store.get().jobs.find(j=>j.id===id).result;
    }
  };
}
