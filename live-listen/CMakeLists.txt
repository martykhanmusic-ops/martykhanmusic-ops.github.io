cmake_minimum_required(VERSION 3.25)
project(halo-live-listen VERSION 0.1.0 LANGUAGES CXX)

if(NOT DEFINED HALO_VST3_SDK OR NOT EXISTS "${HALO_VST3_SDK}/CMakeLists.txt")
  message(FATAL_ERROR "Set HALO_VST3_SDK to a local Steinberg VST3 SDK checkout")
endif()

set(SMTG_ENABLE_VST3_PLUGIN_EXAMPLES OFF CACHE BOOL "" FORCE)
set(SMTG_ENABLE_VST3_HOSTING_EXAMPLES OFF CACHE BOOL "" FORCE)
set(SMTG_ENABLE_VSTGUI_SUPPORT OFF CACHE BOOL "" FORCE)
set(SMTG_CREATE_PLUGIN_LINK OFF CACHE BOOL "" FORCE)
add_subdirectory("${HALO_VST3_SDK}" "${CMAKE_BINARY_DIR}/sdk")

set(SDK_ROOT "${HALO_VST3_SDK}")
file(TO_CMAKE_PATH "${HALO_VST3_SDK}" HALO_VST3_SDK_PATH)
smtg_add_vst3plugin(HaloLiveListen
  source/plugin.cpp
  "${HALO_VST3_SDK_PATH}/public.sdk/source/vst/vstsinglecomponenteffect.cpp")
target_compile_features(HaloLiveListen PRIVATE cxx_std_17)
target_include_directories(HaloLiveListen PRIVATE "${HALO_VST3_SDK}")
target_link_libraries(HaloLiveListen PRIVATE sdk)

enable_testing()
add_executable(HaloCaptureTests tests/capture-ring.cpp)
target_compile_features(HaloCaptureTests PRIVATE cxx_std_17)
target_include_directories(HaloCaptureTests PRIVATE source)
add_test(NAME HaloCaptureRing COMMAND HaloCaptureTests)
