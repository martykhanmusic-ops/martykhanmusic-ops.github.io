import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { approvedPath, listFiles, readFile, statMusicFile, processes, audioDevices, discoverApps } from '../companion/windows.mjs';

test('music references use actual approved file metadata and reject escapes', async () => {
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'halo-music-'));
  const root = path.join(sandbox, 'grant');
  await fs.mkdir(root);
  await fs.writeFile(path.join(root, 'take.wav'), Buffer.from([0, 1, 2, 3]));
  await fs.writeFile(path.join(root, 'notes.txt'), 'notes');
  await fs.writeFile(path.join(sandbox, 'outside.wav'), Buffer.from([1]));
  try {
    const result = await statMusicFile(root, 'take.wav');
    assert.equal(result.kind, 'audio');
    assert.equal(result.bytes, 4);
    assert.equal(result.relative, 'take.wav');
    assert.ok(Date.now() - Date.parse(result.verifiedAt) < 10000);
    await assert.rejects(statMusicFile(root, '../outside.wav'), /leaves approved root/);
    await assert.rejects(statMusicFile(root, 'notes.txt'), /Unsupported music file extension/);
  } finally {
    // The freshly created, named temp directory is the only recursive cleanup target.
    assert.equal(path.dirname(sandbox), await fs.realpath(os.tmpdir()));
    await fs.rm(sandbox, { recursive: true, force: true });
  }
});

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
  const dawApps = await discoverApps(new Set(['fl studio 2026.lnk', 'ableton live 12 suite.lnk']));
  assert.equal(new Set(dawApps.map(app => app.id)).size, dawApps.length);
});
