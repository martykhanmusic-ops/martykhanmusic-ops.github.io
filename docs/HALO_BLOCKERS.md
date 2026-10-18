# Risk and blocker register

| ID | Risk / current evidence | Mitigation / smallest next action |
|---|---|---|
| R1 | Unapproved Desktop preview is mixed with tracked files | Preserve unstaged; stage exact milestone paths; validate committed snapshot independently |
| R2 | Browser-local, unencrypted, quota-limited data; no cross-device sync | Export backups; keep current origin; never silently migrate or clear |
| R3 | Stale-disk comparison is not atomic cross-tab locking | Reject detected stale writes; avoid concurrent editing; test preservation |
| R4 | Reload loses unsaved drafts | Explicit Save and unload/navigation warnings; same DOM preserved only during mode switching |
| R5 | World hardware validation limited to Chromium/software WebGL | Default off, low-performance/context-loss fallback; test real GPUs before broader release |
| R6 | Historical SPRINT.md has old no-push statements | Historical records describe then-current authorization; master remote receipts supersede them |
| R7 | Windows companion is restricted to the local development origin | Keep this scope explicit; a deployed or remote bridge needs its own security design and approval |
| R8 | No actual DAW, plugin build environment or real mobile audio target | Required at M7; no simulated latency accepted |
| R9 | User requested the Halo visual language for the UI; the initial style pass is implemented, but a full design package and expanded World art remain | Review the M5 package/rollback and accessibility before milestone completion; separately approve expanded World art |
| R10 | No lint/build scripts, other-browser or assistive-technology validation | Report unavailable checks explicitly; syntax/Chromium are limited evidence |
| R11 | Local Voicebox models are stored outside Halo and can take time to download on a new PC; this PC completed Whisper base and Kokoro checks | Start the local Voicebox backend and verify model readiness on each new machine; report failures honestly |

No credential contents are recorded. No production deployment, protected-main merge, account creation, paid service or AI provider is authorized. Blocked milestones must stop sequencing; upcoming risks are not evidence their milestones passed.

## Master M3 blocker resolution

The prior cloud blocker was resolved by running Codex and the companion on the selected Windows computer. Node reported `win32`, Windows release `10.0.26200`, x64 and hostname `MKLAPTOP`. Live Windows queries returned process and audio endpoint entries. A folder grant listed and read a documentation file while rejecting `../README.md`; the explicitly allowlisted `File Explorer.lnk` was discovered and launched after the local one-time approval code. These are local observations, not simulated telemetry. No M4 work has started.

The companion cannot be paired from the deployed domain or a remote/mobile browser. Windows audio endpoint `Status` can be `Unknown` and is never interpreted as a working audio stream. File checks reject traversal and symlink escapes, but a local process with write access to the granted folder could race a replacement between validation and open. The recent companion audit is in memory and resets on restart. User data was not migrated.

## Master M4 limits

The framework catalog contains trusted local modules only. Its in-page grants are UI authorization, not an OS security boundary or third-party isolation. Extension code runs on the Halo origin; adding untrusted modules requires a sandbox design. Version incompatibility blocks opening until an explicit migration is built. Application metadata is browser-local and quota-limited; a corrupt value is preserved and Halo continues with transient registry state. No visual redesign, production deployment or external app provider is included.
