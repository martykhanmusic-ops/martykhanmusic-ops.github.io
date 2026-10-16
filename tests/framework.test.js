import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplicationRegistry, coreApplications } from '../halo/framework.js';

test('framework discovers core applications without creating another workspace store', () => {
  const registry = createApplicationRegistry();
  for (const app of coreApplications) registry.register(app);
  assert.deepEqual(registry.discover().map(app => app.id), ['projects', 'jarvis']);
  assert.deepEqual(registry.get('projects').route, { view: 'dashboard' });
  assert.equal(registry.snapshot().applications.length, 2);
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
