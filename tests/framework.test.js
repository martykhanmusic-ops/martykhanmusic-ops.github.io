import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplicationRegistry, coreApplications, APPLICATIONS_KEY } from '../halo/framework.js';

test('framework discovers core applications without creating another workspace store', () => {
  const registry = createApplicationRegistry();
  for (const app of coreApplications) registry.register(app);
  assert.deepEqual(registry.discover().map(app => app.id), ['projects', 'jarvis', 'music']);
  assert.deepEqual(registry.get('projects').route, { view: 'dashboard' });
  assert.equal(registry.snapshot().applications.length, 3);
});

test('framework lifecycle is explicit and records transitions', () => {
  const registry = createApplicationRegistry();
  registry.register(coreApplications[0]);
  assert.equal(registry.open('projects').view, 'dashboard');
  assert.equal(registry.get('projects').state, 'active');
  assert.equal(registry.suspend('projects'), 'suspended');
  assert.equal(registry.close('projects'), 'closed');
  assert.deepEqual(registry.events().map(event => event.type), ['registered', 'opened', 'suspended', 'closed']);
});

test('framework rejects duplicates, unsafe routes and unregistering active sessions', () => {
  const registry = createApplicationRegistry();
  registry.register(coreApplications[0]);
  assert.throws(() => registry.register(coreApplications[0]), /already registered/);
  assert.throws(() => registry.register({ ...coreApplications[0], id: 'bad', route: { view: 'shell' } }), /route/);
  registry.open('projects');
  assert.throws(() => registry.unregister('projects'), /Close/);
  registry.close('projects');
  assert.equal(registry.unregister('projects'), true);
});

test('framework settings are isolated per application and copied at the boundary', () => {
  const registry = createApplicationRegistry();
  registry.register(coreApplications[0]);
  const settings = { theme: 'dark', nested: { enabled: true } };
  registry.setSettings('projects', settings);
  settings.nested.enabled = false;
  assert.equal(registry.getSettings('projects').nested.enabled, true);
  assert.throws(() => registry.setSettings('missing', {}), /not registered/);
});

const extension = { id: 'sample-app', name: 'Sample', version: '1.0.0', route: { view: 'extension' }, permissions: ['workspace-read'], platforms: ['desktop','mobile'] };
function memoryStorage() {
  const items = new Map();
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) };
}

test('new app registers independently, grants explicitly, and resumes settings and state without workspace duplication', () => {
  const storage = memoryStorage();
  const registry = createApplicationRegistry({ storage });
  registry.register(extension);
  assert.throws(() => registry.open('sample-app'), /Grant workspace-read/);
  registry.grant('sample-app', 'workspace-read', true);
  assert.equal(registry.open('sample-app').view, 'extension');
  registry.setSettings('sample-app', { theme: 'light' });
  registry.setState('sample-app', { showCompleted: false });
  assert.equal(registry.suspend('sample-app'), 'suspended');
  const resumed = createApplicationRegistry({ storage });
  resumed.register(extension);
  assert.deepEqual(resumed.getGrants('sample-app'), { 'workspace-read': true });
  assert.equal(resumed.theme('sample-app', 'dark'), 'light');
  assert.deepEqual(resumed.getState('sample-app'), { showCompleted: false });
  assert.equal(resumed.open('sample-app').view, 'extension');
  assert.ok(storage.getItem(APPLICATIONS_KEY));
  assert.equal(storage.getItem('halo.workspace.v1'), null);
  resumed.grant('sample-app', 'workspace-read', false);
  assert.equal(resumed.get('sample-app').state, 'closed');
  assert.throws(() => resumed.open('sample-app'), /Grant workspace-read/);
});

test('framework rejects incompatible versions, platforms, routes and undeclared permissions', () => {
  const registry = createApplicationRegistry({ platform: 'mobile', shellVersion: '1.0.0' });
  registry.register({ ...extension, platforms: ['desktop'] });
  assert.equal(registry.get('sample-app').available, false);
  assert.throws(() => registry.open('sample-app'), /unavailable/);
  const older = createApplicationRegistry();
  older.register({ ...extension, minShellVersion: '2.0.0' });
  assert.throws(() => older.open('sample-app'), /compatible/);
  assert.throws(() => older.grant('sample-app', 'shell', true), /not declared/);
  assert.throws(() => older.setSettings('sample-app', { theme: 'nope' }), /theme/);
  assert.throws(() => older.open('sample-app', { view: 'dashboard' }), /route|compatible/);
  const storage = memoryStorage();
  const initial = createApplicationRegistry({ storage }); initial.register(extension); initial.setState('sample-app', { value: 1 });
  const upgrade = createApplicationRegistry({ storage }); upgrade.register({ ...extension, version: '2.0.0' });
  assert.throws(() => upgrade.open('sample-app'), /migration/);
});

test('metadata write failure and stale tabs preserve prior app state', () => {
  const storage = memoryStorage();
  const first = createApplicationRegistry({ storage }); first.register(extension);
  const second = createApplicationRegistry({ storage }); second.register(extension);
  first.grant('sample-app', 'workspace-read', true);
  assert.throws(() => second.grant('sample-app', 'workspace-read', true), /another tab/);
  assert.deepEqual(second.getGrants('sample-app'), {});
  const broken = { getItem: storage.getItem, setItem: () => { throw new Error('quota'); } };
  const third = createApplicationRegistry({ storage: broken }); third.register(extension);
  assert.throws(() => third.setState('sample-app', { count: 3 }), /quota/);
  assert.deepEqual(third.getState('sample-app'), {});
});
