#pragma once

#include <array>
#include <atomic>
#include <cstddef>
#include <cstdint>

namespace Halo {

// Single-producer/single-consumer buffer for the audio callback boundary.
// The audio thread only writes; a future relay thread will only read.
// Capacity is fixed at compile time so process() never allocates or locks.
template <std::size_t Capacity>
class StereoCaptureRing final {
public:
    struct Frame {
        float left {0.0f};
        float right {0.0f};
        uint64_t sequence {0};
        double sampleRate {0};
    };

    static_assert(Capacity > 1, "capture ring needs room for at least two frames");
    static_assert(std::atomic<std::size_t>::is_always_lock_free, "audio indices must be lock-free");

    template <typename Sample>
    std::size_t push(const Sample* left, const Sample* right, std::size_t count, int32_t channels, uint64_t firstSequence = 0, double sampleRate = 0) noexcept {
        if (channels <= 0) return 0;
        const auto write = writeIndex.load(std::memory_order_relaxed);
        const auto read = readIndex.load(std::memory_order_acquire);
        const auto available = Capacity - (write - read);
        const auto accepted = count < available ? count : available;

        for (std::size_t i = 0; i < accepted; ++i) {
            auto& frame = frames[(write + i) % Capacity];
            frame.left = left ? static_cast<float>(left[i]) : 0.0f;
            frame.right = channels > 1 && right ? static_cast<float>(right[i]) : frame.left;
            frame.sequence = firstSequence + i;
            frame.sampleRate = sampleRate;
        }
        writeIndex.store(write + accepted, std::memory_order_release);
        return accepted;
    }

    std::size_t pop(Frame* destination, std::size_t count) noexcept {
        if (!destination || count == 0) return 0;
        const auto read = readIndex.load(std::memory_order_relaxed);
        const auto write = writeIndex.load(std::memory_order_acquire);
        const auto available = write - read;
        const auto copied = count < available ? count : available;

        for (std::size_t i = 0; i < copied; ++i)
            destination[i] = frames[(read + i) % Capacity];
        readIndex.store(read + copied, std::memory_order_release);
        return copied;
    }

    std::size_t size() const noexcept {
        return writeIndex.load(std::memory_order_acquire) - readIndex.load(std::memory_order_acquire);
    }

private:
    std::array<Frame, Capacity> frames {};
    std::atomic<std::size_t> writeIndex {0};
    std::atomic<std::size_t> readIndex {0};
};

} // namespace Halo
