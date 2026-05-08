cmake_minimum_required(VERSION 3.22)

project(MartyPitchShift VERSION 1.0.0 LANGUAGES CXX)

include(FetchContent)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_OSX_ARCHITECTURES "arm64;x86_64" CACHE STRING "Build universal macOS binaries" FORCE)

find_package(JUCE CONFIG QUIET)

if (NOT JUCE_FOUND)
  FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG 8.0.6
    GIT_SHALLOW TRUE
  )
  FetchContent_MakeAvailable(JUCE)
endif()

juce_add_plugin(MartyPitchShift
  COMPANY_NAME "Marty Khan Music"
  BUNDLE_ID "com.martykhanmusic.martypitchshift"
  PLUGIN_MANUFACTURER_CODE Mkhn
  PLUGIN_CODE Mps1
  FORMATS VST3 Standalone
  PRODUCT_NAME "Marty PitchShift"
  IS_SYNTH FALSE
  NEEDS_MIDI_INPUT FALSE
  NEEDS_MIDI_OUTPUT FALSE
  IS_MIDI_EFFECT FALSE
  EDITOR_WANTS_KEYBOARD_FOCUS FALSE
  COPY_PLUGIN_AFTER_BUILD TRUE
)

target_sources(MartyPitchShift PRIVATE
  Source/PluginProcessor.cpp
  Source/PluginEditor.cpp
)

target_compile_definitions(MartyPitchShift PUBLIC
  JUCE_WEB_BROWSER=0
  JUCE_USE_CURL=0
  JUCE_VST3_CAN_REPLACE_VST2=0
)

target_link_libraries(MartyPitchShift PRIVATE
  juce::juce_audio_utils
  juce::juce_dsp
)
