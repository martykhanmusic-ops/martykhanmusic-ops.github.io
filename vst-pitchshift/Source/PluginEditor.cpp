#include "PluginEditor.h"

namespace
{
constexpr int editorWidth = 520;
constexpr int editorHeight = 320;
constexpr auto pitchParamId = "pitch";
constexpr auto mixParamId = "mix";
constexpr auto grainParamId = "grain";
} // namespace

MartyPitchShiftAudioProcessorEditor::MartyPitchShiftAudioProcessorEditor (MartyPitchShiftAudioProcessor& processor)
    : AudioProcessorEditor (&processor), audioProcessor (processor)
{
    configureSlider (pitchSlider, pitchLabel, "Pitch");
    configureSlider (mixSlider, mixLabel, "Mix");
    configureSlider (grainSlider, grainLabel, "Grain");

    addAndMakeVisible (pitchSlider);
    addAndMakeVisible (mixSlider);
    addAndMakeVisible (grainSlider);
    addAndMakeVisible (pitchLabel);
    addAndMakeVisible (mixLabel);
    addAndMakeVisible (grainLabel);

    pitchSlider.setTextValueSuffix (" st");
    mixSlider.setTextValueSuffix (" %");
    grainSlider.setTextValueSuffix (" ms");

    pitchAttachment = std::make_unique<SliderAttachment> (audioProcessor.parameters, pitchParamId, pitchSlider);
    mixAttachment = std::make_unique<SliderAttachment> (audioProcessor.parameters, mixParamId, mixSlider);
    grainAttachment = std::make_unique<SliderAttachment> (audioProcessor.parameters, grainParamId, grainSlider);

    setSize (editorWidth, editorHeight);
}

void MartyPitchShiftAudioProcessorEditor::configureSlider (juce::Slider& slider, juce::Label& label, const juce::String& text)
{
    slider.setSliderStyle (juce::Slider::RotaryHorizontalVerticalDrag);
    slider.setTextBoxStyle (juce::Slider::TextBoxBelow, false, 90, 28);
    slider.setColour (juce::Slider::rotarySliderFillColourId, juce::Colour::fromRGB (255, 102, 0));
    slider.setColour (juce::Slider::thumbColourId, juce::Colour::fromRGB (252, 219, 87));

    label.setText (text, juce::dontSendNotification);
    label.setJustificationType (juce::Justification::centred);
    label.setColour (juce::Label::textColourId, juce::Colours::white);

}

void MartyPitchShiftAudioProcessorEditor::paint (juce::Graphics& graphics)
{
    auto bounds = getLocalBounds().toFloat();
    juce::ColourGradient gradient (juce::Colour::fromRGB (17, 17, 17), bounds.getTopLeft(), juce::Colour::fromRGB (55, 31, 8), bounds.getBottomRight(), false);

    graphics.setGradientFill (gradient);
    graphics.fillAll();

    graphics.setColour (juce::Colour::fromRGB (255, 102, 0));
    graphics.setFont (juce::FontOptions (30.0f, juce::Font::bold));
    graphics.drawFittedText ("Marty PitchShift", getLocalBounds().removeFromTop (76), juce::Justification::centred, 1);

    graphics.setColour (juce::Colours::white.withAlpha (0.75f));
    graphics.setFont (juce::FontOptions (15.0f));
    graphics.drawFittedText ("Real-time two-tap delay pitch shifting", 0, 58, getWidth(), 28, juce::Justification::centred, 1);
}

void MartyPitchShiftAudioProcessorEditor::resized()
{
    auto area = getLocalBounds().reduced (24);
    area.removeFromTop (86);

    auto controls = area.removeFromTop (178);
    const auto controlWidth = controls.getWidth() / 3;

    auto pitchArea = controls.removeFromLeft (controlWidth).reduced (8);
    auto mixArea = controls.removeFromLeft (controlWidth).reduced (8);
    auto grainArea = controls.reduced (8);

    auto placeControl = [] (juce::Slider& slider, juce::Label& label, juce::Rectangle<int> bounds)
    {
        label.setBounds (bounds.removeFromTop (28));
        slider.setBounds (bounds);
    };

    placeControl (pitchSlider, pitchLabel, pitchArea);
    placeControl (mixSlider, mixLabel, mixArea);
    placeControl (grainSlider, grainLabel, grainArea);
}
