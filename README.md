# Marty Khan Music · Halo OS

The original music landing page lives at `/`. Halo and Jarvis live at `/halo/`.
This is a static application: there is no build step, backend, or runtime npm
dependency. Visual styling is provisional for review.

## Run locally

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

## Data and scope

Everything is stored in localStorage on this browser origin. No cloud sync,
authentication, encryption, AI provider, external messaging or integrations are
connected. Jarvis uses deterministic local adapters, not natural-language AI.
Don't store secrets. Export backups before clearing browser data. Data from a
localhost session will not automatically appear on a deployed domain.

Projects use explicit Save; closing or navigating with unsaved edits warns you.
Backup restore replaces the current workspace, resets tool permissions to safe
defaults and invalidates pending deletion approvals. Completed-task deletion is
permanent unless you have an earlier backup. Avoid simultaneous edits in multiple
tabs: stale saves are rejected, but localStorage is not a multi-user database.

See [the sprint audit and delivery report](docs/SPRINT.md) for validation,
architectural limitations and next milestones. No production deployment or push
is part of this local implementation.
