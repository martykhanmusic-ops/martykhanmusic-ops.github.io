import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { approvedPath, listFiles, readFile, processes, audioDevices, discoverApps } from '../companion/windows.mjs';

test('approved file reads reject traversal, absolute paths, symlink escapes and binary content', async () => {
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'halo-companion-'));
  const root = path.join(sandbox, 'grant');
  await fs.mkdir(root);
  await fs.writeFile(path.join(root, 'note.txt'), 'approved text');
  await fs.writeFile(path.join(root, 'binary.bin'), Buffer.from([0, 1]));
  await fs.writeFile(path.join(sandbox, 'secret.txt'), 'outside');
  try {
    assert.equal((await readFile(root, 'note.txt')).content, 'approved text');
    assert.ok((await listFiles(root, '.')).entries.some(item => item.name === 'note.txt'));
    await assert.rejects(approvedPath(root, '../secret.txt'), /leaves approved root/);
    await assert.rejects(approvedPath(root, path.join(sandbox, 'secret.txt')), /Invalid relative path/);
    await assert.rejects(readFile(root, 'binary.bin'), /Binary files/);
    if (process.platform === 'win32') {
      await fs.symlink(path.join(sandbox, 'secret.txt'), path.join(root, 'link.txt'), 'file');
      await assert.rejects(readFile(root, 'link.txt'), /leaves approved root/);
    }
  } finally { await fs.rm(sandbox, { recursive: true, force: true }); }
});

test('Windows process and audio data come from local system queries', { skip: process.platform !== 'win32' }, async () => {
  const p = await processes();
  assert.ok(p.processes.some(item => item.ProcessName && Number.isInteger(item.Id)));
  const a = await audioDevices();
  assert.ok(Array.isArray(a.devices));
  assert.ok(a.devices.every(item => typeof item.FriendlyName === 'string'));
  assert.ok(Date.now() - Date.parse(p.verifiedAt) < 10000);
});

test('application discovery returns only explicitly named Start Menu shortcuts', { skip: process.platform !== 'win32' }, async () => {
  assert.deepEqual(await discoverApps(new Set()), []);
  const apps = await discoverApps(new Set(['file explorer.lnk']));
  assert.ok(apps.every(app => app.id === 'file explorer.lnk'));
});
