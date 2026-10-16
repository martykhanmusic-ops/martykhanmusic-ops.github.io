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

Master M4 application framework was completed and pushed on the development branch (payload f5a93fbcc39511ca002c33493544e155caad6ccc). Verify the current milestone status before starting later work. Master M5 visual approval remains pending. Do not merge into main or deploy based on this roadmap.

## Prompt for a new chat

> Resume my build. First read this repository's `docs/CODEX_MEMORY_ROADMAP.md`. If you can access my Windows PC, also read `%USERPROFILE%\_Code\CODEX_MEMORY_ROADMAP.md` and open the canonical project folder. Verify Git branch, remote, commits, uncommitted changes, and current status files before editing. Preserve existing work. If you cannot access the PC, say so and use the verified remote branch or files I provide.

