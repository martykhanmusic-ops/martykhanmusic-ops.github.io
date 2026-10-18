# Marty Khan Music · Halo OS

For a future chat resuming this build, start with [the Codex recovery roadmap](docs/CODEX_MEMORY_ROADMAP.md).

The original music landing page lives at `/`. Halo and Jarvis live at `/halo/`.
The browser application is static and has no build step or runtime npm
dependency. An optional local Windows companion is described below. Visual
styling follows Halo's orbital dark/light language. Its theme remains saved in
the existing workspace data.

## Run locally

### Windows launcher

Run [the generated Halo.exe](dist/Halo.exe) on this Windows PC. It opens Halo in
your default browser at `http://localhost:4173/halo/`. Keep its console window
open while using Halo; close it or press Ctrl+C to stop the local server. The
executable contains the current static site and can be copied to another folder.
It requires Windows .NET Framework 4.x and a browser, but not Node.js or Python
at runtime. The optional Windows companion still starts separately with Node.js.
Halo data remains in the browser profile for the `localhost:4173` origin.

### Jarvis voice box

Open Jarvis to find the voice box. **Record** and **Stop recording** send a short
microphone clip to the local Voicebox service for transcription. Read or edit
the transcript, then choose **Use as task title** and **Generate plan**. Speaking
does not create or execute a job. **Speak with Voicebox** and **Speak latest verified
result** generate audio with the selected Voicebox profile; **Browser voice
fallback** uses your browser's installed speech voice while a Voicebox model
loads. **Stop playback** ends either voice. Voice use is optional and does not change Jarvis tool permissions or
deletion approvals.

Voicebox source is in the sibling `C:\Users\owner\_Code\voicebox` folder on
this computer. Start its backend before using voice with
`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-voicebox-for-halo.ps1`.
The current PC has a local Voicebox preset profile named `Jarvis`. On another
computer, create that profile in Voicebox or change the profile name in Halo.
Models may download on first use and speech generation may take several minutes
on a CPU. The launcher exposes only the Voicebox health, transcription, speech,
generation status and audio routes on its loopback origin. A regular static
development server does not provide this bridge; use the Windows launcher for
Voicebox integration. No recording is made until you press Record.

Rebuild after changing site files with
`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-launcher.ps1`.
The generated `dist/` folder is local output and is excluded from Git. If
another server already uses port 4173, close it before starting Halo.exe.

Requires Node.js 24+ for tests and Python 3 for the development server.

```sh
npm ci
npm test
npm run check
npm start
```

Open `http://localhost:4173/halo/`. ES modules require an HTTP server, so opening
the HTML directly from the filesystem is unsupported.

With the server running, run the real-browser workflow suite in another terminal:

```sh
npx playwright install chromium
npm run test:browser
```

## Optional Windows companion

Run Halo at `http://localhost:4173/halo/` on the same Windows computer as the
companion. Start the static site with `py -m http.server 4173`. In another
PowerShell window, start the companion from the repository root:

```powershell
node companion/server.mjs --root C:\Users\owner\Documents --app "File Explorer.lnk" --processes --audio
```

Replace the example folder with a folder you choose. Omit any flag to withhold
that capability. `--root` permits listing and reading text files up to 64 KB
inside that folder; it does not write files. Each `--app` names a discovered
Start Menu shortcut; only named shortcuts can be launched, and each launch
needs a fresh one minute code printed in the companion window. Process and
audio endpoint discovery are read-only. The browser shows the grants after
pairing. You can remove a grant in Halo, revoke the whole pairing, or press
Ctrl+C in the companion window to stop it. Restart without a flag to remove
that grant permanently for the next session. No installation or background
service is created; to uninstall, stop the process and remove the `companion/`
source with the checkout when no longer needed.

The pairing code appears only in the local companion window. Enter it in Halo;
never put it in a URL or screenshot. Pairing credentials expire after eight
hours, and stopping the process invalidates them immediately. The companion
accepts only loopback requests from `http://localhost:4173`; a deployed Halo
page or a remote/mobile browser reports unavailable. The companion is optional:
projects, tasks, notes, Jarvis and World continue to work without it. Its
recent operation audit lasts for the current companion process only.

The tests use system Chromium if available; set `HALO_CHROMIUM_PATH` to select a
different executable, or let Playwright use its installed browser. Runtime
dependencies remain zero; Playwright is a pinned development-only dependency.

## What's working

- Create, edit, save and resume projects with notes and persistent tasks.
- Search project names, descriptions, notes and tasks; view recent activity.
- Switch themes, export JSON backups, restore after explicit confirmation.
- Open Jarvis from navigation or the Saturn portal. Generate and review local
  plans, grant individual tool permissions, run jobs, inspect logs and results.
- Jarvis tools: create a task, append notes, summarize recorded status, delete
  selected completed tasks. Deletion is disabled by default and additionally
  requires approval of each plan. Plans never execute automatically.
- Pending/running/completed/failed/cancelled history and explicit retries.
  Interrupted jobs recover as failed for manual review.
- Plan completion directly from an open Halo task, or select an existing task in
  Jarvis. The completion tool is disabled until you grant its separate permission.
- Project-specific execution panels, project filters and links from results back
  to the original task. Task changes and execution status update in the open
  project without reloading; projects remain in one authoritative workspace store.
- Project renames update current job labels without rewriting historical plans.
  A draft opened before a Jarvis note update cannot overwrite those newer notes;
  copy the draft, then use **Reload saved project** and merge your changes.

## Data and scope

Workspace data is stored in localStorage on this browser origin. No cloud sync,
workspace authentication, encryption, AI provider, or external messaging is
connected. The optional Windows companion uses separate local pairing and
grants. Jarvis uses deterministic local adapters, not natural-language AI.
Don't store secrets. Export backups before clearing browser data. Data from a
localhost session will not automatically appear on a deployed domain.

Projects use explicit Save; closing or navigating with unsaved edits warns you.
Backup restore replaces the current workspace, resets tool permissions to safe
defaults and invalidates pending deletion approvals. Completed-task deletion is
permanent unless you have an earlier backup. Avoid simultaneous edits in multiple
tabs: stale saves are rejected, but localStorage is not a multi-user database.

The Applications section hosts trusted local modules. Workspace Status asks for
an explicit read grant and shows counts from the existing Halo workspace. Its
settings and grant live in separate application metadata. Revoke the grant in
the directory to close the app. New trusted apps use a manifest and mount
function listed in `halo/apps/catalog.js`.

See [the sprint audit and delivery report](docs/SPRINT.md) for validation,
architectural limitations and next milestones. No production deployment or push
is part of this local implementation.
# Appearance preview

Open **Appearance** in Halo to preview the Orbital or Classic visual package. **Cancel preview** or Escape restores the saved appearance; **Apply appearance** saves the choice for this browser. Appearance is stored separately from projects, tasks, notes, and Jarvis history. The color theme control remains independent.
