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
| R9 | M5 appearance package and targeted accessibility review are implemented; expanded World art is separate future work | Keep World expansion behind its own design review; do not treat automated axe checks as a screen-reader certification |
| R10 | No lint/build scripts, other-browser or assistive-technology validation | Report unavailable checks explicitly; syntax/Chromium are limited evidence |
| R11 | Local Voicebox models are stored outside Halo and can take time to download on a new PC; this PC completed Whisper base and Kokoro checks | Start the local Voicebox backend and verify model readiness on each new machine; report failures honestly |
| R12 | RESOLVED October 18: Ollama 0.40.6 and qwen3:0.6b generated a real draft through Halo's launcher; browser verified review-only behavior | Recheck model availability on another PC or after reinstall; Jarvis remains usable when Ollama is unavailable |

No credential contents are recorded. No production deployment, protected-main merge, account creation, paid service or AI provider is authorized. Blocked milestones must stop sequencing; upcoming risks are not evidence their milestones passed.

Local reminder limit: the page must stay open for its 15-second due check and optional browser notification. Notification permission may be denied, and there is no Windows background scheduler or closed-app delivery. Due items remain visible when Halo is reopened. This is not M11 automation completion.

The supplied public-apis ZIP lacks its API catalog and endpoints. Bulk setup cannot be validated from it. MusicBrainz artist lookup is a separate fixed integration; it needs network access and the Windows system `curl.exe`. Provider outages and rate limits surface as errors. No external API is granted Jarvis actions or workspace writes.

## Master M3 blocker resolution

The prior cloud blocker was resolved by running Codex and the companion on the selected Windows computer. Node reported `win32`, Windows release `10.0.26200`, x64 and hostname `MKLAPTOP`. Live Windows queries returned process and audio endpoint entries. A folder grant listed and read a documentation file while rejecting `../README.md`; the explicitly allowlisted `File Explorer.lnk` was discovered and launched after the local one-time approval code. These are local observations, not simulated telemetry. No M4 work has started.

The companion cannot be paired from the deployed domain or a remote/mobile browser. Windows audio endpoint `Status` can be `Unknown` and is never interpreted as a working audio stream. File checks reject traversal and symlink escapes, but a local process with write access to the granted folder could race a replacement between validation and open. The recent companion audit is in memory and resets on restart. User data was not migrated.

## Master M6 library limits

The new library saves file references and metadata only. It cannot preserve the audio bytes in a Halo JSON backup; users must back up the approved music folder separately. Last verification is historical and recheck requires a currently paired companion with Files grant. Verified DAW launch requires local one-time code entry, and a specific DAW project folder remains to be selected. Live Listen remains a later milestone.

Approved-folder browsing reads one directory at a time and only the first 200 entries exposed by the companion. A larger directory may hide later files; a user can enter a relative path directly. Browsing does not index media contents or prove a file is linked until the separate stat and save succeed.

Ableton Live 12 Suite and FL Studio 2026 shortcut targets exist on this PC, and authenticated companion discovery returned both. A launch without the one-time local code returned HTTP 403. Actual DAW launch has not been performed: the user must run the companion visibly, request a code in Halo, enter that code and confirm each launch. Launching a DAW also does not verify that any particular music project file opens in it. M6 remains in progress.

Ableton `.als` project opening now has a file-bound approval path, but a physical Ableton project load has not been observed. The approved root must be the user's selected Ableton folder; the existing link must match its current file size and modification time. If files move or change, re-link them. A local process with write access to the approved folder could race a file replacement between final validation and DAW opening; the companion cannot make another application's file open atomic. FL Studio `.flp` project opening has not been implemented. M6 remains open.

## Master M4 limits

The framework catalog contains trusted local modules only. Its in-page grants are UI authorization, not an OS security boundary or third-party isolation. Extension code runs on the Halo origin; adding untrusted modules requires a sandbox design. Version incompatibility blocks opening until an explicit migration is built. Application metadata is browser-local and quota-limited; a corrupt value is preserved and Halo continues with transient registry state. No visual redesign, production deployment or external app provider is included.
