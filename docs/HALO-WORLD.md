# Halo World · architecture, baseline and risks

## M0: verified baseline

Branch: `feature/halo-jarvis-foundation`. HEAD: `0ba8bcf`; ancestors include
`671bbd5` and `7b1cdfc`. Historical 16-test baseline has grown to 27 tests.
The working tree already contains an uncommitted reference-led Desktop preview
(HTML, app rendering, CSS, ui modules, assets, tests, README and review documents).
Those changes are preserved and excluded from World milestone commits. A tracked
patch and untracked file inventory were recorded under `/tmp/halo-pre-world-*`.

Before World production edits: `npm test` passed all 27; `npm run check` and
`git diff --check` passed. `HALO_TEST_URL=http://127.0.0.1:4175 npm run test:browser`
passed the foundation suite, project/Jarvis suites at 1440/390px, and Universe
suite at 1440/768/390px. No reported page errors/overflow in those flows.
There is no build or framework: static HTML/CSS/native ES modules, Node tests,
Playwright 1.56.1. No local architecture/security/AGENTS guidance files were found.

Verified features: dashboard/project routes, notes/task edits, shared project
mutations, search, quick capture, backups/restore, reopen/resume, themes, local
Jarvis queue/permissions/deletion approvals/audit/retry/recovery. Music, files,
games, research, camera, wellness and remote AI are not implemented services.
Routes are persisted `dashboard|project|jarvis` values, not URL router paths.
Data is version-1 localStorage `halo.workspace.v1`, guarded against stale tabs.
Subscriptions refresh a single application mount. Unsaved project/capture drafts
live in DOM/session memory; application unload warns but does not save them.

## Architecture / gates

- Default-off gate: query `?world=1` or explicit localStorage feature opt-in.
  Reload always starts in Desktop. No project schema or route values change.
- A tiny gate loads the mode controller only when opted in. Three.js is pinned,
  MIT-licensed and locally vendored; no CDN/network dependency at runtime. It is
  dynamically imported only on Enter World. This avoids adding a build pipeline
  or writing an ad-hoc WebGL engine. Desktop never depends on WebGL success.
- World is an isolated presentation with a typed, validated destination registry,
  a small low-poly plaza, third-person avatar, WASD/Shift, follow camera, collision,
  proximity prompts and an equivalent keyboard destination list.
- Session bridge exposes immutable state snapshots and the existing navigation
  entry point. It exposes no write/delete/execute privilege. Only one store,
  original DOM mount, event-handler set and Jarvis lifecycle exist.
- M2 Open App returns to the original Desktop and uses existing navigation guards.
  If a guard rejects a route change, the existing editor remains visible.
- M3 hides/inerts the Desktop DOM rather than unmounting it. Exiting disposes
  rendering and returns focus to the original context. Async loading is guarded
  against cancellation and repeated toggles. Mobile stays in Desktop.
- M4 moves the same Desktop shell into a project workstation overlay. It never
  clones UI or records. Closing parks it back at its original DOM anchor, retaining
  drafts. Scene rendering/input pause while the workstation has focus.
- Context loss, unsupported GPU, sustained low performance and initialization
  failure restore Desktop with an explanation. Hidden documents pause rendering.
- M5 districts/assets/art expansion are explicitly out of scope pending approval.

## Risk register

| Risk | Mitigation / remaining blind spot |
| --- | --- |
| Uncommitted user preview | Stage only isolated additions and narrow integration hunks; never reset/stash/drop it |
| Duplicate stores / stale writes | World reads the one bridge; all writes remain existing application controls |
| Lost unsaved edits | Preserve original DOM on mode changes/workstations; route changes retain existing warning; reload still cannot preserve unsaved drafts |
| GPU unavailable / context loss | Graceful Desktop fallback; test actual context-loss extension where supported |
| Async loading race / leaked listeners | Generation token, idempotent disposal, explicit abort/cleanup and repeated-toggle tests |
| Low-end hardware | Low-poly scene, capped pixel ratio, no textures/postprocessing, frame monitoring; real-device GPU coverage remains limited |
| Mobile movement | Explicit Desktop fallback; no incomplete joystick controls |
| Approval bypass | Bridge has no execution API; Jarvis only through original command center |
| LocalStorage concurrency | Existing optimistic guard retained; not multi-user locking |
| Static hosting vendor path | Vendored ESM and license included; no runtime node_modules or CDN path |
| Art direction | Small provisional plaza only; no city generation or M5 expansion |
| Test environment | Chromium software rendering is not a physical-GPU performance guarantee |

Each M0–M4 gate is recorded in SPRINT.md with executed results and its own commit.
No push, merge or deployment is authorized.

## Implemented registry and session lifecycle

Only `projects` is active in the 3D registry for M1–M4. Its featureId is `projects`,
route resolves to the existing active `project` ID (or dashboard if empty),
location is (-6, 2), appearance is provisional, interactionModes are Open App and
workstation, and permissions are empty because navigation itself is unprivileged.
The workstation adapter is `existing-project-shell`. Registry records have a
JSDoc type and runtime validation; route resolution never copies project data.
Other districts remain M5; no unavailable integration was activated.

