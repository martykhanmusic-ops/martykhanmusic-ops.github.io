#include "capture-session.hpp"
#include <cstdlib>
#include <thread>

void require(bool condition) { if (!condition) std::abort(); }

int main() {
    Halo::StereoCaptureRing<4> ring;
    float left[] {1, 2, 3, 4, 5};
    float right[] {-1, -2, -3, -4, -5};
    Halo::StereoCaptureRing<4>::Frame out[4];
    require(ring.push(left, right, 5, 2) == 4);
    require(ring.push(left, right, 1, 2) == 0);
    require(ring.pop(out, 3) == 3);
    require(out[2].left == 3 && out[2].right == -3);
    double mono[] {0.25, 0.5, 0.75};
    require(ring.push(mono, static_cast<double*>(nullptr), 3, 1) == 3);
    require(ring.pop(out, 4) == 4);
    require(out[0].left == 4 && out[3].left == 0.75f && out[3].right == 0.75f);
    require(ring.pop(out, 1) == 0);
    require(ring.push(left, right, 1, 0) == 0);

    Halo::StereoCaptureRing<64> concurrent;
    constexpr int total = 100000;
    std::thread producer([&] {
        for (int i = 0; i < total; ++i) {
            const float sample = static_cast<float>(i);
            while (!concurrent.push(&sample, &sample, 1, 2)) std::this_thread::yield();
        }
    });
    for (int i = 0; i < total; ++i) {
        Halo::StereoCaptureRing<64>::Frame frame;
        while (!concurrent.pop(&frame, 1)) std::this_thread::yield();
        require(frame.left == i && frame.right == i);
    }
    producer.join();
    Halo::CaptureSession<4> session;
    session.capture(left, right, 2, 2);
    require(session.pop(out, 4) == 0);
    require(!session.configure(0));
    session.enable(true); require(!session.isEnabled());
    require(session.configure(48000)); session.enable(true);
    session.capture(left, right, 5, 2);
    require(session.droppedFrames() == 1);
    require(session.pop(out, 4) == 4 && out[3].sequence == 3 && out[3].sampleRate == 48000);
    session.capture(left, right, 1, 2);
    require(session.pop(out, 1) == 1 && out[0].sequence == 5);
    session.enable(false); session.capture(left, right, 2, 2);
    require(session.pop(out, 4) == 0);
    require(session.configure(96000) && !session.isEnabled());
}

