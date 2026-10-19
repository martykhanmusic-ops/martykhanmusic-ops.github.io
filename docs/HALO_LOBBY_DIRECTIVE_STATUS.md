# Halo lobby directive: sequential acceptance tracker

Updated October 18, 2026. This tracks the user-supplied Halo Lobby / Jarvis / Saturn Portals directive separately from the existing master M0–M12 roadmap. The directive's older 16-test and commit references are historical. The canonical editable checkout is `C:\Users\owner\_Code\halo-jarvis-foundation`, branch `feature/halo-jarvis-foundation`. Preserve the unrelated untracked `halo-companion-mock.png`.

| Directive milestone | Current state | Acceptance boundary |
| --- | --- | --- |
| A Audit | Complete after the baseline and remote receipt recorded below | Source, Git, dependencies, shared-state integration and gaps verified |
| B Playable Lobby | Complete after remote receipt below | Existing single controller gains the requested controls and movement/camera/collision behavior; desktop/mobile fallback and core regression pass |
| C Jarvis Center | Complete after remote receipt below | Central World orb invokes the real Jarvis surface, with explicit interaction states and existing approvals |
| D Saturn Doorways | Complete; remote SHA `cb53c1f754e39688ac137a6f03c6e677d28ad8e3` verified | One shared registry drives stationary walk-through World doorways and Desktop ring, with truthful route states |
| E Application Integration | Complete; remote SHA `26803e3137c506f730ad7d7fe356afccb058a1ba` verified | Available portals reach real registered Halo applications; unavailable entries remain visibly unavailable |
| F Accessibility | Complete; remote SHA `15dc4c73263807f426b9dfc4e4adeffbd2839814` verified | Remappable persisted controls, presets, touch/gamepad paths, semantic destination alternative and applicable WCAG 2.2 AA checks |
| G Visual System | Complete; remote SHA `60b223edc6719cfe18a6d688155a809d4c10bbb8` verified | Nostalgic, warm, calm visual pass with saved token-based variants and measured performance |
| H Validation and Delivery | Automated checks and packaging complete; manual runtime/device checks pending | Full regression, measured performance, desktop/mobile/accessibility evidence, reviewed branch and remote receipt |

Post-H lobby infrastructure work follows the user's October 19 direction to
table Live Listen. The Creative slot now opens the canonical project's existing
working session as **Creative Sessions** from Desktop and World. This adds no
separate creative application or store; master M8 remains unopened. Games and
other unimplemented portals stay planned. Focused desktop/mobile and full
regression evidence is in `HALO_TEST_REPORT.md`; H manual device/exact-EXE
checks remain outstanding.

Creative Sessions payload `9b96a44d0057f18c236935fe0cff723b941c6fb8`
matched the remote feature branch. A source-matched committed-snapshot launcher
was built at `dist/Halo-Lobby-Creative.exe` (2,698,240 bytes; SHA-256
`2C77C291F91D9964C1AD0FBCBBD2FFD4220201A69DCF9D916B18375F84C35B61`).
Its 52 embedded site entries include the Creative Sessions destination. This
checks packaging, not startup of the exact executable; a prior automatic
command-policy review blocked launching an executable, so the manual H gate
remains open.

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
- A new browser journey verifies Desktop ring → music library → World → Music doorway → music library with the same saved project ID and notes, focus on the real music browse control, and an active application record. Node framework tests verify the registered app count. Broad regression passed and the remote receipt is recorded in the milestone table.

## F — controls and destination access, first slice

- World controls now have a separate validated local settings record, with unique-key conflict detection, Standard/Arrow/One-Handed presets, individual remapping, speed/turn/camera sensitivity, horizontal camera inversion, reduced-motion setting and reset. The same controller maps physical keys to its existing movement actions; no second avatar controller or project store was added.
- Controls & Accessibility opens from Desktop and World. World provides a semantic, keyboard-operable eight-destination list that opens the same real or planned interaction panels without requiring 3D movement. The modal closes with focus restored to World or its Desktop launcher.
- Node tests are 57/57. Focused Chrome tests passed remap/save/reset, 2D list, truthful planned status, World movement, project continuity, Desktop return, plus desktop/mobile axe/keyboard/forced-colors/reduced-motion checks and core/Jarvis/portal regressions.
- F remains open: toggle/automatic movement, click-to-move, gamepad, mobile virtual joystick, touchscreen placement, broader visual/hearing/cognitive controls and a full WCAG 2.2 AA review have not been implemented or verified. Mobile continues to use the tested Desktop fallback. Do not begin G based on this slice. The first F slice was remotely verified at `e410971f212a107e8d3c44b314640c842151e5b4`.
- The current source compiled into ignored `dist/Halo-Lobby-Controls.exe` on Windows (2,684,416 bytes); launching that exact binary remains unverified.

