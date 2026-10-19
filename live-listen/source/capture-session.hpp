#pragma once
#include "capture-ring.hpp"
#include <cmath>

namespace Halo {
// Lifecycle/configuration calls require a stopped producer and consumer.
// Enable and capture run on the audio thread; the future consumer only pops.
template <std::size_t Capacity>
class CaptureSession final {
public:
    bool configure(double rate) noexcept {
        enabled = false;
        sampleRate = std::isfinite(rate) && rate > 0 ? rate : 0;
        return sampleRate > 0;
    }
    void enable(bool value) noexcept { enabled = value && sampleRate > 0; }
    bool isEnabled() const noexcept { return enabled; }
    uint64_t droppedFrames() const noexcept { return dropped; }
    template <typename Sample>
    void capture(const Sample* left, const Sample* right, std::size_t count, int32_t channels) noexcept {
        if (!enabled || channels <= 0) return;
        const auto accepted = ring.push(left, right, count, channels, sequence, sampleRate);
        sequence += count;
        dropped += count - accepted;
    }
    // Consumer must discard queued frames on revocation before resuming delivery.
    std::size_t pop(typename StereoCaptureRing<Capacity>::Frame* output, std::size_t count) noexcept {
        return ring.pop(output, count);
    }
private:
    StereoCaptureRing<Capacity> ring;
    bool enabled {false};
    double sampleRate {0};
    uint64_t sequence {0};
    uint64_t dropped {0};
};
}
