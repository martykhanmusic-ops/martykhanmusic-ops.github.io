# Halo lobby directive: sequential acceptance tracker

Updated October 18, 2026. This tracks the user-supplied Halo Lobby / Jarvis / Saturn Portals directive separately from the existing master M0–M12 roadmap. The directive's older 16-test and commit references are historical. The canonical editable checkout is `C:\Users\owner\_Code\halo-jarvis-foundation`, branch `feature/halo-jarvis-foundation`. Preserve the unrelated untracked `halo-companion-mock.png`.

| Directive milestone | Current state | Acceptance boundary |
| --- | --- | --- |
| A Audit | Complete after the baseline and remote receipt recorded below | Source, Git, dependencies, shared-state integration and gaps verified |
| B Playable Lobby | Complete after remote receipt below | Existing single controller gains the requested controls and movement/camera/collision behavior; desktop/mobile fallback and core regression pass |
| C Jarvis Center | Complete after remote receipt below | Central World orb invokes the real Jarvis surface, with explicit interaction states and existing approvals |
| D Saturn Doorways | Complete; remote SHA `cb53c1f754e39688ac137a6f03c6e677d28ad8e3` verified | One shared registry drives stationary walk-through World doorways and Desktop ring, with truthful route states |
| E Application Integration | Implemented; remote receipt pending | Available portals reach real registered Halo applications; unavailable entries remain visibly unavailable |
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

## B — playable lobby implementation

- Reused the existing default-off plaza, single avatar controller, local Three.js scene, collision obstacles, performance monitor, project pavilion, session bridge and Desktop fallback.
- Arrow Up/Down now move relative to avatar heading and Left/Right turn. W/S move and A/D strafe; Shift runs. Movement accelerates and decelerates, normalizes diagonals, clamps frame gaps, slides against axis-separated obstacles and stays inside the plaza boundary. Space gives a gravity-bound jump with ground landing and one jump per press.
- The same low-poly avatar now animates its limbs while walking/running and follows heading/vertical motion. Camera follows the avatar, can orbit by pointer dragging on the canvas, and shortens its distance when a scene obstacle lies on the camera ray. Escape pauses/resumes or closes a World interaction overlay. Keyboard capture remains on the World root and ignores form controls.
- Focused checks: `npm test` 55/55, World syntax check, existing World M1–M4 Chromium scenarios, and new `tests/world-lobby-browser.cjs` for arrow turning, forward movement, jump/land, camera drag, Escape pause and Desktop return passed. The Windows launcher compiled to ignored `dist/Halo-Playable-Lobby.exe`; exact runtime execution of that new EXE has not been observed.
- Full regression passed master core/Jarvis, browser/integration, framework, World M1–M4 plus new lobby, music library/DAW, Jarvis capability/streamlining and axe/keyboard/forced-colors/reduced-motion accessibility at supported desktop/mobile widths. The World remains desktop-only by design; mobile retained a tested Desktop fallback.
- Milestone B covers the playable plaza and controller. Central Jarvis, physical Saturn doorways, destination integration, expanded accessibility and final art remain C–G. Mobile intentionally retains the existing Desktop fallback until an accessible mobile World controller is delivered in F.

## C — Jarvis center implementation

- The existing World scene now has one central dark reflective orb, blue-white core, gold orbit and accessible projected interaction target. Its label and emissive color express recorded idle, nearby, executing, waiting-for-approval, completed and recent error states. It uses the existing session snapshot; no separate Jarvis engine or response source was created.
- Approaching the orb and pressing E, or clicking its visible target, opens the original Jarvis route and preserves World position for a later return. The ordinary Desktop Jarvis orb now labels listening, thinking, responding, planning, executing, waiting, completed and error based on actual Voicebox, Ollama, proposal and job events. Existing plans, permissions, deletion approvals, history and recovery remain authoritative.
- Focused Windows Chromium checks passed central-orb proximity/E, click and real Jarvis navigation with zero jobs, plus bounded chat draft and Voicebox scenarios at desktop/mobile widths. World mobile fallback remains Desktop.
- World does not claim an active microphone/model state while its Jarvis UI is closed; only recorded jobs and proximity are represented there. A configurable global shortcut is deferred to the controls/accessibility milestone F. Saturn portal ring and other destinations remain D–E.
- Full regression passed master core/Jarvis, browser/integration, framework, World M1–M4 plus lobby/Jarvis, music library/DAW, Jarvis capability/streamlining/Voicebox and accessibility checks at supported desktop/mobile widths. `dist/Halo-Jarvis-Center.exe` compiled on Windows; launching this exact EXE remains unverified under the earlier automatic command-policy restriction.

## D — Saturn portal implementation

- A single eight-entry destination registry now supplies the Desktop Saturn ring and World doorway labels, icons, preview text, availability and routes. Projects opens the existing saved project route; Music Shelf, Creative, Halo World, Games Hub, Research, Tidy Coach and More are visibly planned until an application route is integrated and verified. Planned entries never claim an app opened.
- Desktop Jarvis gains a focusable ring with contextual caption, keyboard arrow/Enter, focused wheel, hover, click/tap and touch swipe selection. World renders stationary pillar/lintel doorways with destination preview surfaces; proximity/E and walking through a doorway use the same interaction handler. A small explicit state machine records near, preview, requested, transitioning, open and returning states and rejects duplicate requests.
- Focused Windows Chrome tests passed the ring, real Projects route, planned-portal status, World interaction and the existing M2–M4 session/workstation journeys. Full core/Jarvis/browser/integration/World M1–M4/lobby/Jarvis/Saturn/accessibility browser suite passed at supported widths, including axe, forced colors and reduced motion. Node tests are 56/56 after the new portal state test; syntax and World checks passed.
- E must connect additional portals only after their real application routes and shared-state journeys are verified. The World doorway preview is a stylized destination surface, not a live camera into an app environment. The exact Windows EXE runtime remains unverified until launch can be observed.

## E — application integration

- Music Shelf is now an available, registered Halo application whose route opens the existing active project's music library and approved DAW links. Desktop ring and World doorway resolve through the same destination and route. With no active project the route opens the existing project overview so the user can create or choose one. No music data is copied to an app store.
- The application session bridge retains dirty navigation guards, active project identity, and the canonical `halo.workspace.v1` notes/music data. Music Shelf's application registry lifecycle records its open event after successful navigation. The other six unbuilt destinations remain visibly planned with no app opened.
- A new browser journey verifies Desktop ring → music library → World → Music doorway → music library with the same saved project ID and notes, focus on the real music browse control, and an active application record. Node framework tests verify the registered app count. Broad regression and remote receipt are pending in this entry.
