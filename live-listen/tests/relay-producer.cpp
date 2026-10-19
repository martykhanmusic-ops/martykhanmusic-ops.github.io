#include "relay-worker.hpp"
#include <cmath>
#include <memory>
int main(){
    auto storage=std::make_unique<Halo::CaptureSession<96000>>(); auto& capture=*storage;
    Halo::RelayWorker<96000> worker(capture);
    capture.configure(48000);capture.enable(true);worker.start();
    float samples[480];
    // Explicit generated test tone; this executable is never a production source.
    for(int block=0;block<150;++block){for(int i=0;i<480;++i)samples[i]=.05f*std::sin((block*480+i)*.057595865f);capture.capture(samples,samples,480,2);std::this_thread::sleep_for(std::chrono::milliseconds(10));}
    capture.enable(false);worker.stop();
}
