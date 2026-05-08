#include "PluginEditor.h"

namespace
{
constexpr auto semitonesId = "semitones";
constexpr auto mixId = "mix";
constexpr auto outputId = "output";
}

MartyPitchShifterAudioProcessorEditor::MartyPitchShifterAudioProcessorEditor (MartyPitchShifterAudioProcessor& processor)
    : AudioProcessorEditor (&processor), audioProcessor (processor)
{
    setSize (520, 330);

    configureSlider (pitchSlider, pitchLabel, "Pitch Shift");
    configureSlider (mixSlider, mixLabel, "Mix");
    configureSlider (outputSlider, outputLabel, "Output");

    pitchAttachment = std::make_unique<SliderAttachment> (audioProcessor.getParameters(), semitonesId, pitchSlider);
    mixAttachment = std::make_unique<SliderAttachment> (audioProcessor.getParameters(), mixId, mixSlider);
    outputAttachment = std::make_unique<SliderAttachment> (audioProcessor.getParameters(), outputId, outputSlider);
}

void MartyPitchShifterAudioProcessorEditor::configureSlider (juce::Slider& slider, juce::Label& label, const juce::String& labelText)
{
    slider.setSliderStyle (juce::Slider::RotaryHorizontalVerticalDrag);
    slider.setTextBoxStyle (juce::Slider::TextBoxBelow, false, 96, 26);
    slider.setColour (juce::Slider::rotarySliderFillColourId, juce::Colour (0xffff6600));
    slider.setColour (juce::Slider::thumbColourId, juce::Colour (0xfffcdb57));
    addAndMakeVisible (slider);

    label.setText (labelText, juce::dontSendNotification);
    label.setJustificationType (juce::Justification::centred);
    label.setColour (juce::Label::textColourId, juce::Colours::white);
    addAndMakeVisible (label);
}

void MartyPitchShifterAudioProcessorEditor::paint (juce::Graphics& g)
{
    auto bounds = getLocalBounds().toFloat();
    juce::ColourGradient gradient (juce::Colour (0xff151515), bounds.getTopLeft(), juce::Colour (0xff331400), bounds.getBottomRight(), false);
    g.setGradientFill (gradient);
    g.fillAll();

    g.setColour (juce::Colour (0xffff6600));
    g.setFont (juce::FontOptions (28.0f, juce::Font::bold));
    g.drawFittedText ("Marty Pitch Shifter", 24, 22, getWidth() - 48, 38, juce::Justification::centred, 1);

    g.setColour (juce::Colour (0xfffcdb57));
    g.setFont (juce::FontOptions (15.0f));
    g.drawFittedText ("VST3 pitch shifting with dry/wet blend and output trim", 24, 62, getWidth() - 48, 28, juce::Justification::centred, 1);
}

void MartyPitchShifterAudioProcessorEditor::resized()
{
    auto area = getLocalBounds().reduced (28);
    area.removeFromTop (84);

    auto column = area.getWidth() / 3;
    auto placeControl = [&area, column] (juce::Slider& slider, juce::Label& label)
    {
        auto controlArea = area.removeFromLeft (column).reduced (8, 0);
        label.setBounds (controlArea.removeFromTop (28));
        slider.setBounds (controlArea.reduced (0, 6));
    };

    placeControl (pitchSlider, pitchLabel);
    placeControl (mixSlider, mixLabel);
    placeControl (outputSlider, outputLabel);
}
