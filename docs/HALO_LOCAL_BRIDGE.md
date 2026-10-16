# Local computer bridge — Windows implementation

Status: COMPLETE_AND_PUSHED after target Windows validation. Initial pairing slice was pushed in 3753bfe372bc0701db54e31e66e0fd2af92ff729. Remaining scoped operations are implemented in `companion/windows.mjs` and exposed only through the local authenticated service. Final payload and exact remote receipt are recorded in HALO_MILESTONE_STATUS.md.

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

## Implemented contract

`node companion/server.mjs` binds only `127.0.0.1:4174`, accepts the exact
`Host: 127.0.0.1:4174` and `Origin: http://localhost:4173`, and never sends
wildcard CORS. A six digit code printed in the local terminal creates one
256-bit bearer session in memory. Five failed codes impose a one minute lock.
The session expires within eight hours; revoke invalidates it and rotates the
code. Stopping the process clears all credentials. The browser stores the token
only in sessionStorage so reopening a browser session requires pairing again.

The operator chooses grants at startup: `--root` for one absolute read-only
folder, repeated `--app` values for exact Start Menu shortcut names,
`--processes`, and `--audio`. Nothing is granted by default. Halo can revoke
each grant for the running process and cannot re-enable it. File operations
resolve the canonical target on each request, reject escapes and symlink
escapes, cap text reads at 64 KB, and never write. Application discovery
returns only allowed shortcuts. A launch requires an additional single-use code
shown only in the local terminal, bound to one app and valid for one minute.
The launcher uses a fixed PowerShell script with a path argument, not a shell
command supplied by the browser. Process and audio endpoint lists come from
Windows system queries. Every result includes a verification timestamp.
Recent operations and denials appear in the in-process audit panel; this is
not durable history and is cleared on restart. Halo's projects, notes, tasks,
Jarvis plans and approvals remain solely in the existing workspace store.
World retains the same mounted shell and no companion command path is added to
World or Jarvis adapters.

Limits: the service is intentionally restricted to the local development
origin. A deployed site and other devices cannot pair with it. Audio status is
the Windows PnP endpoint status, which may report `Unknown`; it is not an
active signal or latency measurement. The file path check is revalidated for
each request, but a different local process with write access to the granted
folder could race a file replacement between validation and open. Use a folder
you trust. These limits do not claim DAW control or M7 Live Listen.
