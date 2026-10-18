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

For the desktop/mobile accessibility regression, run `npm run test:accessibility:browser` after `npm ci` and installing Chromium. The test covers both visual packages, dark/light themes, main routes and dialogs, keyboard navigation, forced colors, and reduced motion. Automated scanning does not replace a manual screen-reader evaluation.

## Optional local model drafts

The Windows launcher can connect Jarvis to an Ollama service on `127.0.0.1:11434`. Install Ollama and a model separately; Halo does not download a model or create an account. In Jarvis, choose **Find models**, enter or copy a voice request, then choose **Suggest draft**. The returned suggestion can only fill a supported Jarvis form action (`add_task`, `append_note`, or `summarize`). Review/edit the form, generate a plan, and use the existing permission and Run controls. A model response never executes an action by itself. If the local service is unavailable, ordinary Jarvis remains usable.
On this Windows PC, Ollama 0.40.6 with `qwen3:0.6b` has been verified through the launcher and browser. To repeat the live check while a Halo launcher runs on port 4174, set `HALO_TEST_URL=http://localhost:4174` and run `node tests/local-llm-live-browser.cjs`.

## Jarvis chat

Open **Jarvis → Chat with Jarvis**, select **Find chat models**, and choose the installed local model. Messages and replies are saved in Halo's existing workspace data and included in JSON backups. The recent 30 exchanges are kept; **Clear chat** asks before removing them. Chat has no tool access: it cannot create a Jarvis plan, change a project, or run an OS action. To act on an idea, use the separate Jarvis plan and approval controls. If Ollama is unavailable, the unsent message remains in the input box for retry.
You can copy voice text into chat, or copy the latest chat reply to the voice box and explicitly choose **Speak with Voicebox**.

## Local reminders

Open **Jarvis → Reminders**, enter a title and future date/time, then choose **Save reminder**. Due reminders appear in the Halo top bar. **Enable browser alerts** requests notification permission explicitly; these alerts work only while Halo is open. The reminder list remains available if permission is denied. Mark an item done, cancel it, or remove it from the list. Reminders use the existing Halo workspace and JSON backup; they do not create Jarvis jobs or run OS actions. This is an in-app reminder feature, not a background Windows scheduler.

## Public music reference

## Project music library

Open a Halo project to link audio, MIDI, or DAW project files from a folder approved in the optional Windows companion. Pair the companion and grant read-only Files access first. Choose **Browse approved folder** to inspect one folder at a time and select a supported file, or type a relative path. Selecting a file only fills the path; choose **Verify and link file** to save it. Each listing is limited to 200 entries. The library saves a title, tags, notes, file size, modification time, and last verification time in the existing project backup. Use **Recheck file** to check a link again; a disconnected or revoked companion reports failure. **Add review task** creates a normal project task, and **Remove link** removes only the Halo reference. Audio bytes stay in the Windows folder and are not included in Halo's JSON backup.

DAW launching and live audio are not part of this library increment.

## Public music reference

The Overview page can search MusicBrainz artists, recordings and releases through the local Windows launcher. Select a search type, enter a name or title, and choose **Search music**. Results link to MusicBrainz and do not alter projects, notes, tasks, or Jarvis plans. The launcher uses three fixed read-only lookup routes, shared 1.2-second request spacing, a descriptive User-Agent, and Windows' system `curl.exe` for HTTPS. A static site server or unavailable network shows an error rather than a simulated result. [MusicBrainz](https://musicbrainz.org) supplies the reference data.

The supplied `public-apis-master.zip` contains validation scripts but no catalog of API entries. It was not imported as a list of live Halo integrations; see [the archive audit](docs/PUBLIC_APIS_AUDIT.md).
