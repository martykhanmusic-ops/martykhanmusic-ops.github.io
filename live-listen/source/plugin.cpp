#include "public.sdk/source/vst/vstsinglecomponenteffect.h"
#include "public.sdk/source/main/pluginfactory_constexpr.h"
#include "pluginterfaces/vst/ivstaudioprocessor.h"
#include "capture-ring.hpp"
#include <algorithm>

namespace Halo {
using namespace Steinberg;
using namespace Steinberg::Vst;

static DECLARE_UID (ProcessorId, 0x8A2B4999, 0xFE4C42B5, 0xB8467060, 0xC6AB3A61);

class LiveListen final : public SingleComponentEffect {
public:
    static FUnknown* createInstance (void*) { return static_cast<IAudioProcessor*> (new LiveListen); }

    tresult PLUGIN_API initialize (FUnknown* context) override {
        const auto result = SingleComponentEffect::initialize (context);
        if (result != kResultOk) return result;
        addAudioInput (STR16 ("Stereo In"), SpeakerArr::kStereo);
        addAudioOutput (STR16 ("Stereo Out"), SpeakerArr::kStereo);
        return kResultOk;
    }

    tresult PLUGIN_API process (ProcessData& data) override {
        if (data.numInputs < 1 || data.numOutputs < 1 || !data.inputs || !data.outputs)
            return kResultOk;
        const auto channels = std::min (data.inputs[0].numChannels, data.outputs[0].numChannels);
        const auto samples = std::max (data.numSamples, 0);
        if (data.symbolicSampleSize == kSample32) {
            const auto* inputLeft = data.inputs[0].channelBuffers32[0];
            const auto* inputRight = channels > 1 ? data.inputs[0].channelBuffers32[1] : nullptr;
            captured.push(inputLeft, inputRight, static_cast<std::size_t>(samples), channels);
            for (int32 channel = 0; channel < channels; ++channel) {
                const auto* input = data.inputs[0].channelBuffers32[channel];
                auto* output = data.outputs[0].channelBuffers32[channel];
                if (input && output && input != output)
                    std::copy_n (input, samples, output);
            }
        } else if (data.symbolicSampleSize == kSample64) {
            const auto* inputLeft = data.inputs[0].channelBuffers64[0];
            const auto* inputRight = channels > 1 ? data.inputs[0].channelBuffers64[1] : nullptr;
            captured.push(inputLeft, inputRight, static_cast<std::size_t>(samples), channels);
            for (int32 channel = 0; channel < channels; ++channel) {
                const auto* input = data.inputs[0].channelBuffers64[channel];
                auto* output = data.outputs[0].channelBuffers64[channel];
                if (input && output && input != output)
                    std::copy_n (input, samples, output);
            }
        } else return kInvalidArgument;
        data.outputs[0].silenceFlags = data.inputs[0].silenceFlags;
        return kResultOk;
    }

private:
    // 2 seconds at 48 kHz. This is a local bounded handoff only; no network
    // transport, room identity, or consumer thread exists in this increment.
    StereoCaptureRing<96000> captured;
};
}

BEGIN_FACTORY_DEF ("Halo", "https://github.com/martykhanmusic-ops/martykhanmusic-ops.github.io", "", 1)
DEF_CLASS (Halo::ProcessorId, Steinberg::PClassInfo::kManyInstances,
           kVstAudioEffectClass, "Halo Live Listen",
           0, "Fx", "0.1.0",
           kVstVersionString, Halo::LiveListen::createInstance, nullptr)
END_FACTORY
