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

Master M3 was completed on the selected Windows computer. The optional
companion uses an in-memory session and scoped OS grants; it does not create a
second project store or grant World a privileged route. Windows execution and
browser regression evidence are in HALO_TEST_REPORT.md. The final scoped push
and exact remote SHA receipt were recorded before M3 was marked complete. M4
was not started as part of this work.

Stage only scoped files on feature/halo-jarvis-foundation. Review cached diff, whitespace and secrets; descriptive commits; ordinary push to origin; verify exact branch SHA with git ls-remote. No force push, protected-main merge or deployment. Push receipts identify the delivered payload SHA; subsequent tracking commits record verified receipts (a commit cannot contain its own SHA). COMPLETE_AND_PUSHED requires an observed remote match, never just a local commit.

Use HALO_MILESTONE_STATUS.md to resume. Keep pending visual preview out of milestone commits until approved. No external AI or privileged integration is currently connected.

Master M4 application framework delivered on October 16, 2026. The trusted catalog, app lifecycle, scoped grants, per-app state/settings/themes and compatibility checks were validated with 43 Node tests, focused desktop/mobile browser tests and the eight-suite regression. Payload f5a93fbcc39511ca002c33493544e155caad6ccc matched `git ls-remote` for the feature branch. M5 remains pending visual approval.

Master M5 has begun by direct user request to fit the UI to Halo's visual language. The first CSS-only increment keeps the existing shell and data model, unifies dark/light orbital styling and passes desktop/mobile visual inspection and regression. Package preview/rollback and full accessibility review remain before M5 completion; M6 has not begun.

Master M5 later completed and was remotely verified; see milestone status. M6 has started with the user-directed library-first slice: verified Windows file references, metadata/tags/notes and shared project review tasks. DAW selection, approved launch, and remaining music-hub acceptance are pending. Do not begin M7 until M6 is complete and remotely verified.

M6 library follow-up adds one-directory-at-a-time selection from the companion's approved root. It keeps the explicit verify-and-link step. DAW launch remains gated on a selected shortcut and project folder.

The user selected Ableton Live 12 Suite and FL Studio 2026. Both installed Windows shortcut targets were found, and the companion returned them when exactly allowlisted. The project DAW panel now uses the existing one-time approval protocol. Physical launch and opening a verified project file remain M6 acceptance work.

The next M6 slice binds a linked Ableton `.als` reference to a separate one-time code and rechecks the approved Windows file before asking Ableton to open it. The first approved root is the user's Ableton projects folder. Physical load verification and FL Studio `.flp` support remain open; M7 is still gated.

The following M6 slice extends the same exact-file approval to selected FL Studio 2026 `.flp` projects under a separately chosen approved root. Browser and Windows rejection tests cover both DAWs. Physical DAW window and file load checks remain; M7 stays gated.

On October 18, the first live M6 DAW journey completed with a user-selected Ableton `.als` template. The browser linked current file metadata, requested a file-bound code, and the companion asked the allowlisted Ableton shortcut to open that exact path. Windows reported the new Ableton process with the file path as its argument and a responsive main window; the user confirmed the template's content loaded. This satisfies the first verified DAW reference/launch acceptance. Finish the scoped regression and exact remote receipt before starting M7. FL Studio's implemented path remains separately available, with physical FL loading unclaimed.

M6 acceptance and status receipt were remotely verified. M7 has started with a Windows-built VST3 stereo pass-through foundation under `live-listen/`. The official SDK validator passed 47 checks. It does not capture, send or play audio yet. Next increments must add a bounded real-time-safe capture path, authenticated loopback relay and revocable room grants before producer/mobile controls and measured Ableton-to-device latency.

Lobby directive delivery is tracked separately in HALO_LOBBY_DIRECTIVE_STATUS.md. F controls/accessibility and G local visual system are implemented and remotely verified; H records the final regression, performance and executable packaging evidence. This does not close master M7 Live Listen or turn planned portal destinations into implemented applications.
