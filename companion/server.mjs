import http from 'node:http';
import os from 'node:os';
import crypto from 'node:crypto';

const HOST = '127.0.0.1';
const PORT = 4174;
const ORIGIN = 'http://localhost:4173';
let pairCode = String(crypto.randomInt(100000, 1000000));
let token = null;
let tokenExpires = 0;
let failedPairs = 0;
let pairLockedUntil = 0;
const started = Date.now();

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
  return http.createServer(async (req, res) => {
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
          return reply(res, 403, { error: 'Pairing denied' });
        }
        token = crypto.randomBytes(32).toString('hex');
        tokenExpires = Date.now() + 8 * 60 * 60_000;
        pairCode = String(crypto.randomInt(100000, 1000000));
        failedPairs = 0;
        return reply(res, 200, { token });
      }
      if (!isAuthorized(req)) return reply(res, 401, { error: 'Disconnected or revoked' });
      if (req.url === '/device' && req.method === 'GET') return reply(res, 200, {
        verifiedAt: new Date().toISOString(),
        device: { platform: os.platform(), release: os.release(), arch: os.arch(), hostname: os.hostname(), uptimeSeconds: Math.floor(os.uptime()), companionUptimeSeconds: Math.floor((Date.now() - started) / 1000) }
      });
      if (req.url === '/revoke' && req.method === 'POST') {
        token = null;
        tokenExpires = 0;
        console.log(`New pairing code: ${pairCode}`);
        return reply(res, 200, { revoked: true });
      }
      return reply(res, 404, { error: 'Unknown operation' });
    } catch (error) {
      return reply(res, 400, { error: error.message });
    }
  });
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href) {
  if (process.platform !== 'win32') throw new Error('Windows companion requires Windows.');
  createCompanionServer().listen(PORT, HOST, () => {
    console.log(`Halo companion listening on ${HOST}:${PORT}`);
    console.log(`Pairing code: ${pairCode}`);
    console.log('Keep this window open. Press Ctrl+C to stop and revoke the session.');
  });
}
