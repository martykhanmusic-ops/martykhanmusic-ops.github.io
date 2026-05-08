#pragma once

#include <JuceHeader.h>
#include "PluginProcessor.h"

class MartyPitchShifterAudioProcessorEditor final : public juce::AudioProcessorEditor
{
public:
    explicit MartyPitchShifterAudioProcessorEditor (MartyPitchShifterAudioProcessor&);
    ~MartyPitchShifterAudioProcessorEditor() override = default;

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    using SliderAttachment = juce::AudioProcessorValueTreeState::SliderAttachment;

    void configureSlider (juce::Slider& slider, juce::Label& label, const juce::String& labelText);

    MartyPitchShifterAudioProcessor& audioProcessor;

    juce::Slider pitchSlider;
    juce::Slider mixSlider;
    juce::Slider outputSlider;

    juce::Label pitchLabel;
    juce::Label mixLabel;
    juce::Label outputLabel;

    std::unique_ptr<SliderAttachment> pitchAttachment;
    std::unique_ptr<SliderAttachment> mixAttachment;
    std::unique_ptr<SliderAttachment> outputAttachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MartyPitchShifterAudioProcessorEditor)
};
