# Halo / Jarvis foundation

## Master M3 Windows companion · October 16, 2026

The optional loopback companion now pairs with Halo, displays verified Windows
device status, and revokes access. Startup grants bound a read-only folder,
named Start Menu shortcuts, process status and audio endpoint discovery.
Application launch needs a separate single-use code in the companion window.
Desktop/mobile browser checks, Windows OS checks and the foundation/Jarvis/World
regression suites are recorded in HALO_TEST_REPORT.md. The companion retains
only session grants and a recent audit in memory; the browser workspace remains
the single store. The local origin restriction and file replacement race are
recorded in HALO_LOCAL_BRIDGE.md. This master milestone is distinct from the
historical technical World stages below.

## Repository audit · October 16, 2026

Source: `martykhanmusic-ops/martykhanmusic-ops.github.io`, default branch `main`.
Baseline contained only a README and a 4,935-byte static music landing page.
No Halo, Jarvis, music library, dose tracker, songwriting code, dependencies,
test runner, build, or CI configuration existed. No baseline checks were available.
The user explicitly authorized building Halo / Jarvis in this repository.
The original landing page is preserved. Work is isolated to
`feature/halo-jarvis-foundation`; no deployment is authorized.

## Milestone 1 · persistent Halo workspace

- Native HTML/CSS/ES modules under `/halo/`, compatible with static hosting.
- Project creation, project notes/description, task completion, search across
  projects/notes/tasks, activity, persisted route and active project, theme.
- Versioned localStorage data, validated JSON backup/restore, save failure
  reporting, preservation of corrupt data, stale-tab write protection.
- Responsive shell, shared tokens/components, native modal, keyboard focus,
  reduced motion. New visual treatment is provisional for review.
- Source: `halo/index.html`, `halo/styles.css`, `halo/app.js`, `halo/store.js`.
- Validation: six Node persistence tests passed; Chromium browser test passed
  create/save/close-tab/reopen/resume, task completion and search at desktop and
  390px mobile widths. No horizontal overflow or JavaScript errors in that run.
  Syntax checks and `git diff --check` passed.
- The runtime's Node test subprocess mode suppressed individual test execution;
  `--test-isolation=none` runs all assertions and reports each test explicitly.

## Constraints

Data belongs to the current browser origin/profile, without encryption or cloud
sync. Clearing site data removes it: export backups. Browser storage quotas
apply. The optimistic stale-tab check is not a distributed transaction; do not
edit the same workspace concurrently in multiple tabs. Notes use explicit Save;
unsaved changes trigger navigation/unload warnings. Backup restore replaces the
workspace after user confirmation. Backups contain private project information.

No production deployment, external accounts, paid services, credentials, or
external communications were created. Music Shelf, Dose Tracker and songwriting
remain future milestones.

## Milestone 2 · Jarvis local orchestration

- New `halo/jarvis.js` adapter registry: task creation, note append, recorded-data
  status summary, and deletion of specifically planned completed tasks.
- `halo/app.js` provides plan review, persistent queue/history, status filters,
  individual tool permissions, approval, cancellation, explicit retry and logs.
- Destructive permission is off by default. Approval binds to captured task IDs;
  changed targets fail safely. Restore invalidates approvals and resets access.
- `halo/store.js` validates workflow schemas and persists adapter effects and
  completion together. An interruption before that commit has no partial effect.
  Startup marks interrupted jobs failed without executing them again.
- `halo/styles.css` adds shared status, log, form and filter presentation;
  the Saturn orb opens Jarvis. `index.html` adds a link into the application.
- `package.json` / lockfile pin the Playwright development dependency. README
  documents setup, scope and storage behavior. No production dependencies added.
- `tests/jarvis.test.js` adds ten tests for execution, approval, permissions,
  recovery, retries, restore, validation and atomic failure. Together with
  `tests/store.test.js`, all 16 tests passed (`npm test`).
- `npm run check`: JavaScript syntax checks passed. `git diff --check`: passed.
- `npm run test:browser`: Chromium passed create/save/close/reopen/resume/search,
  task completion, Jarvis plan/run/reload/history, permission denial and deletion
  approval, actual deletion and task creation, keyboard dialog open/Escape,
  reduced-motion media support, escaped markup and visible quota failure.
  Desktop 1440px and mobile 390px: no horizontal overflow or JavaScript errors.
- Desktop/mobile screenshots were inspected; a visible hidden file-input issue
  was corrected. Styling remains provisional; no approved brand reference exists.
