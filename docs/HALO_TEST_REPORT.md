# Executed validation report

October 16, 2026; baseline payload 56079799e4609f23535b692acf372396890a2c7a. Distinguish current working tree (includes unapproved preview) from isolated committed snapshot.

## Master M0

Pass 1 — audit correctness: read architecture, scripts, tests, history and documentation; verified branch/remotes and identified pending changes. `git ls-remote origin refs/heads/feature/halo-jarvis-foundation` returned baseline SHA exactly.

Pass 2 — backward compatibility: `npm test`: 32 passed, 0 failed (28 committed tests plus 4 preview UI tests). `npm run check`, `node scripts/check-world.mjs`, `git diff --check`: passed. No build/lint scripts exist; neither is claimed executed.

Pass 3 — ecosystem: combined self-contained Chromium runner passed all seven suite files / ten scenario groups (exit 0). Command:

```
node scripts/test-world.cjs tests/browser.cjs tests/integration-browser.cjs tests/universe-browser.cjs tests/world-browser.cjs tests/world-session-browser.cjs tests/world-lifecycle-browser.cjs tests/world-workstation-browser.cjs
```

Covers foundation create/save/reopen/resume/search/tasks; Jarvis plan/run/history/permission/deletion; integration at 1440/390; preview at 1440/768/390; World opt-in/movement/collision/routes, lifecycle/drafts/reload/fallback, same-shell workstation, backups and approval. Slow-frame timestamps are injected; this does not measure real GPU performance. World tests check console and page errors; original foundation/integration check page errors. No general all-browser console assertion is claimed.

Earlier independent archive of committed code passed 28 tests, syntax and four World suites; fresh isolated master validation will be recorded separately. No real user computer, DAW/mobile audio transport, other browser engine or assistive-technology validation has occurred.

## Master M1 — core stability

Pass 1 — acceptance: new `tests/master-core-browser.cjs` passed at 1440px and 390px in the working tree and in isolated committed code. Creates real project/notes/task, rejects discard confirmation while preserving the draft and saved bytes, searches notes/tasks, resumes/reloads saved data, exports an actual download and restores it over a later edit, asserting stable project ID and selected route. Checks no horizontal overflow, console errors or page exceptions.

Pass 2 — compatibility: fresh `git archive HEAD` under /tmp/halo-master-baseline, excluding all unapproved UI files, passed 28 tests, existing app syntax and World syntax. Initial browser regression failed with ERR_EMPTY_RESPONSE because two legacy suites hardcoded port 4173 rather than honoring HALO_TEST_URL. Fixed only those URL expressions, retaining their original committed UI selectors. Final combined isolated run exited 0: new core desktop/mobile, original foundation, existing desktop/mobile integration, all four World suites (nine scenario groups). No production code or storage changes.

Pass 3 — integration: that same final isolated browser run exercised original project/Jarvis/navigation/backup/permission APIs, default-off Desktop, real World rendering/routes, repeated switching/drafts/recovery and same-shell workstation including deletion approval. Original working-tree full baseline had already passed all ten scenarios at M0. No build or lint command exists. Diff/syntax checks passed; scoped review includes only tests and documentation, no credentials or runtime dependency changes.

Core search is across existing project/description/notes/task records on the dashboard, not indexed filesystem contents. Notes require Save; reload deliberately does not retain unsaved text. No new design was finalized.
