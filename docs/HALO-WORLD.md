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
