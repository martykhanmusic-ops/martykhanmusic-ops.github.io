#pragma once

#include <JuceHeader.h>
#include <vector>

class MartyPitchShifterAudioProcessor final : public juce::AudioProcessor
{
public:
    MartyPitchShifterAudioProcessor();
    ~MartyPitchShifterAudioProcessor() override = default;

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

    juce::AudioProcessorValueTreeState& getParameters() { return parameters; }
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

private:
    struct PitchVoice
    {
        double phase = 0.0;
        double readOffset = 0.0;
    };

    float readDelaySample (int channel, double delaySamples) const;
    static float equalPowerWindow (double phase);

    juce::AudioProcessorValueTreeState parameters;
    std::vector<std::vector<float>> delayLines;
    std::vector<PitchVoice> voices;

    double currentSampleRate = 44100.0;
    int writePosition = 0;
    int delayLineSize = 1;
    int baseDelaySamples = 0;
    int crossfadeSamples = 0;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MartyPitchShifterAudioProcessor)
};
