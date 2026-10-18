# Verified architecture and inventory

Audit: October 16, 2026, /workspace/halo, branch feature/halo-jarvis-foundation. Remote origin: https://github.com/martykhanmusic-ops/martykhanmusic-ops.github.io.git. Remote baseline confirmed by ls-remote: 56079799e4609f23535b692acf372396890a2c7a. No AGENTS.md found in repository or ancestors. Reviewed README.md, package.json, SPRINT.md, HALO-WORLD.md and PROJECT-JARVIS-INTEGRATION.md plus application, store, adapters, bridge, World and tests.

## Runtime and dependency map

The creative-orbit flow composes the existing dashboard, project workspace,
music hub and Jarvis view. Optional `project.sessions` records are validated
inside `halo.workspace.v1`; no separate session database is created. Home
derives the next task, music link and reminder from this store. Jarvis chat
sends a bounded selected-project summary to the local model only; filesystem
paths, complete notes and tool authority are excluded. Voice and DAW actions
remain behind their existing explicit controls.

Jarvis now presents the orb and chat first, with Voicebox recording and speech
controls connected to that surface. The existing plan, permission, reminder,
and audit DOM remains in the same view below the conversation. On the Windows
launcher's `localhost` origin, the local model list is requested on Jarvis
entry; `qwen3:0.6b` is preferred when installed, otherwise the first local
model is selected. The static test/development origin keeps manual discovery.
Transcription fills the chat composer for review; no spoken text is sent or
executed automatically.

M7 adds a separate Windows VST3 plugin source under `live-listen/`. It builds against a local external Steinberg VST3 SDK checkout and currently passes stereo audio through the host. It has no connection to the browser workspace, Windows companion, Halo World, transport or room service. The SDK build produces an ignored local artifact and does not install a plugin globally. Audio capture and room transport remain architectural work.

Master M3 adds an optional Windows Node companion under `companion/`. It is a
separate loopback process with no workspace database. `halo/companion.js`
renders an additive sidebar panel and is not imported by the project store,
Jarvis adapters, or World scene. Its in-memory bearer session, startup grants,
single-use app launch approvals and recent audit belong to the companion
process. With the process absent, the original static shell continues to run.
The companion uses only Node built-ins and fixed Windows PowerShell commands;
no new npm runtime dependency, public endpoint, or provider credential exists.

Static music landing /index.html → /halo/index.html → singleton app.js → store.js + jarvis.js → shared project-state.js. Native ES modules/HTML/CSS, no server API, framework, authentication, bundler or build step. Node runs tests; Python serves local development. Playwright 1.56.1 is the only npm development dependency (lockfile); World locally vendors MIT Three.js 0.160.1, loaded only on opt-in. No package lint/build scripts exist.

app.js owns rendering, events, drafts, recovery and routing. Persisted views are dashboard/project/jarvis (not URL-router paths). Projects/notes/tasks are one workspace. Existing shared controls use styles.css. No general application registration framework exists.

index → shell/WorldGate → opt-in ModeSwitcher → HaloWorld → WorldScene/AvatarController/FollowCamera/InteractionManager/WorldPerformanceManager. DestinationRegistry has one operational Projects entry. WorldWorkstation reparents the original shell, never clones the app. ApplicationSessionBridge offers snapshots/navigation only. World default-off, mobile Desktop fallback, WebGL/context-loss/slow-frame fallback and cleanup are implemented.

## Data and lifecycle

store.js is authoritative for halo.workspace.v1 (schema version 1): projects, notes, tasks, activeProjectId, view, theme, activity, jobs and permissions. Snapshot → transaction/validation → stale-disk check → atomic localStorage write → publish. Shared project-state.js functions serve Halo and Jarvis. No migration introduced. Restore validates, confirms replacement, invalidates approvals and resets permissions. Corrupt bytes preserved for recovery; quota failures do not advance memory state. Stale tabs reject writes; this is optimistic detection, not cross-tab locking.

One application store/session per document. Notes use explicit Save; unsaved text stays in original DOM while switching World/Desktop, not across reload. Existing navigation/unload guards warn. World cannot execute privileged actions: original UI and adapters retain permission/approval/audit checks. Browser-origin storage is unencrypted, not synced, and same-origin scripts are trusted.

Jarvis is deterministic local tooling: add_task, complete_task, append_note, summarize, delete_completed. Plans have project/task IDs, immutable plan snapshots, structured logs and results. Execution records running before an atomic effect+completion transaction. Recovery marks interrupted jobs failed; explicit retry, no automatic execution. Cancel applies before execution/awaiting approval/failed; atomic running actions cannot be interrupted. Deletion and task completion permissions default off; deletion also requires plan approval.

