const ID = /^[a-z][a-z0-9-]{1,63}$/;
const VIEWS = new Set(['dashboard', 'project', 'jarvis', 'extension']);
export const APPLICATIONS_KEY = 'halo.applications.v1';
const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

function copy(value) { return structuredClone(value); }
function data(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  let raw;
  try { raw = JSON.stringify(value); } catch { throw new Error(`${label} must be JSON data.`); }
  if (!raw || raw.length > 64_000 || raw.includes('"__proto__"')) throw new Error(`${label} is invalid or too large.`);
  return JSON.parse(raw);
}
function major(version) { return Number(VERSION.exec(version)[1]); }
function atLeast(actual, required) {
  const a = VERSION.exec(actual), b = VERSION.exec(required);
  for (let i = 1; i <= 3; i++) if (Number(a[i]) !== Number(b[i])) return Number(a[i]) > Number(b[i]);
  return true;
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || !ID.test(manifest.id)) throw new Error('Invalid application ID.');
  if (typeof manifest.name !== 'string' || !manifest.name.trim() || manifest.name.length > 120) throw new Error('Invalid application name.');
  if (typeof manifest.version !== 'string' || !VERSION.test(manifest.version)) throw new Error('Invalid application version.');
  if (!validRoute(manifest.route)) throw new Error('Application route is not supported.');
  if (!Array.isArray(manifest.permissions) || manifest.permissions.some(permission => typeof permission !== 'string' || !ID.test(permission))) throw new Error('Invalid application permissions.');
  if (manifest.minShellVersion && !VERSION.test(manifest.minShellVersion)) throw new Error('Invalid shell version requirement.');
  if (manifest.platforms && (!Array.isArray(manifest.platforms) || !manifest.platforms.length || manifest.platforms.some(platform => !['desktop', 'mobile'].includes(platform)))) throw new Error('Invalid application platforms.');
  return { id: manifest.id, name: manifest.name.trim(), version: manifest.version, route: copy(manifest.route), permissions: [...new Set(manifest.permissions)], description: typeof manifest.description === 'string' ? manifest.description.slice(0, 500) : '', minShellVersion: manifest.minShellVersion || '1.0.0', platforms: manifest.platforms || ['desktop','mobile'] };
}
function validRoute(route) {
  return route && typeof route === 'object' && VIEWS.has(route.view)
    && Object.keys(route).every(key => ['view', 'projectId'].includes(key))
    && (route.projectId === undefined || (route.view === 'project' && typeof route.projectId === 'string' && route.projectId.length > 0));
}

