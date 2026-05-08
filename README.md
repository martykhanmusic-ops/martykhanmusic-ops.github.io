# Marty Khan Music Ops

This repository contains the Marty Khan Music landing page plus a JUCE-based VST3/standalone pitch-shifter plugin.

## Marty Pitch Shifter VST

Marty Pitch Shifter is a stereo audio effect plugin that shifts incoming audio by up to one octave up or down. It includes:

- **Pitch Shift**: -12 to +12 semitones.
- **Mix**: dry/wet blend from 0% to 100%.
- **Output**: output trim from -24 dB to +12 dB.
- **Formats**: VST3 and standalone app targets via JUCE/CMake.

The DSP uses a dual-window modulated delay-line pitch shifter with linear interpolation and equal-power crossfades. This keeps the implementation dependency-light while providing a practical real-time pitch effect suitable for vocals, instruments, and creative sound design.

## Build requirements

- CMake 3.22 or newer
- A C++17 compiler
- Platform VST3 build tooling supported by JUCE
- Internet access on first configure so CMake can fetch JUCE 8.0.8

## Build commands

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

The built VST3 is produced by the `MartyPitchShifter_VST3` target under the CMake build directory. The standalone app is produced by the `MartyPitchShifter_Standalone` target.

## Website

The static site remains available from `index.html` for GitHub Pages hosting.