## Pending work boundary

The first M3 companion increment is now additive: `companion/server.mjs` owns
only loopback pairing/session state and live Windows device reads, while
`halo/companion.js` is a browser adapter/status surface. It does not create a
second workspace store or bypass Jarvis. Filesystem, application, process and
audio adapters are intentionally still absent pending their scoped contracts.

Uncommitted UI preview modifies README, app/index/styles/package and foundation/browser selectors; adds halo/ui, tokens.css, universe.css, halo/world.css, scenic asset, docs/previews, UI-DESIGN-REVIEW.md and UI tests. Preserve all of it. It is a design preview, not an approved milestone. halo/world.css is distinct from committed halo/world/world-mode.css. Independent committed-tree checks are necessary so preview files cannot conceal missing dependencies.

No filesystem index, actual music/audio import, streaming, VST3, DAW control,
game, dose or writing application was found. The companion exposes only
authenticated loopback endpoints for its specific OS operations; no external
AI connection exists.

## Recovery and rollback

Export a JSON backup before clearing browser data or restoring. Keep same origin/profile for continuity; clearing storage loses local data. For corruption use recovery download; repair a copy rather than overwrite evidence. For quota failures export existing data and free storage, then retry explicitly. For stale-tab conflicts reload after preserving drafts manually. Never promise unsaved draft recovery after reload.

World can be disabled by removing world=1 and halo.world.enabled.v1; Desktop needs no successful WebGL initialization. Roll back isolated World commits with ordinary revert commits after review, not reset/history rewrite. Workspace schema stays version 1. Preserve user preview patches and never stage them implicitly. No deployment or remote-main change is authorized.

## Local run and validation

From repository root: `npm ci`, `npx playwright install chromium` (for browser tests), then `npm start`. Open `http://localhost:4173/halo/`; World is optional at `http://localhost:4173/halo/?world=1`. Keep the origin stable to retain local data. Browser tests use isolated profiles, not your saved workspace.

Run `npm test`, `npm run check`, `node scripts/check-world.mjs`, and `node scripts/test-world.cjs tests/master-core-browser.cjs tests/master-jarvis-browser.cjs tests/browser.cjs tests/integration-browser.cjs tests/world-browser.cjs tests/world-session-browser.cjs tests/world-lifecycle-browser.cjs tests/world-workstation-browser.cjs`. The self-contained runner needs no separately started server; HALO_CHROMIUM_PATH can select a local Chromium executable. Uncommitted preview additionally has its own UI suite; it is not a prerequisite for the committed application.

## Master M4 application framework (October 16, 2026)

`halo/framework.js` owns a typed, in-page registry. `halo/apps/catalog.js` lists trusted extension modules; `halo/app-host.js` renders discovery, explicit grants, lifecycle controls and app panels. Workspace Status reads the existing ApplicationSessionBridge snapshot. Core Projects and Jarvis retain the original shell, store and permission checks. Grants, settings and JSON state persist in `halo.applications.v1`, separate from authoritative `halo.workspace.v1`; corrupt app metadata is preserved while Halo falls back to an in-memory registry. Metadata writes detect stale tabs. Availability checks platform, minimum shell version and major app state version. The catalog is trusted same-origin code, not a sandbox for arbitrary third-party scripts.

Jarvis voice now connects to the optional local Voicebox installation through the Windows launcher. The bridge is loopback-only and route-limited. Speech transcriptions remain drafts until a user creates a plan; Voicebox output cannot bypass Jarvis permissions or deletion approval. A local Jarvis preset profile exists on this PC. Whisper base completed and a real generated WAV was transcribed accurately through the launcher. Browser speech fallback works without Voicebox TTS.

The optional local model draft bridge in `HaloLauncher.cs` maps only `/local-llm/models`, `/local-llm/draft` and `/local-llm/chat` to Ollama tags/chat on `127.0.0.1:11434`. The launcher checks loopback/Host, requires the exact Halo Origin for POST, and limits request size. Halo validates model output against three non-destructive Jarvis actions before filling the existing form; it neither creates a job nor invokes a tool. The client requests JSON output and filters cloud-tagged model names from discovery. Ollama 0.40.6 and qwen3:0.6b were verified on this PC: a real draft passed through the launcher and populated the browser review form without automatic planning or execution.

