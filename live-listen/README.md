# Halo Live Listen VST3 foundation

This Windows VST3 is a stereo pass-through processor. It is deliberately silent as a network source: no capture, relay, room, mobile client, or telemetry is implemented yet. M7 remains in progress.

Build with Visual Studio 2022 Build Tools, CMake, and a local recursive checkout of the [Steinberg VST3 SDK](https://github.com/steinbergmedia/vst3sdk). The SDK is kept outside this repository; set `HALO_VST3_SDK` to its absolute path. CMake disables global VST3 plugin links, so builds do not install into Ableton automatically.

```powershell
$cmake = 'C:\Users\owner\Documents\Codex\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe'
& $cmake -S live-listen -B dist/live-listen-build -G 'Visual Studio 17 2022' -A x64 -DHALO_VST3_SDK='C:\Users\owner\_Code\vst3sdk'
& $cmake --build dist/live-listen-build --config Release --target HaloLiveListen
```

The SDK is MIT licensed; retain its copyright and permission notice when distributing a binary containing its code. Do not describe this foundation as a working live stream.