export function createApplicationRegistry({ platform = 'desktop', shellVersion = '1.0.0', storage = null } = {}) {
  if (!['desktop','mobile'].includes(platform) || !VERSION.test(shellVersion)) throw new Error('Invalid application host.');
  const records = new Map(), sessions = new Map(), events = [];
  let lastSaved = storage?.getItem(APPLICATIONS_KEY) ?? null, saved = {};
  if (lastSaved !== null) {
    let parsed;
    try { parsed = JSON.parse(lastSaved); } catch { throw new Error('Application metadata is corrupt; original data was preserved.'); }
    if (!parsed || parsed.version !== 1 || !parsed.apps || typeof parsed.apps !== 'object' || Array.isArray(parsed.apps)) throw new Error('Application metadata is unsupported; original data was preserved.');
    saved = parsed.apps;
  }
  function event(type, id, detail = {}) { events.push({ type, id, at: new Date().toISOString(), ...detail }); }
  function getRecord(id) { const record = records.get(id); if (!record) throw new Error('Application is not registered.'); return record; }
  function reason(record) {
    if (!record.manifest.platforms.includes(platform)) return 'Application is unavailable on this device.';
    if (major(record.manifest.minShellVersion) !== major(shellVersion) || !atLeast(shellVersion, record.manifest.minShellVersion)) return 'Application requires a compatible Halo shell.';
    if (record.savedVersion && major(record.savedVersion) !== major(record.manifest.version)) return 'Application state requires migration before opening.';
    return null;
  }
  function publicRecord(record) { return { ...copy(record.manifest), state: record.state, available: !reason(record), reason: reason(record) }; }
  function update(id, changes) {
    const next = { ...getRecord(id), ...changes };
    if (storage) {
      if (storage.getItem(APPLICATIONS_KEY) !== lastSaved) throw new Error('Application metadata changed in another tab. Reload before saving.');
      const entries = { ...saved, [id]: { version: next.manifest.version, settings: next.settings, data: next.data, grants: next.grants } };
      const raw = JSON.stringify({ version: 1, apps: entries });
      storage.setItem(APPLICATIONS_KEY, raw);
      saved = entries; lastSaved = raw;
    }
    records.set(id, next);
    return next;
  }
  return {
    register(manifest) {
      const clean = validateManifest(manifest);
      if (records.has(clean.id)) throw new Error(`Application already registered: ${clean.id}`);
      const previous = saved[clean.id];
      if (previous && (!VERSION.test(previous.version) || typeof previous.grants !== 'object')) throw new Error('Saved application metadata is invalid; original data was preserved.');
      const record = { manifest: clean, state: 'registered', settings: previous ? data(previous.settings, 'Application settings') : {}, data: previous ? data(previous.data, 'Application state') : {}, grants: previous ? data(previous.grants, 'Application grants') : {}, savedVersion: previous?.version || null };
      if (Object.entries(record.grants).some(([permission, enabled]) => !clean.permissions.includes(permission) || typeof enabled !== 'boolean')) throw new Error('Saved application grants are invalid; original data was preserved.');
      records.set(clean.id, record); event('registered', clean.id); return copy(clean);
    },
    unregister(id) { getRecord(id); if (sessions.has(id)) throw new Error('Close the application before unregistering it.'); records.delete(id); event('unregistered', id); return true; },
    discover() { return [...records.values()].map(publicRecord); },
    get(id) { const record = records.get(id); return record ? publicRecord(record) : null; },
    open(id, route = null) {
      const record = getRecord(id), problem = reason(record);
      if (problem) throw new Error(problem);
      for (const permission of record.manifest.permissions) if (!record.grants[permission]) throw new Error(`Grant ${permission} before opening ${record.manifest.name}.`);
      const target = route || record.manifest.route;
      if (!validRoute(target) || target.view !== record.manifest.route.view) throw new Error('Application route is not supported.');
      sessions.set(id, { openedAt: new Date().toISOString(), route: copy(target) }); record.state = 'active'; event('opened', id, { route: copy(target) }); return copy(target);
    },
    suspend(id) { const record = getRecord(id); if (!sessions.has(id) || record.state !== 'active') throw new Error('Only an active application can be suspended.'); record.state = 'suspended'; event('suspended', id); return record.state; },
    close(id) { const record = getRecord(id); if (!sessions.has(id)) throw new Error('Application is not open.'); sessions.delete(id); record.state = 'closed'; event('closed', id); return record.state; },
    grant(id, permission, enabled) {
      const record = getRecord(id);
      if (!record.manifest.permissions.includes(permission) || typeof enabled !== 'boolean') throw new Error('Application permission is not declared.');
      update(id, { grants: { ...record.grants, [permission]: enabled } });
      if (!enabled && sessions.has(id)) { sessions.delete(id); getRecord(id).state = 'closed'; event('closed', id, { reason: 'permission-revoked' }); }
      event(enabled ? 'granted' : 'revoked', id, { permission }); return enabled;
    },
    getGrants(id) { return copy(getRecord(id).grants); },
    setSettings(id, settings) {
      const clean = data(settings, 'Application settings');
      if (clean.theme !== undefined && !['inherit','dark','light'].includes(clean.theme)) throw new Error('Invalid application theme.');
      update(id, { settings: clean }); event('settings-updated', id); return copy(clean);
    },
    getSettings(id) { const record = records.get(id); return record ? copy(record.settings) : null; },
    setState(id, value) { const clean = data(value, 'Application state'); update(id, { data: clean }); event('state-updated', id); return copy(clean); },
    getState(id) { const record = records.get(id); return record ? copy(record.data) : null; },
    theme(id, workspaceTheme) { const setting = getRecord(id).settings.theme || 'inherit'; return setting === 'inherit' ? workspaceTheme : setting; },
    events() { return copy(events); },
    snapshot() { return { shellVersion, platform, applications: this.discover(), events: copy(events) }; }
  };
}

export const coreApplications = [
  { id: 'projects', name: 'Projects', version: '1.0.0', route: { view: 'dashboard' }, permissions: [], description: 'Canonical Halo projects, notes, and tasks.' },
  { id: 'jarvis', name: 'Jarvis', version: '1.0.0', route: { view: 'jarvis' }, permissions: [], description: 'Local plans and explicitly approved tools.' },
  { id: 'music', name: 'Music Shelf', version: '1.0.0', route: { view: 'project' }, permissions: [], description: 'The canonical project music library and approved DAW links.' }
];
