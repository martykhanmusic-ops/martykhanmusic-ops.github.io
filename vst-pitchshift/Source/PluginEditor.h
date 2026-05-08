#pragma once

#include "PluginProcessor.h"

class MartyPitchShiftAudioProcessorEditor final : public juce::AudioProcessorEditor
{
public:
    explicit MartyPitchShiftAudioProcessorEditor (MartyPitchShiftAudioProcessor&);
    ~MartyPitchShiftAudioProcessorEditor() override = default;

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    using SliderAttachment = juce::AudioProcessorValueTreeState::SliderAttachment;

    static void configureSlider (juce::Slider& slider, juce::Label& label, const juce::String& text);

    MartyPitchShiftAudioProcessor& audioProcessor;

    juce::Slider pitchSlider;
    juce::Slider mixSlider;
    juce::Slider grainSlider;
    juce::Label pitchLabel;
    juce::Label mixLabel;
    juce::Label grainLabel;

    std::unique_ptr<SliderAttachment> pitchAttachment;
    std::unique_ptr<SliderAttachment> mixAttachment;
    std::unique_ptr<SliderAttachment> grainAttachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MartyPitchShiftAudioProcessorEditor)
};