The optional application hook answers a session request with `getState` and
`openRoute`. It never creates a store, exposes write methods or runs recovery.
The shell owns the original DOM. World hides/inerts it during exploration and
disposes the GPU scene on exit. Unsaved fields/selection/focus remain in that DOM.
A workstation temporarily reparents the same shell under a labelled overlay;
closing or GPU failure parks it at a stable home anchor before destroying World.
The avatar's last position is retained in session memory, not project storage.

Mode switching preserves unsaved DOM state. Actual app route changes keep the
original application's dirty guards; it does not add support for unsaved Jarvis
command drafts across a route change. Reload still loses unsubmitted drafts after
the existing warning and restores saved data only. Mobile/coarse-pointer devices
use Desktop. World reads theme background tokens on mount; live 3D retheming and
downloadable environments are not implemented. The plaza is a technical visual
prototype, not finalized art or a multiplayer service.

## Run and verify

From the repository:

```sh
npm ci
npm start
```

Desktop: `http://localhost:4173/halo/`. Optional World:
`http://localhost:4173/halo/?world=1`, then **Enter Halo World**. Query opt-in is
session-local; alternatively explicitly set `halo.world.enabled.v1` to `true` in
localStorage. Remove that key/query to disable. Reload starts in Desktop either
way. WASD/arrows move, Shift runs, E interacts nearby. **Projects destination** is
a keyboard equivalent to walking. Open App uses Desktop; Use in World is offered
only after selecting/creating a project. Return to Desktop is always available.

```sh
npm test
npm run check
node scripts/check-world.mjs
node scripts/test-world.cjs
```

The World runner creates and shuts down its own local static server, and uses
system Chromium or `HALO_CHROMIUM_PATH`. If neither exists, install Playwright's
Chromium with `npx playwright install chromium`. Tests request software WebGL;
this does not establish performance on physical GPUs.

To include the current uncommitted Desktop preview regression suites as well:

```sh
node scripts/test-world.cjs tests/browser.cjs tests/integration-browser.cjs tests/universe-browser.cjs tests/world-browser.cjs tests/world-session-browser.cjs tests/world-lifecycle-browser.cjs tests/world-workstation-browser.cjs
```

## Executed evidence / limits

Current working-tree core suite: 32 passing tests (27 baseline plus five World
tests). Original Desktop browser suites passed at desktop/tablet/mobile sizes.
World tests passed default-off lazy loading, actual WebGL movement/discovery,
walk/open/edit/save/return, four repeated mount/dispose cycles, unchanged saved
state, original draft/focus retention, real context loss, loading cancellation,
unsupported graphics, mobile fallback and simulated low-performance fallback.
Workstation tests verify actual notes/tasks, denial before deletion permission,
explicit approval, verified result/audit, backup export/restore resetting access,
return to the original shell, and context-loss rescue while editing.

World suites capture page errors/unhandled script exceptions and console errors.
No errors are accepted in those verified flows. Core collision checks include the
circular plaza boundary. App and new-module syntax/whitespace checks pass.

Not measured: physical-device FPS, heap/driver-level GPU memory reclamation,
multi-user concurrency, assistive-technology behavior or all browser engines.
Performance fallback uses injected timestamps in one browser test; it is not a
hardware benchmark. Page hiding pauses the render loop; no background worker is
created. Interrupted network/test-server runs were rerun, never counted as passes.

## Reversal / next decisions

Default off is the immediate rollback. The five milestone commits are isolated
from the earlier Desktop preview; no storage migration, schema/route change,
authentication change, push, merge or deployment is involved. Store, shared
project operations and Jarvis implementation remain unchanged.

Next choices require review: approve the provisional plaza art direction; decide
whether another verified destination belongs in M5; decide whether to invest in
touch controls or continue Desktop-only World support. Multiplayer, new apps,
external AI and additional themed districts are outside this delivery.

## Changed-file summary

| Area | Files |
| --- | --- |
| Two narrow Desktop hooks | `halo/index.html` (default-off gate script), `halo/app.js` (read/navigation session listener) |
| Optional shell/session | `halo/shell/WorldGate.js`, `halo/shell/ModeSwitcher.js`, `halo/shared/ApplicationSessionBridge.js` |
| Isolated World modules | `HaloWorld.js`, `WorldScene.js`, `AvatarController.js`, `FollowCamera.js`, `DestinationRegistry.js`, `InteractionManager.js`, `WorldPerformanceManager.js`, `WorldWorkstation.js`, `flags.js`, `world-mode.css` under `halo/world/` |
| Pinned renderer | `halo/world/vendor/three.module.js`, MIT license and provenance README |
| Verification | `scripts/check-world.mjs`, `scripts/test-world.cjs`, `tests/world.test.js`, four `tests/world-*-browser.cjs` suites |
| Delivery | `docs/HALO-WORLD.md`, `docs/SPRINT.md` |

Earlier Desktop preview changes in README, app styling/rendering, assets, UI
modules, package scripts and preview tests are preserved as uncommitted work;
they are not silently included in World commits. No existing storage or Jarvis
implementation file was changed by this milestone.

### Independent committed-tree verification

The committed M0–M4 code was exported with `git archive` to an isolated temporary
directory, without the pending Desktop preview. That copy passed all 28 committed
core tests, app/World syntax checks and all four World browser suites. The working
tree's four additional UI tests explain its total of 32. This confirms World does
not depend on the uncommitted visual redesign. The copied dependency directory
was used only to resolve the already-pinned Playwright development tool.
