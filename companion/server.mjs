import http from 'node:http';
import os from 'node:os';
import crypto from 'node:crypto';
import path from 'node:path';
import { processes, audioDevices, listFiles, readFile, statMusicFile, discoverApps, launchApp, launchAbletonProject } from './windows.mjs';

const HOST = '127.0.0.1';
const PORT = 4174;
const ORIGIN = 'http://localhost:4173';
const sessionMs = Math.min(8 * 60 * 60_000, Math.max(1, Number(process.env.HALO_COMPANION_SESSION_MS) || 8 * 60 * 60_000));
let pairCode = String(crypto.randomInt(100000, 1000000));
let token = null;
let tokenExpires = 0;
let failedPairs = 0;
let pairLockedUntil = 0;
const started = Date.now();
const args = process.argv.slice(2);
function option(name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; }
const root = option('--root');
const allowedApps = new Set(args.flatMap((part, index) => part === '--app' ? [args[index + 1]?.toLowerCase()] : []).filter(name => name && /^[^\\/:*?"<>|]+\.lnk$/.test(name)));
const processAllowed = args.includes('--processes');
const audioAllowed = args.includes('--audio');
const grants = { files: Boolean(root), apps: allowedApps.size > 0, processes: processAllowed, audio: audioAllowed };
let launchApproval = null;
const audit = [];
function record(action, result) {
  audit.push({ at: new Date().toISOString(), action, result });
  if (audit.length > 100) audit.shift();
}

function reply(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ORIGIN,
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(body));
}

function isAuthorized(req) {
  const presented = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  return Boolean(token && Date.now() < tokenExpires && presented && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(presented)));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 4096) req.destroy(new Error('Request too large'));
    });
    req.on('error', reject);
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON')); }
    });
  });
}