## F — accessibility completion pass

- Expanded the validated local controls record with left/right one-handed keys, toggle run, auto-walk/auto-run, acceleration, click-to-move, fixed camera/FOV, reduced glare, text/caption size, high contrast, simplified HUD, hints and optional portal confirmation. Accessibility presets (Standard, Reduced Motion, One-Handed, High Visibility and Simplified Navigation) stay editable; individual key and setting resets are available. A legacy settings record lacking the new Jarvis shortcut is migrated without losing a one-handed binding.
- Added an opt-in mobile World joystick with repositionable left/right control group, jump/run/interact buttons, and the original default Desktop fallback. Browser gamepad axes and button mapping use the same avatar controller. The 2D destination list and a separate Jarvis shortcut remain available without spatial movement. Jarvis voice has separate saved Voicebox/browser-speech playback volumes, visible transcript text and adjustable transcript size; microphone use is optional.
- Full baseline/core/Jarvis/framework/World M1–M4/lobby/browser and Desktop/mobile accessibility regression passed after the fixes, including a new World axe WCAG 2.2 AA scan of plaza, portal interaction and settings at desktop and mobile widths. Focused Chrome tests passed touch movement, gamepad mapping, click-to-move, saved controls and World/Jarvis continuity. The desktop/mobile tests emulate touch and gamepad input; no physical gamepad or touchscreen hardware was available for a hardware claim. WCAG automation is not a certification or a substitute for manual assistive-technology testing.

## G — visual system

- F remote receipt verified: `15dc4c73263807f426b9dfc4e4adeffbd2839814`.
- Added data-only appearance tokens for backgrounds, system typography, component styling, icon sets, portal outlines, lighting, motion and environment palettes. Existing warm Orbital artwork remains the default. Up to twelve named combinations, JSON download/import, preview, Apply and Escape rollback are available in Appearance. Imported files cannot supply CSS, URLs or JavaScript. Corrupt stored appearance data is preserved and downloadable for recovery.
- World reads the same lighting/environment/motion choices at entry. Geometry and unchanged materials are reused; orb and portal preview materials remain isolated. Saved rendering quality caps pixel ratio between 0.5 and 1.5. Existing reduced effects and Desktop fallback remain available.
- Tests: 58 Node tests, syntax/World checks, theme import/export/persistence/workspace-isolation journeys at 1440/390px, existing appearance tests, light/dark paper/night and expanded-dialog axe checks passed. Core/Jarvis desktop/mobile and World lifecycle regression passed in the delivery run. A 120-frame Windows Chrome SwiftShader sample averaged 47.9 ms (p95 97.2 ms); this is software rendering evidence, not a hardware FPS guarantee.
- Theme controls select reviewed local styles; typography uses system fonts, environment presets change palettes, and portal outlines customize the Desktop ring. No downloaded executable themes or new application databases were introduced.

## H — validation and delivery

- Automated delivery validation completed on this Windows PC. All core/Jarvis, browser/integration/framework, World M1–M4, lobby/orb/portal/music continuity, touch/gamepad/click movement, accessibility, theme, chat/voice, reviewed capability/streaming, music library/DAW/project, reminders, creative-session and local-model/reference UI suites passed. Companion integration separately passed against actual Windows APIs. Voice/model/DAW UI regression uses controlled adapters; it is not a new physical microphone, live inference or DAW-window claim.
- The final World sample measured 120 frames at 26.885 ms mean and 34.7 ms p95 using Windows Chrome SwiftShader, with 104 draw calls, 19 geometries and 5,912 triangles. Hardware FPS is unclaimed. Render quality and Desktop fallback remain user-accessible.
- Local executable: `C:\Users\owner\_Code\halo-jarvis-foundation\dist\Halo-Lobby.exe` (2,693,120 bytes). All 44 embedded site files matched the source. Exact runtime startup remains unverified following the earlier automatic command-policy rejection of executable launching. The smallest manual check is to close an old Halo server and open this executable.
- Physical gamepad/touchscreen and manual screen-reader review remain unverified. Planned portals remain visibly planned; master M7 Live Listen is a separate unfinished project phase. The source and automated Lobby work are delivered; these external/manual checks are not claimed complete.
