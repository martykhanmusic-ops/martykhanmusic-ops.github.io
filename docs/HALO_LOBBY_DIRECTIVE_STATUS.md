# Halo lobby directive: sequential acceptance tracker

Updated October 18, 2026. This tracks the user-supplied Halo Lobby / Jarvis / Saturn Portals directive separately from the existing master M0–M12 roadmap. The directive's older 16-test and commit references are historical. The canonical editable checkout is `C:\Users\owner\_Code\halo-jarvis-foundation`, branch `feature/halo-jarvis-foundation`. Preserve the unrelated untracked `halo-companion-mock.png`.

| Directive milestone | Current state | Acceptance boundary |
| --- | --- | --- |
| A Audit | Complete after the baseline and remote receipt recorded below | Source, Git, dependencies, shared-state integration and gaps verified |
| B Playable Lobby | In progress only after A remote verification | Existing single controller gains the requested controls and movement/camera/collision behavior; desktop/mobile fallback and core regression pass |
| C Jarvis Center | Not started | Central World orb invokes the real Jarvis surface, with explicit interaction states and existing approvals |
| D Saturn Doorways | Not started | One shared registry drives stationary walk-through World doorways and Desktop ring, with truthful route states |
| E Application Integration | Not started | Available portals reach real registered Halo applications; unavailable entries remain visibly unavailable |
| F Accessibility | Not started | Remappable persisted controls, presets, semantic destination alternative, keyboard/focus and applicable WCAG 2.2 AA checks |
| G Visual System | Not started | Nostalgic, warm, calm visual pass with saved token-based variants and measured performance |
| H Validation and Delivery | Not started | Full regression, measured performance, desktop/mobile/accessibility evidence, reviewed branch and remote receipt |

## A — verified audit and baseline

- Local source and global roadmap read. No `AGENTS.md` exists at the repository or checked ancestor locations; the user-provided local-source instructions apply. Git is on `feature/halo-jarvis-foundation` at `2faea3f5d21a1533fac0ff91f272a403d325b83b`, which matched `git ls-remote` at audit time. No tracked changes existed before this audit. The unrelated preview PNG remains untracked.
- Reviewed `README.md`, `package.json`, the existing master roadmap/status/test report, architecture and Windows handoff, World architecture, current World modules and tests. Static HTML/CSS/native ES modules are used; Three.js is vendored locally and loaded only after World opt-in. The optional Windows launcher/companion and Ollama/Voicebox are separate loopback processes.
- `halo/store.js` owns `halo.workspace.v1`; `halo/app.js` owns the one Desktop shell and Jarvis UI. `halo/world/WorldWorkstation.js` reparents that original shell. The World bridge offers snapshots/navigation only. Jarvis permissions, deletion approval, execution and audit remain in the original engine.
- Baseline run on this Windows PC: `npm test` **54/54**, `npm run check` passed, `node scripts/check-world.mjs` passed. `node scripts/test-world.cjs` with master core, master Jarvis, browser, integration, and World M1–M4 suites passed at their supported desktop/mobile widths. No new code was needed to establish A.
- Existing World foundation: default-off opt-in, low-poly plaza, avatar, absolute WASD/arrow translation, Shift speed, follow camera, obstacle limits, a Projects pavilion, proximity/E interaction, one-store workstation, graceful Desktop fallback and performance/context-loss recovery. It does not yet satisfy the new directive's relative forward/turn controls, jump, richer camera collision, central Jarvis interaction, stationary full-size portal ring, or customizable controls. Those are implementation acceptance criteria for B–F, not claims about the current build.

Milestone protocol: complete each row's work, run focused and ecosystem tests, review scoped changes, commit/push to the feature branch, verify exact remote SHA, and record the result here before claiming the next row complete. No main merge or deployment is authorized.
