#pragma once

#include <JuceHeader.h>

class MartyPitchShiftAudioProcessor final : public juce::AudioProcessor
{
public:
    MartyPitchShiftAudioProcessor();
    ~MartyPitchShiftAudioProcessor() override = default;

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;

    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return JucePlugin_Name; }

    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    juce::AudioProcessorValueTreeState parameters;

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    float readInterpolatedSample (int channel, float delayInSamples) const noexcept;
    float processPitchSample (int channel, float input, float pitchRatio, float grainSamples, float wet) noexcept;
    void resizeDelayBuffers();

    std::vector<juce::AudioBuffer<float>> delayBuffers;
    std::vector<int> writePositions;
    float phase = 0.0f;
    double currentSampleRate = 44100.0;
    int maxDelaySamples = 0;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MartyPitchShiftAudioProcessor)
};