- Baseline browser test had a selector ambiguity against a closed dialog; fixed
  by scoping the project editor selector. The final full browser run passed.

## Remaining scope / next implementation

Jarvis is a functioning local workflow engine, not an AI agent or remote worker.
External actions are unavailable, so none bypass approval. A server-side worker,
authentication, durable database, provider configuration and credential isolation
are required before adding an AI planner or remote integrations. Permissions in
a local browser UI are safeguards, not a security boundary against scripts with
same-origin access. Global search indexes project/task/note records only; there
is no file index yet. No actual device or assistive-technology audit, other browser
engine testing, encryption, cross-device sync or production deployment was done.

Recommended next milestone: add IndexedDB-backed file metadata and audio storage
for Music Shelf, with import/preview/tag/project/reopen tests. For cloud-connected
Jarvis, first agree on the backend and authentication architecture. Avoid putting
provider credentials into this static site.

## Halo World M0 · verified audit

World work starts from `0ba8bcf` on `feature/halo-jarvis-foundation`, preserving
the existing uncommitted Desktop preview. Verified 27 passing current tests,
syntax/whitespace checks, and all six current Chromium workflow scenarios
(foundation, desktop/mobile integration, desktop/tablet/mobile Universe).
See `HALO-WORLD.md` for the actual feature inventory, session ownership plan,
rendering decision, feature gate, risk register and unresolved blind spots.
No production code was changed before this baseline gate passed.

## Halo World M1 · default-off plaza

Added isolated `halo/world/` modules, a lazy gate and opt-in mode controller.
Three.js 0.160.1 is locally vendored with MIT license and checksum; 3D does not
load in default Desktop. A small plaza provides WASD/arrows/Shift movement,
third-person follow camera, circle/boundary collision, Projects destination
proximity, rendering cleanup and explicit mobile Desktop fallback.
Gate: all 31 core tests, existing app syntax, World syntax and whitespace checks
passed. `HALO_TEST_URL=http://127.0.0.1:4175 node tests/world-browser.cjs` passed
actual Chromium WebGL rendering, movement, default-off lazy loading, disposal,
Desktop return and mobile fallback with no page errors. Route integration and
workstation actions are intentionally not enabled in this milestone.

## Halo World M2 · existing-route integration

Added a read/navigation-only ApplicationSessionBridge and one narrow session hook
in app.js. The verified Projects registry entry resolves the actual active project
ID or existing dashboard when empty. Walk/proximity/E and keyboard destination
selection offer Open App; it restores the original Desktop and uses its routing
and dirty guards. No direct store write or Jarvis execution API is exposed.
Gate: 32 core tests, app/World syntax and whitespace passed. The M2 Chromium test
walked to Projects, opened the original route, edited/saved real notes, returned
through World/Desktop and verified the same single persisted project, with no
page errors. Existing uncommitted app changes remain excluded from this commit.

## Halo World M3 · lifecycle and fallback

Preserves the same editor DOM, unsaved text and focus across switching; adds
graphics preflight, cancellation-safe loading, context-loss fallback and distinct
hidden-document/user pause ownership. Visible destination labels and initial
instructions were corrected during visual inspection. A self-contained local
HTTP test runner replaces unreliable long-lived server sessions.
Gate: all 32 core tests, app/World syntax and whitespace checks passed.
`node scripts/test-world.cjs tests/world-lifecycle-browser.cjs` passed Chromium
repeated enter/dispose cycles, exact saved-data preservation, original unsaved
editor/focus retention, real context-loss extension, reload behavior, cancelled
lazy-import race, unsupported WebGL and simulated sustained-slow-frame fallback.
No page errors. Slow timestamps are injected for fallback verification; this is
not a real-device GPU benchmark. Reload restores only saved data, as before.

## Halo World M4 · real in-world workstation

Projects now offers Use in World for an existing active project. It reparents the
one original Desktop shell into an overlay and pauses exploration; no cloned UI,
iframe, secondary store or privileged World API exists. Closing/graphics failure
parks that shell before disposing the scene. Existing project, Jarvis and backup
controls remain the only write paths. Theme background is read on scene mount.
Final collision coverage also checks the circular plaza boundary.

Gate: all 32 current working-tree core tests, app/World syntax and whitespace
checks passed. The combined runner passed all original foundation/desktop/mobile/
tablet suites and all four World suites. Final World rerun additionally asserted
no console errors and verified backup export/restore from the workstation.
M4 verified original unsaved editor identity, notes/tasks, disabled-deletion
denial, explicit approval, verified result/audit, safe close/return, graphics-loss
rescue with an open draft, and reload of saved data. No push/deploy/merge. M5 is
not implemented and requires explicit visual/destination approval.