export function createCompanionServer() {
  const server = http.createServer(async (req, res) => {
    if (req.headers.host !== `${HOST}:${PORT}` || req.headers.origin !== ORIGIN) {
      res.writeHead(403, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end('{"error":"Host or origin denied"}');
      return;
    }
    if (req.method === 'OPTIONS') {
      if (req.headers['access-control-request-method'] !== 'POST' && req.headers['access-control-request-method'] !== 'GET') return reply(res, 405, { error: 'Method denied' });
      res.writeHead(204, { 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Vary': 'Origin', 'Cache-Control': 'no-store' });
      res.end();
      return;
    }
    try {
      if (req.url === '/pair' && req.method === 'POST') {
        if (Date.now() < pairLockedUntil) return reply(res, 429, { error: 'Pairing temporarily locked' });
        const body = await readJson(req);
        if (token || body?.code !== pairCode) {
          if (++failedPairs >= 5) { pairLockedUntil = Date.now() + 60_000; failedPairs = 0; }
          record('pairing', 'denied');
          return reply(res, 403, { error: 'Pairing denied' });
        }
        token = crypto.randomBytes(32).toString('hex');
        tokenExpires = Date.now() + sessionMs;
        pairCode = String(crypto.randomInt(100000, 1000000));
        failedPairs = 0;
        record('pairing', 'success');
        return reply(res, 200, { token });
      }
      if (!isAuthorized(req)) return reply(res, 401, { error: 'Disconnected or revoked' });
      if (req.url === '/device' && req.method === 'GET') return reply(res, 200, {
        verifiedAt: new Date().toISOString(),
        device: { platform: os.platform(), release: os.release(), arch: os.arch(), hostname: os.hostname(), uptimeSeconds: Math.floor(os.uptime()), companionUptimeSeconds: Math.floor((Date.now() - started) / 1000) },
        grants: { ...grants, apps: grants.apps ? [...allowedApps] : [] }
      });
      if (req.url === '/audit' && req.method === 'GET') return reply(res, 200, { events: audit });
      if (req.url === '/grants/revoke' && req.method === 'POST') {
        const { scope } = await readJson(req);
        if (!Object.hasOwn(grants, scope)) return reply(res, 400, { error: 'Unknown grant' });
        grants[scope] = false;
        if (scope === 'apps' || scope === 'files') launchApproval = null;
        record(`revoke:${scope}`, 'approved');
        return reply(res, 200, { grants: { ...grants, apps: grants.apps ? [...allowedApps] : [] } });
      }
      if (req.url === '/processes' && req.method === 'GET') {
        if (!grants.processes) return reply(res, 403, { error: 'Process grant denied' });
        const result = await processes(); record('processes', 'success'); return reply(res, 200, result);
      }
      if (req.url === '/audio' && req.method === 'GET') {
        if (!grants.audio) return reply(res, 403, { error: 'Audio grant denied' });
        const result = await audioDevices(); record('audio', 'success'); return reply(res, 200, result);
      }
      if (req.url === '/files/list' && req.method === 'POST') {
        if (!grants.files) return reply(res, 403, { error: 'File grant denied' });
        const result = await listFiles(root, (await readJson(req)).relative); record('files:list', 'success'); return reply(res, 200, result);
      }
      if (req.url === '/files/read' && req.method === 'POST') {
        if (!grants.files) return reply(res, 403, { error: 'File grant denied' });
        const result = await readFile(root, (await readJson(req)).relative); record('files:read', 'success'); return reply(res, 200, result);
      }
      if (req.url === '/files/music-stat' && req.method === 'POST') {
        if (!grants.files) return reply(res, 403, { error: 'File grant denied' });
        const result = await statMusicFile(root, (await readJson(req)).relative);
        record('files:music-stat', 'success'); return reply(res, 200, result);
      }
      if (req.url === '/apps' && req.method === 'GET') {
        const apps = grants.apps ? await discoverApps(allowedApps) : [];
        return reply(res, 200, { verifiedAt: new Date().toISOString(), apps: apps.map(({ id, name }) => ({ id, name })) });
      }
      if (req.url === '/apps/approval' && req.method === 'POST') {
        if (!grants.apps) return reply(res, 403, { error: 'Application grant denied' });
        const { id } = await readJson(req);
        const app = (await discoverApps(allowedApps)).find(item => item.id === id);
        if (!app) return reply(res, 404, { error: 'Application not allowlisted or not found' });
        launchApproval = { kind: 'app', code: String(crypto.randomInt(100000, 1000000)), id, expires: Date.now() + 60_000 };
        console.log(`Approve launch of ${app.name}: ${launchApproval.code} (valid 60 seconds)`);
        return reply(res, 200, { approvalRequired: true, app: app.name });
      }
      if (req.url === '/apps/launch' && req.method === 'POST') {
        if (!grants.apps) return reply(res, 403, { error: 'Application grant denied' });
        const { id, code } = await readJson(req);
        const approval = launchApproval;
        launchApproval = null;
        if (!approval || approval.kind !== 'app' || approval.id !== id || approval.code !== code || Date.now() > approval.expires) { record('apps:launch', 'denied'); return reply(res, 403, { error: 'Local launch approval denied' }); }
        const app = (await discoverApps(allowedApps)).find(item => item.id === id);
        if (!app) return reply(res, 404, { error: 'Application not allowlisted or not found' });
        const result = await launchApp(app); record(`apps:launch:${id}`, 'success'); return reply(res, 200, result);
      }
      if (req.url === '/apps/project-approval' && req.method === 'POST') {
        if (!grants.apps || !grants.files) return reply(res, 403, { error: 'Application and Files grants are required' });
        const { id, relative, expected } = await readJson(req);
        if (id !== 'ableton live 12 suite.lnk') return reply(res, 400, { error: 'Unsupported DAW project association' });
        const app = (await discoverApps(allowedApps)).find(item => item.id === id);
        if (!app) return reply(res, 404, { error: 'Ableton shortcut is not allowlisted or not found' });
        const file = await statMusicFile(root, relative);
        if (!file.relative.toLowerCase().endsWith('.als')) return reply(res, 400, { error: 'Only Ableton .als projects are supported' });
        if (!expected || expected.root !== file.root || expected.relative !== file.relative || expected.bytes !== file.bytes || expected.modifiedAt !== file.modifiedAt) return reply(res, 409, { error: 'Linked project file changed; re-link it before opening' });
        launchApproval = { kind: 'project', code: String(crypto.randomInt(100000, 1000000)), id, relative: file.relative, root: file.root, bytes: file.bytes, modifiedAt: file.modifiedAt, expires: Date.now() + 60_000 };
        console.log(`Approve opening ${file.relative} in ${app.name}: ${launchApproval.code} (valid 60 seconds)`);
        record('apps:project-approval', 'requested');
        return reply(res, 200, { approvalRequired: true, app: app.name, relative: file.relative, verifiedAt: file.verifiedAt });
      }
      if (req.url === '/apps/project-open' && req.method === 'POST') {
        if (!grants.apps || !grants.files) return reply(res, 403, { error: 'Application and Files grants are required' });
        const { id, relative, code } = await readJson(req);
        const approval = launchApproval;
        launchApproval = null;
        if (!approval || approval.kind !== 'project' || approval.id !== id || approval.relative !== relative || approval.code !== code || Date.now() > approval.expires) { record('apps:project-open', 'denied'); return reply(res, 403, { error: 'Local project-open approval denied' }); }
        const file = await statMusicFile(root, relative);
        if (file.root !== approval.root || file.relative !== approval.relative || file.bytes !== approval.bytes || file.modifiedAt !== approval.modifiedAt) { record('apps:project-open', 'changed'); return reply(res, 409, { error: 'Project file changed since approval' }); }
        const app = (await discoverApps(allowedApps)).find(item => item.id === id);
        if (!app) return reply(res, 404, { error: 'Ableton shortcut is not allowlisted or not found' });
        const result = await launchAbletonProject(app, root, relative);
        record('apps:project-open', 'success'); return reply(res, 200, result);
      }
      if (req.url === '/revoke' && req.method === 'POST') {
        token = null;
        tokenExpires = 0;
        launchApproval = null;
        record('pairing:revoke', 'approved');
        console.log(`New pairing code: ${pairCode}`);
        return reply(res, 200, { revoked: true });
      }
      return reply(res, 404, { error: 'Unknown operation' });
    } catch (error) {
      record('request', 'failed');
      return reply(res, 400, { error: error.message });
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.maxHeadersCount = 32;
  return server;
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href) {
  if (process.platform !== 'win32') throw new Error('Windows companion requires Windows.');
  if (root && !path.isAbsolute(root)) throw new Error('--root must be an absolute path');
  createCompanionServer().listen(PORT, HOST, () => {
    console.log(`Halo companion listening on ${HOST}:${PORT}`);
    console.log(`Pairing code: ${pairCode}`);
    console.log('Keep this window open. Press Ctrl+C to stop and revoke the session.');
  });
}
