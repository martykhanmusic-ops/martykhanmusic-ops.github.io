# Codex build recovery roadmap

This is the portable access point for resuming builds from another chat or device. It is an index, not a live status report. Verify the repository and files before making changes.

## Source location

- Canonical source on the owner's Windows PC: `%USERPROFILE%\_Code\<project-name>`.
- Halo checkout: `%USERPROFILE%\_Code\halo-jarvis-foundation`.
- Halo remote: `https://github.com/martykhanmusic-ops/martykhanmusic-ops.github.io.git`.
- Halo development branch: `feature/halo-jarvis-foundation`.
- Full local source-library index: `%USERPROFILE%\_Code\CODEX_MEMORY_ROADMAP.md`. This local index may contain newer project locations than this committed copy.

## Recovery sequence

1. Determine whether this chat has access to the owner's Windows PC. A cloud-only chat cannot read its local disk.
2. On that PC, read the local source-library index, then open the matching project checkout. If local access is unavailable, use only the verified remote branch and files the user provides.
3. Read project instructions, README, handoff and milestone status. For Halo, start with `docs/HALO_MILESTONE_STATUS.md`, `docs/HALO_MASTER_ROADMAP.md`, `docs/HALO_TEST_REPORT.md`, and `docs/HALO_WINDOWS_HANDOFF.md`.
4. Check `git remote -v`, the current branch, recent commits, `git status`, and the remote branch SHA. Preserve uncommitted files and changes.
5. Resume from current project status and the user's latest request. Do not infer that a milestone remains complete solely from this index.
6. Keep the final editable source in the canonical local project folder and report its absolute path. Update the local index and this portable copy when the access route changes.

Master M4 application framework was completed and pushed on the development branch (payload f5a93fbcc39511ca002c33493544e155caad6ccc). Master M5 orbital UI styling is in progress by user request; the style pass was pushed as 9b5ba1131e77c7a2f0bb1fbedea7aae3bd6c7ec4. Verify current status before later work. Do not merge into main or deploy based on this roadmap.

The Windows launcher source is `launcher/HaloLauncher.cs`, the build command is `scripts/build-launcher.ps1`, and the local generated executable is `dist/Halo.exe`. The executable is ignored by Git; rebuild it from the source after checkout. Verify its presence locally before promising it in another chat.

Jarvis voice box source is `halo/voicebox.js`. Its updated local executable is `dist/Halo-Voice.exe` on the owner's PC. It uses the sibling local Voicebox backend and a `Jarvis` preset profile created on that PC. Kokoro speech and Whisper base transcription of generated WAV audio were verified on October 17, 2026; physical microphone input still needs a user-device check. Close an older Halo.exe before launching Halo-Voice.exe on the same localhost port.

M5 appearance package preview is in `halo/visual-preview.js` and the Halo index dialog. Orbital/Classic preview, cancel/Escape rollback and apply/reload passed desktop/mobile browser tests October 17, 2026. Full accessibility review is still the M5 gate.
The latest locally packaged executable for this increment is `dist/Halo-Appearance.exe`. It includes the Voicebox integration. The previous `Halo-Voice.exe` was in use when packaging and was preserved. The newer executable served `visual-preview.js` successfully on the test port; close an older Halo launcher before using its default localhost:4173 port.
Optional local LLM draft source is `halo/local-llm.js` and the limited launcher proxy. No Ollama installation or model was found on this PC on October 17, 2026; browser fixture and parser tests do not establish real inference. The Jarvis form remains the only path to a plan, permission and execution.
October 18 update: Ollama 0.40.6 is installed and answers on 127.0.0.1:11434. `qwen3:0.6b` download is in progress; real inference still needs verification. Halo now requests JSON output and hides cloud-tagged models. Preserve the unrelated mock image.
Later October 18 verification: `qwen3:0.6b` completed and returned a real JSON task draft through `dist/Halo-Ollama.exe`; `tests/local-llm-live-browser.cjs` verified browser review without automatic plan/task creation. M5 accessibility remains open.
Jarvis chat source is in `halo/local-llm.js`, the shared workspace store and Halo launcher. `dist/Halo-Chat.exe` is the newer local build. It uses qwen3:0.6b, saves bounded conversation in the canonical backup, and was verified with a real local-model browser reply on October 18. M5 accessibility remains open.
Local reminders source is `halo/reminders.js` and the shared workspace store. They appear in Jarvis and the top bar, persist in backups, and can alert through browser notifications only while Halo is open. Check the live build and test report for packaging and push status before claiming completion.
Public music reference source is `halo/music-reference.js` and the fixed `/public-data/artists` launcher route. The supplied public-apis ZIP lacked a catalog; see `docs/PUBLIC_APIS_AUDIT.md`. Verify the current packaged executable and remote SHA before reporting completion.
The next public music reference increment adds fixed `/public-data/recordings` and `/public-data/releases` routes and a shared Overview selector. Live packaged Windows/browser searches returned all three resource types. The complete catalog is still missing; this does not start or complete master M6.
M5 targeted accessibility review: `tests/accessibility-browser.cjs` scans Orbital/Classic, dark/light, desktop/mobile routes/dialogs with axe and checks keyboard, forced colors and reduced motion. The brand link label was corrected. Verify the live M5 milestone status and remote SHA before starting master M6.
M5 acceptance payload d91c09dc716177c3bd22c54418ca8f75ff01a179 matched the remote feature branch. The local `dist/Halo-Design-System.exe` served the corrected page on localhost:4174. M5 is COMPLETE_AND_PUSHED; master M6 music hub is next.
The updated local executable containing this draft integration is `dist/Halo-Local-LLM.exe`. It was smoke-tested on localhost:4174; close an older Halo executable before opening the new one on the default localhost:4173 origin.

## Prompt for a new chat

October 18 Orbital reference refinement: user-supplied glass-planet image is
stored at `halo/assets/halo-orbit-reference.png`; CSS is in
`halo/visual-language.css`. Reproducible local desktop/mobile captures are in
`docs/previews/current/` with `scripts/capture-halo-current.cjs`. Classic
appearance and existing stores/permissions remain intact. Verify the latest
Git and launcher state before claiming delivery.

October 18 local 3DCodeVerse evaluation: source from the user ZIP is under
`C:\Users\owner\_Code\3dcodeverse`; Node runtime installed and an offline
music kiosk GLB exported under `halo-experiments/`. See
`docs/3DCODEVERSE_EVALUATION.md`. No Halo runtime integration or M10 start;
master M6 is still in progress. Verify the local folder in a Windows session.

> Resume my build. First read this repository's `docs/CODEX_MEMORY_ROADMAP.md`. If you can access my Windows PC, also read `%USERPROFILE%\_Code\CODEX_MEMORY_ROADMAP.md` and open the canonical project folder. Verify Git branch, remote, commits, uncommitted changes, and current status files before editing. Preserve existing work. If you cannot access the PC, say so and use the verified remote branch or files I provide.
