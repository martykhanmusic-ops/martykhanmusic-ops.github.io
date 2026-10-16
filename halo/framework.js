const ID = /^[a-z][a-z0-9-]{1,63}$/;
const VIEWS = new Set(['dashboard', 'project', 'jarvis']);
const LIFECYCLE = new Set(['registered', 'active', 'suspended', 'closed']);

function copy(value) { return structuredClone(value); }

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || !ID.test(manifest.id)) throw new Error('Invalid application ID.');
  if (typeof manifest.name !== 'string' || !manifest.name.trim() || manifest.name.length > 120) throw new Error('Invalid application name.');
  if (typeof manifest.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error('Invalid application version.');
  if (!manifest.route || !VIEWS.has(manifest.route.view)) throw new Error('Application route is not supported.');
  if (!Array.isArray(manifest.permissions) || manifest.permissions.some(permission => typeof permission !== 'string' || !ID.test(permission))) throw new Error('Invalid application permissions.');
  return { id: manifest.id, name: manifest.name.trim(), version: manifest.version, route: copy(manifest.route), permissions: [...new Set(manifest.permissions)], description: typeof manifest.description === 'string' ? manifest.description.slice(0, 500) : '' };
}

export function createApplicationRegistry({ platform = 'desktop', shellVersion = '1.0.0' } = {}) {
  const records = new Map();
  const sessions = new Map();
  const events = [];
  function event(type, id, detail = {}) { events.push({ type, id, at: new Date().toISOString(), ...detail }); }
  return {
    register(manifest) {
      const clean = validateManifest(manifest);
      if (records.has(clean.id)) throw new Error(`Application already registered: ${clean.id}`);
      const record = { manifest: clean, state: 'registered', settings: {}, platform, shellVersion };
      records.set(clean.id, record); event('registered', clean.id); return copy(clean);
    },
    unregister(id) {
      const record = records.get(id); if (!record) throw new Error('Application is not registered.');
      if (sessions.has(id)) throw new Error('Close the application before unregistering it.');
      records.delete(id); event('unregistered', id); return true;
    },
    discover() { return [...records.values()].map(({ manifest, state }) => ({ ...copy(manifest), state })); },
    get(id) { const record = records.get(id); return record ? { ...copy(record.manifest), state: record.state } : null; },
    open(id, route = null) {
      const record = records.get(id); if (!record) throw new Error('Application is not registered.');
      const target = route || record.manifest.route;
      if (!target || !VIEWS.has(target.view)) throw new Error('Application route is not supported.');
      sessions.set(id, { openedAt: new Date().toISOString(), route: copy(target) }); record.state = 'active'; event('opened', id, { route: copy(target) }); return copy(target);
    },
    suspend(id) { return transition(id, 'suspended'); },
    close(id) { sessions.delete(id); return transition(id, 'closed'); },
    setSettings(id, settings) {
      const record = records.get(id); if (!record) throw new Error('Application is not registered.');
      if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('Application settings must be an object.');
      record.settings = copy(settings); event('settings-updated', id); return copy(record.settings);
    },
    getSettings(id) { const record = records.get(id); return record ? copy(record.settings) : null; },
    events() { return copy(events); },
    snapshot() { return { shellVersion, platform, applications: this.discover(), events: copy(events) }; }
  };
  function transition(id, next) {
    const record = records.get(id); if (!record) throw new Error('Application is not registered.');
    if (!LIFECYCLE.has(next)) throw new Error('Invalid application lifecycle state.');
    record.state = next; event(next, id); return next;
  }
}

export const coreApplications = [
  { id: 'projects', name: 'Projects', version: '1.0.0', route: { view: 'dashboard' }, permissions: [], description: 'Canonical Halo projects, notes, and tasks.' },
  { id: 'jarvis', name: 'Jarvis', version: '1.0.0', route: { view: 'jarvis' }, permissions: ['plan-tools'], description: 'Local plans and explicitly approved tools.' }
];
