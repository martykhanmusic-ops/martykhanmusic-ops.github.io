# Verified architecture and inventory

Audit: October 16, 2026, /workspace/halo, branch feature/halo-jarvis-foundation. Remote origin: https://github.com/martykhanmusic-ops/martykhanmusic-ops.github.io.git. Remote baseline confirmed by ls-remote: 56079799e4609f23535b692acf372396890a2c7a. No AGENTS.md found in repository or ancestors. Reviewed README.md, package.json, SPRINT.md, HALO-WORLD.md and PROJECT-JARVIS-INTEGRATION.md plus application, store, adapters, bridge, World and tests.

## Runtime and dependency map

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

No filesystem index, companion, actual music/audio import, streaming, VST3, DAW control, game, dose or writing application was found. No API endpoints or external AI connection exist.

## Recovery and rollback

Export a JSON backup before clearing browser data or restoring. Keep same origin/profile for continuity; clearing storage loses local data. For corruption use recovery download; repair a copy rather than overwrite evidence. For quota failures export existing data and free storage, then retry explicitly. For stale-tab conflicts reload after preserving drafts manually. Never promise unsaved draft recovery after reload.

World can be disabled by removing world=1 and halo.world.enabled.v1; Desktop needs no successful WebGL initialization. Roll back isolated World commits with ordinary revert commits after review, not reset/history rewrite. Workspace schema stays version 1. Preserve user preview patches and never stage them implicitly. No deployment or remote-main change is authorized.

## Local run and validation

From repository root: `npm ci`, `npx playwright install chromium` (for browser tests), then `npm start`. Open `http://localhost:4173/halo/`; World is optional at `http://localhost:4173/halo/?world=1`. Keep the origin stable to retain local data. Browser tests use isolated profiles, not your saved workspace.

Run `npm test`, `npm run check`, `node scripts/check-world.mjs`, and `node scripts/test-world.cjs tests/master-core-browser.cjs tests/master-jarvis-browser.cjs tests/browser.cjs tests/integration-browser.cjs tests/world-browser.cjs tests/world-session-browser.cjs tests/world-lifecycle-browser.cjs tests/world-workstation-browser.cjs`. The self-contained runner needs no separately started server; HALO_CHROMIUM_PATH can select a local Chromium executable. Uncommitted preview additionally has its own UI suite; it is not a prerequisite for the committed application.