Independent check: a `git archive` export of the committed implementation,
excluding the uncommitted Desktop preview, passed 28 committed core tests,
app/World syntax and all four World browser suites. The working tree has four
additional preview UI tests (32 total). Both versions passed; the World commits
do not require that preview to function.


## Master roadmap adoption · October 16, 2026

Historical milestones above keep their original numbering and then-current push
statements. Current master sequence and exact remote receipts live in
HALO_MASTER_ROADMAP.md and HALO_MILESTONE_STATUS.md. World through 5607979 and
master audit 3838b0f were pushed with authorization; no production deployment.

Master M1 retains the existing core and adds independent desktop/mobile tests for
backup export/restore, saved-data identity, dirty-navigation rejection, search and
resume. Isolated committed code passed 28 tests, syntax and nine Chromium scenario
groups after correcting legacy tests to use HALO_TEST_URL. The pending visual
preview remains uncommitted. See HALO_TEST_REPORT.md for failure and rerun evidence.


Master M2 adopts the existing Jarvis engine with three new automated cancellation/
concurrency assertions and desktop/mobile interrupted-execution/retry tests.
Working tree: 35 tests; isolated committed scope: 31 tests, syntax and eight
Chromium scenarios passed. Cancellation remains pre-execution; atomic effects
cannot be rolled back by a late cancellation. Existing permissions, deletion
approval, logs and recovery are unchanged. No external AI/provider connected.


Master M0/M1/M2 payloads are COMPLETE_AND_PUSHED with exact remote SHA receipts
in HALO_MILESTONE_STATUS.md. Master M3 first increment is COMPLETE_AND_PUSHED in
`3753bfe`: loopback pairing, live Windows device verification and revocation.
Filesystem grants, allowlisted app discovery/launch, process status,
audio-device discovery and complete recovery/browser evidence remain. No later
master stage started; no preview design finalized, runtime feature replaced,
schema migrated or site deployed.

## Master M4 application framework — October 16, 2026

The trusted module registry and sample Workspace Status app are integrated with the original shell. Per-app grants, theme, settings and state use separate metadata; project/task/note IDs stay in the canonical workspace. Desktop/mobile focused tests pass, including denial, revocation and reload. The full eight-suite regression and companion browser rerun passed. Remote verification remains the delivery gate. Master M5 has not begun.

M4 payload f5a93fbcc39511ca002c33493544e155caad6ccc matched the remote feature branch. Master M5 has not begun.

Master M5 visual-language increment: the user requested Halo's orbital UI treatment. The CSS layer is integrated and visually inspected at desktop/mobile/light sizes; regression passes. Full package preview/rollback and accessibility review remain. M6 has not begun.

Jarvis voice box increment: local Voicebox speech output and limited launcher bridge are implemented. Browser microphone-to-plan and speech controls pass desktop/mobile tests. Actual TTS produced WAV audio; after Whisper base completed, that audio was transcribed accurately through the launcher proxy. A physical microphone has not been tested. This does not advance M6 or bypass the M5 design-system gate.

M5 package increment: Appearance now previews Orbital and Classic, cancels or Escape-rolls back, and saves only an independent visual preference on Apply. Desktop/mobile appearance and full existing browser regression pass. Accessibility review remains before M5 completion; M6 has not begun.

Local LLM draft increment: optional loopback Ollama bridge and three-action validated suggestion fill the existing Jarvis form; voice text can be copied into the request. No automatic planning or execution. Controlled tests pass; live Ollama is not installed on this PC. M5 accessibility gate remains.
October 18 live follow-up: Ollama 0.40.6 and qwen3:0.6b are installed. Real launcher and browser requests returned a task draft while leaving Jarvis job/task counts unchanged until explicit plan generation. M5 accessibility gate remains.

Jarvis chat increment: local Ollama conversation is available in the command center, using bounded history in the existing Halo workspace/backup. Two-turn context, reload, cancellation of clear, offline retry and real qwen3:0.6b response passed. Chat has no tool execution. M5 accessibility gate remains.

Local reminder increment: Jarvis has manual reminders in the same workspace backup, a due top bar badge, explicit browser alert permission, and done/cancel/remove controls. Desktop/mobile tests cover permission denial, due state, controlled alert creation, persistence and no job effects. Closed-app/background notification is outside this increment. M5 accessibility gate remains.
