// Mutate only the draft supplied by store.transact. Halo and Jarvis share these
// operations; neither maintains a separate project/task model.
export function getProject(state, projectId) {
  const project = state.projects.find(project => project.id === projectId);
  if (!project) throw new Error('Project no longer exists.');
  return project;
}
export function getTask(project, taskId) {
  const task = project.tasks.find(task => task.id === taskId);
  if (!task) throw new Error('Task no longer exists.');
  return task;
}
export function addProjectTask(project, title) {
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 300) throw new Error('Enter a task of 1–300 characters.');
  const task = { id: crypto.randomUUID(), title: title.trim(), done: false };
  project.tasks.push(task);
  project.updatedAt = new Date().toISOString();
  return task;
}
export function setTaskDone(project, taskId, done) {
  const task = getTask(project, taskId);
  task.done = done;
  project.updatedAt = new Date().toISOString();
  return task;
}
export function appendProjectNotes(project, text) {
  if (typeof text !== 'string' || !text.trim() || text.length > 10000) throw new Error('Invalid note input.');
  project.notes += (project.notes ? '\n\n' : '') + text;
  project.updatedAt = new Date().toISOString();
}
export function deleteCompletedTasks(project, targetIds) {
  if (!targetIds.length || new Set(targetIds).size !== targetIds.length || targetIds.some(id => !project.tasks.some(task => task.id === id && task.done))) throw new Error('Planned tasks changed. Cancel this job and generate a fresh plan.');
  project.tasks = project.tasks.filter(task => !targetIds.includes(task.id));
  project.updatedAt = new Date().toISOString();
}
// Job labels and plans are historical snapshots; current project state is always
// resolved by ID from state.projects. No copied task records are stored in jobs.
export function projectJobs(state, projectId) {
  return state.jobs.filter(job => job.projectId === projectId);
}
