# Halo master roadmap

Authoritative sequence adopted October 16, 2026. Halo is the hub; no new application may own a duplicate workspace database. Technical World M0–M4 in SPRINT.md are historical delivery stages, not master milestones 0–4.

| Master milestone | Required delivery and acceptance | Dependencies |
|---|---|---|
| 0 Audit/protection | Inventory, architecture/dependencies, baseline, issues, feature matrix, Git/recovery strategy and persistent tracker; preserve functionality | None |
| 1 Core stability | Projects, notes/tasks, search, navigation/session restore, backups, errors, responsive UI; create/save/close/reopen/resume verified | 0 |
| 2 Jarvis engine | Plans, queue/history, permissions/deletion approval, verified results, cancellation/retries/recovery/logs; supported authorized operations verified | 1 |
| 3 Local computer bridge | Optional authenticated least-privilege companion; approved filesystem, app discovery/launch, process/device/audio status, local transport and revocable grants; actual target computer verified | 2, target OS and local execution access |
| 4 Application framework | Registration/discovery, lifecycle, settings/themes/state/permissions/version compatibility; add app without unrelated core changes | 3 |
| 5 Design system | Themes/components/backgrounds/type/navigation/motion/accessibility, package preview/rollback; no data loss | 4, visual approval |
| 6 Music hub | Persistent audio/project resources, metadata/tags/samples/notes/tasks, verified DAW references/launch | 5 |
| 7 Live Listen | Actual VST3 capture, secure transport, QR rooms, mobile player/producer controls, Halo/World access; measured live DAW-to-device latency and stability | 6, DAW/plugin toolchain and devices |
| 8 Creative apps | Songwriting/improv/capture/lyrics/samples/content/video/podcast via shared framework; save/reopen verified | 7 |
| 9 Games | Register/launch/resume real games, settings, implemented multiplayer only | 8, game sources |
| 10 World | Avatar/camera/hub/portals/workstations/shared state and safe switching; expand existing technical implementation | 9, design approval for expansion |
| 11 Automation | Schedules/conditions/approved integrations, notifications, stop/recovery/history | 10 |
| 12 Hardening | Integration/accessibility/security/performance/persistence/audio/release validation; no release blockers | 11 |

Each stage: inspect → plan → implement → test → integrate → regression test → review → commit → push → verify → report. Stop at any failing gate. Three recorded passes: own acceptance, backward compatibility, ecosystem integration. Reuse already working implementations; do not rebuild to manufacture change.

Master M3 is being completed on the selected Windows computer. The optional
companion uses an in-memory session and scoped OS grants; it does not create a
second project store or grant World a privileged route. Windows execution and
browser regression evidence are in HALO_TEST_REPORT.md. M4 remains gated until
the final scoped push and exact remote SHA receipt are recorded.

Stage only scoped files on feature/halo-jarvis-foundation. Review cached diff, whitespace and secrets; descriptive commits; ordinary push to origin; verify exact branch SHA with git ls-remote. No force push, protected-main merge or deployment. Push receipts identify the delivered payload SHA; subsequent tracking commits record verified receipts (a commit cannot contain its own SHA). COMPLETE_AND_PUSHED requires an observed remote match, never just a local commit.

Use HALO_MILESTONE_STATUS.md to resume. Keep pending visual preview out of milestone commits until approved. No external AI or privileged integration is currently connected.
