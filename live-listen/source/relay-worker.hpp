#pragma once
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <winhttp.h>
#include <thread>
#include <fstream>
#include <filesystem>
#include <vector>
#include <string>
#include <cstring>
#include "capture-session.hpp"

namespace Halo {
struct InternetHandle {
    HINTERNET value;
    ~InternetHandle(){if(value)WinHttpCloseHandle(value);}
    operator HINTERNET() const {return value;}
};
// All disk, allocation and HTTP work stays on this background thread.
template <std::size_t Capacity>
class RelayWorker final {
public:
    explicit RelayWorker(CaptureSession<Capacity>& value) : capture(value) {}
    ~RelayWorker() { stop(); }
    void start() { stop(); running=true; worker=std::thread([this]{run();}); }
    void stop() { running=false; if(worker.joinable())worker.join(); }
private:
    CaptureSession<Capacity>& capture;
    std::atomic<bool> running {false};
    std::thread worker;
    void run() noexcept {
        try {
            typename StereoCaptureRing<Capacity>::Frame frames[4096];
            std::string previousToken;
            const std::wstring sourceId=std::to_wstring(GetCurrentProcessId())+L"-"+std::to_wstring(reinterpret_cast<uintptr_t>(this));
            InternetHandle session{WinHttpOpen(L"HaloLiveListen/0.2",WINHTTP_ACCESS_TYPE_NO_PROXY,nullptr,nullptr,0)};
            if(!session)return;
            WinHttpSetTimeouts(session,500,500,500,500);
            InternetHandle connection{WinHttpConnect(session,L"127.0.0.1",4176,0)};
            if(!connection)return;
            while(running) {
                const auto count=capture.pop(frames,4096);
                if(!count){std::this_thread::sleep_for(std::chrono::milliseconds(10));continue;}
                const auto generation=capture.currentGeneration();
                if(!capture.isEnabled()||frames[0].generation!=generation||frames[count-1].generation!=generation)continue;
                if(frames[0].sampleRate<8000||frames[0].sampleRate>192000)continue;
                // Reject blocks crossing a sequence gap; next block resumes fresh.
                if(frames[count-1].sequence!=frames[0].sequence+count-1)continue;
                wchar_t local[32768];
                const auto length=GetEnvironmentVariableW(L"LOCALAPPDATA",local,32768);
                if(!length||length>=32768)continue;
                std::ifstream input(std::filesystem::path(local)/L"Halo"/L"LiveListen"/L"producer-token");
                std::string token;input>>token;
                if(token.size()!=64||token.find_first_not_of("0123456789abcdef")!=std::string::npos)continue;
                if(token!=previousToken){
                    previousToken=token;
                    // A new room must never replay capture queued under an old grant.
                    for(std::size_t i=0;i<Capacity/4096+1&&capture.pop(frames,4096);++i){}
                    continue;
                }
                std::vector<unsigned char> packet(24+count*8);
                std::memcpy(packet.data(),"HALO",4);
                const uint32_t version=1,rate=static_cast<uint32_t>(frames[0].sampleRate),samples=static_cast<uint32_t>(count);
                std::memcpy(packet.data()+4,&version,4);std::memcpy(packet.data()+8,&rate,4);std::memcpy(packet.data()+12,&samples,4);
                std::memcpy(packet.data()+16,&frames[0].sequence,8);
                for(std::size_t i=0;i<count;++i){std::memcpy(packet.data()+24+i*8,&frames[i].left,4);std::memcpy(packet.data()+28+i*8,&frames[i].right,4);}
                if(!running||!capture.isEnabled()||capture.currentGeneration()!=generation)continue;
                InternetHandle request{WinHttpOpenRequest(connection,L"POST",L"/audio",nullptr,nullptr,nullptr,0)};
                if(!request)continue;
                // No redirects: credentials must never leave the fixed loopback endpoint.
                DWORD redirect=WINHTTP_OPTION_REDIRECT_POLICY_NEVER;
                WinHttpSetOption(request,WINHTTP_OPTION_REDIRECT_POLICY,&redirect,sizeof(redirect));
                const std::wstring header=L"Content-Type: application/octet-stream\r\nX-Halo-Producer: "+sourceId+L"\r\nAuthorization: Bearer "+std::wstring(token.begin(),token.end());
                const bool sent=WinHttpAddRequestHeaders(request,header.c_str(),static_cast<DWORD>(header.size()),WINHTTP_ADDREQ_FLAG_ADD)&&
                    WinHttpSendRequest(request,WINHTTP_NO_ADDITIONAL_HEADERS,0,packet.data(),static_cast<DWORD>(packet.size()),static_cast<DWORD>(packet.size()),0)&&
                    WinHttpReceiveResponse(request,nullptr);
                DWORD status=0,size=sizeof(status);
                if(sent)WinHttpQueryHeaders(request,WINHTTP_QUERY_STATUS_CODE|WINHTTP_QUERY_FLAG_NUMBER,nullptr,&status,&size,nullptr);
                if(status!=200){
                    // Drop backlog rather than replay audio when the relay recovers.
                    for(std::size_t i=0;i<Capacity/4096+1&&capture.pop(frames,4096);++i){}
                    std::this_thread::sleep_for(std::chrono::milliseconds(100));
                }
            }
        } catch(...) { /* Transport failure never interrupts the DAW audio thread. */ }
    }
};
}
