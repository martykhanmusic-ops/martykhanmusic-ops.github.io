# Resume master M3 on Windows

User decision: Windows first; Codex can run locally. Cloud work completed and remotely verified master M0–M2. M3 has no companion implementation yet. Do not restart the architecture or redesign Halo.

## Open an isolated checkout

In Windows PowerShell, choose a parent directory without an existing `halo` folder:

```powershell
git clone --branch feature/halo-jarvis-foundation https://github.com/martykhanmusic-ops/martykhanmusic-ops.github.io.git halo
cd halo
npm ci
npx playwright install chromium
```

Open this folder in a **local Windows Codex session**. Node must support the repository's test command (Node 24 recommended); Git and a Chromium installation/download are required. Browser app can be served with `py -m http.server 4173` if Python is installed, then visit `http://localhost:4173/halo/`. The repository's npm start uses python3, which may not be registered on Windows; use the explicit Windows Python launcher command instead. Automated browser tests use their own Node HTTP server and do not need Python or npm start.

Do not copy real browser data into tests. An isolated checkout does not transfer browser-local workspace data. If moving personal data, export/import a backup explicitly after reviewing replacement confirmation; do not clear the original profile.

## Give local Codex this task

> Continue master milestone 3 on feature/halo-jarvis-foundation. Read AGENTS.md if present, docs/HALO_MASTER_ROADMAP.md, HALO_MILESTONE_STATUS.md, HALO_ARCHITECTURE.md, HALO_LOCAL_BRIDGE.md, HALO_BLOCKERS.md and HALO_TEST_REPORT.md. Verify branch/remote/history and rerun the existing baseline. Master M0–M2 are delivered; preserve their shared project store and Jarvis permission/approval/audit/recovery paths. The user selected Windows and authorized ordinary implementation plus scoped milestone commits/pushes with exact remote SHA verification. Build the optional secure Windows companion and additive Halo adapter: loopback pairing, revocable scoped grants, truthful device/process/audio-device status, approved filesystem access and discovered allowlisted app launch. Start with actual pairing/status/revoke, test each increment, then complete the full M3 acceptance gate. No arbitrary shell API, wildcard CORS, public OS access, fabricated telemetry, credentials in source or direct World privileged actions. High-impact actions require explicit approval. All Windows hardware/API claims require actual local execution. Run core/Jarvis/World regression tests. Do not begin M4 until M3 is fully validated, committed, pushed and remotely verified; do not deploy or merge into main.

## Baseline commands

```powershell
npm test
npm run check
node scripts/check-world.mjs
node scripts/test-world.cjs tests/master-core-browser.cjs tests/master-jarvis-browser.cjs tests/browser.cjs tests/integration-browser.cjs tests/world-browser.cjs tests/world-session-browser.cjs tests/world-lifecycle-browser.cjs tests/world-workstation-browser.cjs
```

Expected committed Node tests: 31, not 35. Four extra tests belonged to an uncommitted cloud Desktop design preview; they are not prerequisites for the committed app and were deliberately not pushed. Browser checks were executed under Linux Chromium; Windows results must be recorded afresh. No build/lint scripts currently exist.
# Jarvis conversation streamline — October 18, 2026

The canonical checkout adds inline proposal review, stream/Stop, checked local-service states and a visible project selector. Build the local launcher with `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-launcher.ps1 -OutputName Halo-Jarvis-Streamlined.exe`. Ollama `qwen3:4b` and `qwen3:0.6b` are installed on this PC; Voicebox remains optional. The source and branch status in this handoff must always be verified with Git on resume. This interface increment does not satisfy M7 Live Listen audio acceptance.