Jarvis chat uses the same loopback launcher bridge at the exact `/local-llm/chat` route, with the same Host, Origin, size and method checks. It sends a bounded recent conversation and no tool definitions. User and model text are rendered with `textContent`. Successful exchanges are saved in the canonical `halo.workspace.v1` store as a bounded `chat` array, so backup/restore and stale-tab protection apply. The optional field loads as empty in legacy workspaces. Chat writes no project, task, note, job, permission or OS state. A failed model request leaves the unsent input available for retry; clearing saved chat requires confirmation.

Local reminders use an optional `reminders` array in that same canonical workspace store. The store validates titles, future creation times, statuses and timestamps. `halo/reminders.js` derives due items from persisted data and checks on a 15-second interval while the page is open. It exposes a due badge without notification permission. The user explicitly requests browser permission for alerts; successful alert creation records `alertedAt` to avoid repeated alerts after reload. Browser permission denial and unavailable notification APIs leave the list and badge usable. No companion endpoint, Jarvis job, background scheduler or service worker is involved.

The optional public music reference on Overview calls only `/public-data/artists`, `/public-data/recordings`, or `/public-data/releases` with a bounded `name` query on the loopback Windows launcher. Those map to fixed MusicBrainz artist, recording and release-group resources. The launcher encodes the query, spaces all searches by at least 1.2 seconds, uses a descriptive User-Agent, caps response bytes/time, and rejects other paths, methods, and foreign Origins. It invokes the fixed Windows system `curl.exe` directly without a shell because the packaged .NET Framework runtime failed the MusicBrainz TLS handshake on this PC; no browser-provided URL or command is accepted. The browser validates and renders at most eight results through DOM text, with fixed MusicBrainz ID links. Search is transient and never writes the Halo workspace or grants Jarvis/World a network tool.

M6 library slice: `halo/music-hub.js` uses the existing project route and `halo/store.js` project object. It requests `/files/music-stat` from the optional paired Windows companion. That authenticated, Files-grant route uses the existing approved-root canonical path check, limits recognized music extensions and returns actual file size, modification time and verification time. The project holds metadata only; media bytes remain on disk. Recheck reports current failure or change without silently treating a saved timestamp as live connectivity. Jarvis review tasks use the original task API; World opens the original project shell. No separate music database or DAW execution path exists.

The next M6 slice uses the existing authenticated `/files/list` route to browse one approved directory at a time. The companion caps a listing at 200 entries. The UI shows only folders and supported music file extensions, renders names as text, and fills a relative path only after selection. Linking still makes a separate `/files/music-stat` request. A failed or revoked listing clears prior results and does not write the project store.

The DAW slice calls the existing `/apps`, `/apps/approval`, and `/apps/launch` companion routes from the project music panel. It filters discovered, allowlisted shortcuts to DAWs, requires a fresh local one-time code and browser confirmation, and accepts success only when the companion returns a matching application and verification time. Changing selection invalidates the pending UI approval. Duplicate Start Menu shortcut names are collapsed by ID. DAW discovery/launch is session-only; it does not mutate the project store or open a project file. The companion remains the authorization boundary.

The linked Ableton project slice adds `/apps/project-approval` and `/apps/project-open`. Approval requires both Apps and Files grants, the exact Ableton Live 12 Suite shortcut, and a saved `.als` reference whose canonical root, relative path, size and modification time match a fresh Windows file stat. Its six-digit code is tied to the shortcut and file fingerprint for 60 seconds. Opening consumes the code first, rechecks the fingerprint, then invokes the fixed PowerShell launch helper with the allowlisted shortcut target and exact approved file path. App-only codes cannot open projects; revoking either grant invalidates pending project approval. Halo reports a launch request, not proof that the DAW completed loading the file. The project reference remains in `halo.workspace.v1` and World/Jarvis have no route to these endpoints.

The October 18 live M6 check exercised that browser → companion → Windows path with a user-selected Ableton template. Windows reported a new responsive Ableton Live 12 Suite process with the selected file as its command-line argument, and the user confirmed the template content loaded. The browser's isolated test workspace was separate from personal saved Halo data. This acceptance evidence does not turn DAW content inspection into an automated Halo capability, grant World a launch route, or establish FL Studio's physical project load.

The same file-bound project flow now maps FL Studio 2026 to `.flp` and its `FL64.exe` target. Companion and PowerShell helper both enforce the shortcut/extension/target association; the UI filters linked projects by the selected approved DAW. This does not expand the folder grant or permit arbitrary file arguments. Each companion run still has one explicitly approved root.
