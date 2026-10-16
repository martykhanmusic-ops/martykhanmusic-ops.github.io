# Halo / Jarvis foundation

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
