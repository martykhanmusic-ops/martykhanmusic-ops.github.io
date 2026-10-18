import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { discoverApps, statMusicFile } from '../companion/windows.mjs';

test('Ableton project approval is bound to exact approved file and consumed on attempt', { skip: process.platform !== 'win32' }, async t => {
  if (!(await discoverApps(new Set(['ableton live 12 suite.lnk']))).length) return t.skip('Ableton Live 12 Suite shortcut is unavailable');
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'halo-ableton-'));
  const file = path.join(sandbox, 'test.als');
  await fs.writeFile(file, Buffer.from([1, 2, 3]));
  const child = spawn(process.execPath, ['companion/server.mjs', '--root', sandbox, '--app', 'Ableton Live 12 Suite.lnk'], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let output = '';
  child.stdout.on('data', chunk => { output += String(chunk); });
  const waitFor = async (pattern, from = 0) => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const match = output.slice(from).match(pattern);
      if (match) return match[1];
      if (child.exitCode !== null) throw new Error(`Companion exited ${child.exitCode}`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('Companion response timed out');
  };
  try {
    const pairCode = await waitFor(/Pairing code: (\d{6})/);
    const base = 'http://127.0.0.1:4174';
    const call = (route, token, body) => fetch(base + route, { method: 'POST', headers: { Origin: 'http://localhost:4173', ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const pair = await call('/pair', null, { code: pairCode });
    assert.equal(pair.status, 200);
    const token = (await pair.json()).token;
    const stat = await statMusicFile(sandbox, 'test.als');
    const request = { id: 'ableton live 12 suite.lnk', relative: 'test.als', expected: { root: stat.root, relative: stat.relative, bytes: stat.bytes, modifiedAt: stat.modifiedAt } };
    assert.equal((await call('/apps/project-approval', token, { ...request, relative: '../outside.als' })).status, 400);
    assert.equal((await call('/apps/project-approval', token, { ...request, expected: { ...request.expected, bytes: 999 } })).status, 409);
    const offset = output.length;
    const approval = await call('/apps/project-approval', token, request);
    assert.equal(approval.status, 200);
    assert.equal((await approval.json()).app, 'Ableton Live 12 Suite');
    const code = await waitFor(/Approve opening test\.als in Ableton Live 12 Suite: (\d{6})/, offset);
    assert.equal((await call('/apps/launch', token, { id: request.id, code })).status, 403);
    assert.equal((await call('/apps/project-open', token, { id: request.id, relative: 'test.als', code })).status, 403);
    const secondOffset = output.length;
    assert.equal((await call('/apps/project-approval', token, request)).status, 200);
    const secondCode = await waitFor(/Approve opening test\.als in Ableton Live 12 Suite: (\d{6})/, secondOffset);
    await fs.writeFile(file, Buffer.from([1, 2, 3, 4]));
    assert.equal((await call('/apps/project-open', token, { id: request.id, relative: 'test.als', code: secondCode })).status, 409);
    assert.equal((await call('/grants/revoke', token, { scope: 'files' })).status, 200);
    assert.equal((await call('/apps/project-approval', token, request)).status, 403);
    assert.equal((await call('/revoke', token, {})).status, 200);
  } finally {
    if (child.exitCode === null) { child.kill(); await new Promise(resolve => child.once('exit', resolve)); }
    assert.equal(path.dirname(sandbox), await fs.realpath(os.tmpdir()));
    await fs.rm(sandbox, { recursive: true, force: true });
  }
});
