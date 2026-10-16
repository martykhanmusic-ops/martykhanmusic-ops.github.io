import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const origin = 'http://localhost:4173';
const base = 'http://127.0.0.1:4174';

test('Windows companion pairs, verifies live device, revokes, and denies bad origins and tokens', { skip: process.platform !== 'win32' }, async () => {
  const child = spawn(process.execPath, ['companion/server.mjs'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let code;
  try {
    code = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Companion did not start')), 5000);
      child.stdout.on('data', chunk => {
        const match = String(chunk).match(/Pairing code: (\d{6})/);
        if (match) { clearTimeout(timeout); resolve(match[1]); }
      });
      child.on('error', reject);
      child.on('exit', number => reject(new Error(`Companion exited ${number}`)));
    });
    const call = (path, { method = 'GET', auth, body, requestOrigin = origin } = {}) => fetch(`${base}${path}`, {
      method,
      headers: { Origin: requestOrigin, ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    assert.equal((await call('/pair', { method: 'POST', body: { code }, requestOrigin: 'http://evil.example' })).status, 403);
    assert.equal((await call('/pair', { method: 'POST', body: { code: '000000' } })).status, 403);
    assert.equal((await call('/device')).status, 401);
    const paired = await call('/pair', { method: 'POST', body: { code } });
    assert.equal(paired.status, 200);
    const { token } = await paired.json();
    assert.match(token, /^[a-f0-9]{64}$/);
    const verified = await call('/device', { auth: token });
    assert.equal(verified.status, 200);
    const result = await verified.json();
    assert.equal(result.device.platform, 'win32');
    assert.ok(result.device.hostname);
    assert.ok(Date.now() - Date.parse(result.verifiedAt) < 5000);
    assert.equal((await call('/revoke', { method: 'POST', auth: token })).status, 200);
    assert.equal((await call('/device', { auth: token })).status, 401);
    assert.equal((await call('/pair', { method: 'POST', body: { code } })).status, 403);
  } finally { child.kill(); }
});
