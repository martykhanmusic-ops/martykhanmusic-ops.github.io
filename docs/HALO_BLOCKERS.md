# Risk and blocker register

| ID | Risk / current evidence | Mitigation / smallest next action |
|---|---|---|
| R1 | Unapproved Desktop preview is mixed with tracked files | Preserve unstaged; stage exact milestone paths; validate committed snapshot independently |
| R2 | Browser-local, unencrypted, quota-limited data; no cross-device sync | Export backups; keep current origin; never silently migrate or clear |
| R3 | Stale-disk comparison is not atomic cross-tab locking | Reject detected stale writes; avoid concurrent editing; test preservation |
| R4 | Reload loses unsaved drafts | Explicit Save and unload/navigation warnings; same DOM preserved only during mode switching |
| R5 | World hardware validation limited to Chromium/software WebGL | Default off, low-performance/context-loss fallback; test real GPUs before broader release |
| R6 | Historical SPRINT.md has old no-push statements | Historical records describe then-current authorization; master remote receipts supersede them |
| R7 | M3 capability set is incomplete | Pair/device/revoke is verified on Windows; filesystem, app, process and audio increments still require implementation and target-computer tests; do not advance to M4 |
| R8 | No actual DAW, plugin build environment or real mobile audio target | Required at M7; no simulated latency accepted |
| R9 | No approved permanent redesign or World expansion | Visual review required at M5 and before expanded World art |
| R10 | No lint/build scripts, other-browser or assistive-technology validation | Report unavailable checks explicitly; syntax/Chromium are limited evidence |

No credential contents are recorded. No production deployment, protected-main merge, account creation, paid service or AI provider is authorized. Blocked milestones must stop sequencing; upcoming risks are not evidence their milestones passed.

## Active M3 work — master M3

M0–M2 remote payloads were verified and the first M3 slice is now pushed. The Windows companion binds to loopback, enforces exact Host/Origin checks, pairs with a one-time six-digit code, returns live `node:os` device data after an expiring bearer session, and revokes the session. The remaining M3 OS capabilities are not yet implemented or accepted.

Remaining action: implement and test scoped filesystem grants, allowlisted app discovery/launch, process status, audio-device discovery, and absent/revoked/recovery browser states. No server credentials or public OS-control endpoint should be supplied. Safe action taken: preserve the foundation and keep M4 stopped. User data was not accessed or migrated.
