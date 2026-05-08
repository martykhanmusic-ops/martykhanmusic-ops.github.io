# Marty PitchShift VST3

Marty PitchShift is a lightweight JUCE-based VST3/standalone audio plugin that pitch-shifts incoming audio in real time.

## Features

- Pitch control from -24 to +24 semitones.
- Dry/wet mix control.
- Grain length control for balancing smoothness against latency/artifacts.
- Stereo-safe processing with independent circular buffers per channel.
- VST3 and standalone targets via CMake/JUCE.

## Build requirements

- CMake 3.22 or newer.
- A C++17 compiler.
- Platform audio plugin tooling:
  - macOS: Xcode command line tools.
  - Windows: Visual Studio 2022 with C++ workload.
  - Linux: standard build tools plus system packages required by JUCE.
- Either an installed JUCE CMake package or internet access for the first configure step so CMake can fetch JUCE.

## Build

```sh
cmake -S vst-pitchshift -B build/vst-pitchshift -DCMAKE_BUILD_TYPE=Release
cmake --build build/vst-pitchshift --config Release
```

The VST3 target is named `MartyPitchShift_VST3`. With `COPY_PLUGIN_AFTER_BUILD` enabled, JUCE will also try to copy the plugin into the platform's default VST3 folder after a successful build.

## Algorithm notes

The processor uses a two-tap modulated delay-line pitch shifter. Each tap reads from a circular buffer with a moving delay time. The taps are offset by half a grain and crossfaded with equal-power windows so one tap can wrap while the other continues playback. This keeps the implementation compact and low-latency while still providing an audible real-time pitch-shift effect.
