# Local computer bridge — proposed M3 boundary

Status: IN_PROGRESS. The first vertical slice is implemented and pushed in 3753bfe372bc0701db54e31e66e0fd2af92ff729: loopback pairing, live Windows device verification, and revocation. Filesystem/app/process/audio capabilities remain unimplemented; this document does not authorize unrestricted computer control or claim completion.

## Inspect and plan

Current Halo is a static browser application. The cloud workspace cannot supply verified telemetry from the user's computer. Target OS determines reliable application inventory, launch APIs and audio-device discovery; those are not interchangeable with cloud process output. Windows is selected and the user confirmed local Codex availability. Need the actual local session before verifying OS adapters, dependencies and packaging.

Proposed architecture: optional local companion, additive browser adapter and a Halo status/settings surface. Keep workspace/project/task/note/job ownership in the existing store; companion owns only local pairing/grants and operation audit. No new project database. Desktop, mobile and World remain functional when companion is absent. Mobile reports unavailable rather than fabricated hardware. World accesses the existing app surface and cannot call privileged endpoints directly.

Candidate security boundary to implement/test: loopback-only listener, strict accepted Host/Origin, explicit local pairing with non-URL credentials, scoped revocable grants, bounded request sizes and timeouts, no wildcard CORS, no arbitrary shell/eval. File grants must bind to user-selected roots and revalidate canonical paths/symlinks on every operation. Application launch uses discovered allowlisted identifiers and argument validation. Device/process read access must be opt-in. Do not place reusable secrets in source, query strings or public static assets. Jarvis must retain explicit planning/permissions/approval/audit rather than silently dispatch scene actions.

## Smallest real vertical slice

Pair local companion → display timestamped verified device status in Halo → revoke pairing → show disconnected/revoked state. Then add scoped filesystem and verified app discovery/launch, process status and audio-device discovery as separate tested increments within M3. Never interpret unavailable/unsupported results as success. No deletion or external communication adapter without the existing explicit approval boundary.

## Acceptance evidence required before completion

1. Unit/integration tests for origin/host/auth denial, expiration/revocation, scoped path escape/symlink rejection, command/argument restrictions, malformed requests and failure recovery.
2. Actual target-computer tests for device/process/audio enumeration and an explicitly selected safe application launch; report OS and supported limitations.
3. Desktop/mobile Chromium: companion absent/pair/connect/revoke/reconnect, truthful status, shared persistence unchanged, Jarvis permissions and World fallback intact.
4. Original baseline and integration suites remain green; no secrets in staged files; document local installation/run/stop/uninstall and grant removal.
5. Review, commit, ordinary development-branch push and exact remote SHA verification. If actual target validation is unavailable remain BLOCKED, not COMPLETE_AND_PUSHED.

The pairing adapter and device status UI are delivered; filesystem grants, application discovery/launch, process/audio status, and the full M3 acceptance gate remain outstanding. M4 cannot start until M3 meets its gate.
