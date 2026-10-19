# Halo Live Listen VST3 foundation

Current verification and remaining work: [resume status](../docs/HALO_LIVE_LISTEN_STATUS.md).

This Windows VST3 is a stereo pass-through processor with a bounded local capture handoff. The audio callback copies incoming 32-bit or 64-bit samples into a fixed two-second, single-producer/single-consumer float ring without allocation or locking, while preserving the direct pass-through output. A relay consumer, authenticated transport, room, mobile client, and telemetry are not implemented yet. M7 remains in progress.

Build with Visual Studio 2022 Build Tools, CMake, and a local recursive checkout of the [Steinberg VST3 SDK](https://github.com/steinbergmedia/vst3sdk). The SDK is kept outside this repository; set `HALO_VST3_SDK` to its absolute path. CMake disables global VST3 plugin links, so builds do not install into Ableton automatically.

```powershell
$cmake = 'C:\Users\owner\Documents\Codex\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe'
& $cmake -S live-listen -B dist/live-listen-build -G 'Visual Studio 17 2022' -A x64 -DHALO_VST3_SDK='C:\Users\owner\_Code\vst3sdk'
& $cmake --build dist/live-listen-build --config Release --target HaloLiveListen
```

The SDK is MIT licensed; retain its copyright and permission notice when distributing a binary containing its code. Do not describe this foundation as a working live stream. The ring is an internal foundation boundary, not a user-visible capture or streaming feature.

## Capture lifecycle increment

Local capture is now off by default. The generic host parameter `Local capture (no stream)` enables or disables copying at an audio-block boundary. Processing restart and sample-rate setup disable capture until another host enable event; no saved authorization or room state is restored. Frames carry sample rate and sequence numbers so a future consumer can detect overflow gaps. The audio-thread session counts rejected frames. A future consumer must discard queued audio on revocation; no consumer or delivery path exists yet. The fixed capacity is 96,000 frames (two seconds only at 48 kHz), not an adaptive duration.

Windows build: VST3 validator 47 passed/0 failed; CTest passed default-off, invalid-rate rejection, enable/disable, overflow gap/sample-rate metadata, FIFO/wraparound, mono conversion and concurrent ordering. No physical DAW or mobile playback claim.
