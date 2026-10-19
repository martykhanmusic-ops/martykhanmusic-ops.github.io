# Halo Live Listen VST3 foundation

Current verification and remaining work: [resume status](../docs/HALO_LIVE_LISTEN_STATUS.md).

This Windows VST3 is a stereo pass-through processor with a bounded local capture handoff. The audio callback copies incoming 32-bit or 64-bit samples into a fixed 96,000-frame, single-producer/single-consumer float ring without allocation or locking, while preserving the direct pass-through output. The background consumer sends to an authenticated loopback relay. A revocable room and browser player work with generated test audio. Physical Ableton-to-iPhone playback and end-to-end latency remain unverified; M7 remains in progress.

Build with Visual Studio 2022 Build Tools, CMake, and a local recursive checkout of the [Steinberg VST3 SDK](https://github.com/steinbergmedia/vst3sdk). The SDK is kept outside this repository; set `HALO_VST3_SDK` to its absolute path. CMake disables global VST3 plugin links, so builds do not install into Ableton automatically.

```powershell
$cmake = 'C:\Users\owner\Documents\Codex\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe'
& $cmake -S live-listen -B dist/live-listen-build -G 'Visual Studio 17 2022' -A x64 -DHALO_VST3_SDK='C:\Users\owner\_Code\vst3sdk'
& $cmake --build dist/live-listen-build --config Release --target HaloLiveListen
```

The SDK is MIT licensed; retain its copyright and permission notice when distributing a binary containing its code.

## Capture lifecycle increment

Local capture is off by default. The generic host parameter `Send to local relay` enables or disables copying at an audio-block boundary. Processing restart and sample-rate setup disable capture until another host enable event; no saved authorization or room state is restored. Frames carry sample rate, sequence and generation numbers so the consumer can reject stale capture after a switch change. The audio-thread session counts rejected frames. The fixed capacity is 96,000 frames (two seconds only at 48 kHz), not an adaptive duration.

Windows build: VST3 validator 47 passed/0 failed; CTest passed default-off, invalid-rate rejection, enable/disable, overflow gap/sample-rate metadata, FIFO/wraparound, mono conversion and concurrent ordering. No physical DAW or mobile playback claim.

## Local relay and iPhone setup

Run `live-listen/Start-Live-Listen.cmd` to start a loopback-only relay. It prints a five-minute producer pairing code. Open `http://127.0.0.1:4176/` on this PC, pair, and open a room. The VST3 uses the current Windows user's producer token from `%LOCALAPPDATA%\Halo\LiveListen`; its audio never goes directly to the iPhone. Turning off the VST3 switch stops new capture, and **Revoke room** invalidates the listener token. The player never saves audio.

For an iPhone on the same private Wi-Fi, identify this PC's current private IPv4 address and run `powershell -NoProfile -ExecutionPolicy Bypass -File live-listen/setup-local-tls.ps1 -ListenHost <address>`. The script creates a 30-day local CA and server certificate under `%LOCALAPPDATA%\Halo\LiveListen`, limits the folder to the current Windows user, deletes the CA signing key after issuing the server certificate, prints the public `.cer` path and fingerprint, and prints the exact relay startup command. No trust store is changed. Start that command instead of the loopback-only batch file. The producer controls remain local; only the listener player, status and authorized audio reads are reachable on the HTTPS address. The iPhone must explicitly trust the public CA certificate before Safari can use the room link. Verify the certificate fingerprint on the iPhone through a trusted transfer path; never transfer the server private key. A local curl check with `--cacert` may need `--ssl-no-revoke` because this short-lived private CA has no revocation service.

On October 19, 2026, Windows generated and validated a certificate for this PC's Wi-Fi address `192.168.1.207`, and a live local check returned HTTPS 200 for the player while denying HTTPS POST `/pair` with 403. This does not prove that the iPhone can reach or trust the server. The IP address and certificate will need to be regenerated if the Wi-Fi address changes.
