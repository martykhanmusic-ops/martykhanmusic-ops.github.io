import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const powershell = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

async function fixedPowerShell(script) {
  const { stdout } = await run(powershell, ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, timeout: 5000, maxBuffer: 512000 });
  return JSON.parse(stdout || '[]');
}

export async function processes() {
  const items = await fixedPowerShell('Get-Process | Select-Object -First 200 Id,ProcessName,CPU,WorkingSet64 | ConvertTo-Json -Compress');
  return { verifiedAt: new Date().toISOString(), processes: Array.isArray(items) ? items : [items] };
}

export async function audioDevices() {
  const items = await fixedPowerShell('Get-PnpDevice -Class AudioEndpoint | Select-Object FriendlyName,Status,InstanceId | ConvertTo-Json -Compress');
  return { verifiedAt: new Date().toISOString(), devices: Array.isArray(items) ? items : [items] };
}

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}

export async function approvedPath(root, relative = '.') {
  if (typeof relative !== 'string' || relative.length > 500 || path.isAbsolute(relative) || relative.includes('\0')) throw new Error('Invalid relative path');
  const realRoot = await fs.realpath(root);
  const realTarget = await fs.realpath(path.resolve(realRoot, relative));
  if (!inside(realRoot, realTarget)) throw new Error('Path leaves approved root');
  return realTarget;
}

export async function listFiles(root, relative) {
  const target = await approvedPath(root, relative);
  const entries = await fs.readdir(target, { withFileTypes: true });
  return { verifiedAt: new Date().toISOString(), root, relative: relative || '.', entries: entries.slice(0, 200).map(entry => ({ name: entry.name, type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other' })) };
}

export async function readFile(root, relative) {
  const target = await approvedPath(root, relative);
  const handle = await fs.open(target, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > 64 * 1024) throw new Error('Only files up to 64 KB may be read');
    const data = await handle.readFile();
    if (data.includes(0)) throw new Error('Binary files are unsupported');
    return { verifiedAt: new Date().toISOString(), relative, content: data.toString('utf8') };
  } finally { await handle.close(); }
}

const musicExtensions = new Map([
  ['.wav', 'audio'], ['.mp3', 'audio'], ['.flac', 'audio'], ['.aiff', 'audio'], ['.aif', 'audio'], ['.ogg', 'audio'], ['.m4a', 'audio'],
  ['.mid', 'sample'], ['.midi', 'sample'],
  ['.als', 'daw-project'], ['.flp', 'daw-project'], ['.rpp', 'daw-project'], ['.ptx', 'daw-project'], ['.cpr', 'daw-project'], ['.npr', 'daw-project']
]);

export async function statMusicFile(root, relative) {
  const target = await approvedPath(root, relative);
  const kind = musicExtensions.get(path.extname(target).toLowerCase());
  if (!kind) throw new Error('Unsupported music file extension');
  const metadata = await fs.stat(target);
  if (!metadata.isFile()) throw new Error('Music reference must be a file');
  const realRoot = await fs.realpath(root);
  return {
    verifiedAt: new Date().toISOString(),
    root: realRoot,
    relative: path.relative(realRoot, target),
    name: path.basename(target),
    kind,
    bytes: metadata.size,
    modifiedAt: metadata.mtime.toISOString()
  };
}

const startMenus = [
  path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
  path.join(process.env.PROGRAMDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs')
];

export async function discoverApps(allowNames) {
  const found = [];
  async function walk(dir, depth) {
    if (depth > 4) return;
    for (const item of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) await walk(full, depth + 1);
      else if (item.isFile() && item.name.toLowerCase().endsWith('.lnk') && allowNames.has(item.name.toLowerCase())) found.push({ id: item.name.toLowerCase(), name: item.name.slice(0, -4), path: full });
    }
  }
  for (const dir of startMenus) if (dir && path.isAbsolute(dir)) await walk(dir, 0);
  return found;
}

export async function launchApp(app) {
  const real = await fs.realpath(app.path);
  if (real !== app.path || !(await fs.stat(real)).isFile()) throw new Error('Application shortcut changed');
  await run(powershell, ['-NoProfile', '-NonInteractive', '-File', fileURLToPath(new URL('./launch.ps1', import.meta.url)), '-ShortcutPath', real], { windowsHide: true, timeout: 5000 });
  return { launched: true, app: app.name, verifiedAt: new Date().toISOString() };
}
