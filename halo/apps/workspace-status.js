export const manifest = {
  id: 'workspace-status', name: 'Workspace Status', version: '1.0.0',
  route: { view: 'extension' }, permissions: ['workspace-read'],
  description: 'A read-only view of your saved Halo project and task counts.',
  minShellVersion: '1.0.0', platforms: ['desktop', 'mobile']
};

export function mount(container, context) {
  const title = document.createElement('h2'); title.textContent = 'Workspace Status';
  const summary = document.createElement('p'); summary.className = 'muted';
  const filter = document.createElement('label'); filter.textContent = 'Show completed task count ';
  const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
  checkbox.checked = context.state().showCompleted !== false;
  filter.append(checkbox);
  const refresh = document.createElement('button'); refresh.textContent = 'Refresh saved status';
  function update() {
    const workspace = context.snapshot();
    const tasks = workspace.projects.flatMap(project => project.tasks);
    summary.textContent = `${workspace.projects.length} saved project(s) · ${tasks.filter(task => !task.done).length} open task(s)` + (checkbox.checked ? ` · ${tasks.filter(task => task.done).length} completed task(s)` : '');
  }
  checkbox.addEventListener('change', () => { context.setState({ showCompleted: checkbox.checked }); update(); });
  refresh.addEventListener('click', update);
  container.replaceChildren(title, summary, filter, refresh);
  update();
  return () => container.replaceChildren();
}
