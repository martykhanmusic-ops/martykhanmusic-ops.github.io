# Risk and blocker register

| ID | Risk / current evidence | Mitigation / smallest next action |
|---|---|---|
| R1 | Unapproved Desktop preview is mixed with tracked files | Preserve unstaged; stage exact milestone paths; validate committed snapshot independently |
| R2 | Browser-local, unencrypted, quota-limited data; no cross-device sync | Export backups; keep current origin; never silently migrate or clear |
| R3 | Stale-disk comparison is not atomic cross-tab locking | Reject detected stale writes; avoid concurrent editing; test preservation |
| R4 | Reload loses unsaved drafts | Explicit Save and unload/navigation warnings; same DOM preserved only during mode switching |
| R5 | World hardware validation limited to Chromium/software WebGL | Default off, low-performance/context-loss fallback; test real GPUs before broader release |
| R6 | Historical SPRINT.md has old no-push statements | Historical records describe then-current authorization; master remote receipts supersede them |
| R7 | Companion cannot be verified on user's actual computer in this cloud workspace | At master M3 obtain target OS and local companion execution/testing access; do not invent device telemetry or expose OS control publicly |
| R8 | No actual DAW, plugin build environment or real mobile audio target | Required at M7; no simulated latency accepted |
| R9 | No approved permanent redesign or World expansion | Visual review required at M5 and before expanded World art |
| R10 | No lint/build scripts, other-browser or assistive-technology validation | Report unavailable checks explicitly; syntax/Chromium are limited evidence |

No credential contents are recorded. No production deployment, protected-main merge, account creation, paid service or AI provider is authorized. Blocked milestones must stop sequencing; upcoming risks are not evidence their milestones passed.

## Active blocker — master M3

M0–M2 remote payloads were verified; sequence is now stopped at M3. Repository search found no companion implementation, OS bridge endpoint, filesystem grants or audio-device service. `uname -srm` reports Linux 6.18.44 x86_64 for the cloud workspace only. Available execution tools do not provide a session on the user's computer. Windows is now explicitly selected; the user confirmed local Codex is available. This session still has no execution access to that computer.

Remaining action: open the repository in Codex on Windows using HALO_WINDOWS_HANDOFF.md. This is required for actual app/process/audio-device validation, not permission to perform already-authorized ordinary coding. No server credentials or public OS-control endpoint should be supplied. Safe action taken: preserve foundation, document proposed boundary, avoid introducing a simulated bridge, and stop before M4. User data was not accessed or migrated.
