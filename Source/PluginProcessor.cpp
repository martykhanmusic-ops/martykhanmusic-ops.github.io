#include "PluginProcessor.h"
#include "PluginEditor.h"

namespace
{
constexpr auto parameterTreeId = "PARAMETERS";
constexpr auto semitonesId = "semitones";
constexpr auto mixId = "mix";
constexpr auto outputId = "output";
constexpr double crossfadeSeconds = 0.050;
constexpr double baseDelaySeconds = 0.100;
}

MartyPitchShifterAudioProcessor::MartyPitchShifterAudioProcessor()
    : AudioProcessor (BusesProperties()
          .withInput ("Input", juce::AudioChannelSet::stereo(), true)
          .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      parameters (*this, nullptr, parameterTreeId, createParameterLayout())
{
}

juce::AudioProcessorValueTreeState::ParameterLayout MartyPitchShifterAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    params.push_back (std::make_unique<juce::AudioParameterFloat> (
        juce::ParameterID { semitonesId, 1 }, "Pitch Shift", juce::NormalisableRange<float> { -12.0f, 12.0f, 0.01f }, 0.0f,
        juce::String(), juce::AudioProcessorParameter::genericParameter,
        [] (float value, int) { return juce::String (value, 2) + " st"; }));

    params.push_back (std::make_unique<juce::AudioParameterFloat> (
        juce::ParameterID { mixId, 1 }, "Mix", juce::NormalisableRange<float> { 0.0f, 100.0f, 0.1f }, 100.0f,
        juce::String(), juce::AudioProcessorParameter::genericParameter,
        [] (float value, int) { return juce::String (value, 1) + "%"; }));

    params.push_back (std::make_unique<juce::AudioParameterFloat> (
        juce::ParameterID { outputId, 1 }, "Output", juce::NormalisableRange<float> { -24.0f, 12.0f, 0.1f }, 0.0f,
        juce::String(), juce::AudioProcessorParameter::genericParameter,
        [] (float value, int) { return juce::String (value, 1) + " dB"; }));

    return { params.begin(), params.end() };
}

void MartyPitchShifterAudioProcessor::prepareToPlay (double sampleRate, int)
{
    currentSampleRate = sampleRate;
    crossfadeSamples = juce::jmax (1, static_cast<int> (std::round (crossfadeSeconds * currentSampleRate)));
    baseDelaySamples = juce::jmax (crossfadeSamples + 4, static_cast<int> (std::round (baseDelaySeconds * currentSampleRate)));
    delayLineSize = baseDelaySamples + (2 * crossfadeSamples) + 8;
    writePosition = 0;

    const auto numChannels = juce::jmax (1, getTotalNumInputChannels(), getTotalNumOutputChannels());
    delayLines.assign (static_cast<size_t> (numChannels), std::vector<float> (static_cast<size_t> (delayLineSize), 0.0f));

    voices = { PitchVoice { 0.0, static_cast<double> (baseDelaySamples) },
               PitchVoice { 0.5, static_cast<double> (baseDelaySamples) + (0.5 * static_cast<double> (crossfadeSamples)) } };
}

void MartyPitchShifterAudioProcessor::releaseResources()
{
    delayLines.clear();
}

bool MartyPitchShifterAudioProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto& mainInput = layouts.getMainInputChannelSet();
    const auto& mainOutput = layouts.getMainOutputChannelSet();

    return mainInput == mainOutput
        && (mainInput == juce::AudioChannelSet::mono() || mainInput == juce::AudioChannelSet::stereo());
}

float MartyPitchShifterAudioProcessor::equalPowerWindow (double phase)
{
    return std::sin (juce::MathConstants<double>::pi * juce::jlimit (0.0, 1.0, phase));
}

float MartyPitchShifterAudioProcessor::readDelaySample (int channel, double delaySamples) const
{
    auto readPosition = static_cast<double> (writePosition) - delaySamples;
    while (readPosition < 0.0)
        readPosition += delayLineSize;
    while (readPosition >= delayLineSize)
        readPosition -= delayLineSize;

    const auto index0 = static_cast<int> (std::floor (readPosition));
    const auto index1 = (index0 + 1) % delayLineSize;
    const auto fraction = static_cast<float> (readPosition - index0);
    const auto& line = delayLines[static_cast<size_t> (channel)];

    return juce::jmap (fraction, line[static_cast<size_t> (index0)], line[static_cast<size_t> (index1)]);
}

void MartyPitchShifterAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ignoreUnused (midiMessages);
    juce::ScopedNoDenormals noDenormals;

    const auto numInputChannels = getTotalNumInputChannels();
    const auto numOutputChannels = getTotalNumOutputChannels();
    const auto numSamples = buffer.getNumSamples();

    for (auto channel = numInputChannels; channel < numOutputChannels; ++channel)
        buffer.clear (channel, 0, numSamples);

    if (delayLines.empty())
        return;

    const auto semitones = parameters.getRawParameterValue (semitonesId)->load();
    const auto wetMix = parameters.getRawParameterValue (mixId)->load() * 0.01f;
    const auto dryMix = 1.0f - wetMix;
    const auto outputGain = juce::Decibels::decibelsToGain (parameters.getRawParameterValue (outputId)->load());
    const auto ratio = std::pow (2.0, static_cast<double> (semitones) / 12.0);
    const auto delayStep = 1.0 - ratio;
    const auto maxOffset = static_cast<double> (crossfadeSamples);
    const auto phaseStep = std::abs (delayStep) / maxOffset;

    for (auto sample = 0; sample < numSamples; ++sample)
    {
        for (auto channel = 0; channel < numInputChannels; ++channel)
            delayLines[static_cast<size_t> (channel)][static_cast<size_t> (writePosition)] = buffer.getSample (channel, sample);

        for (auto channel = 0; channel < numInputChannels; ++channel)
        {
            auto shiftedSample = 0.0f;
            auto windowSum = 0.0f;

            for (auto& voice : voices)
            {
                const auto window = equalPowerWindow (voice.phase);
                shiftedSample += window * readDelaySample (channel, voice.readOffset);
                windowSum += window;
            }

            if (windowSum > 0.0f)
                shiftedSample /= windowSum;

            const auto drySample = buffer.getSample (channel, sample);
            buffer.setSample (channel, sample, outputGain * ((dryMix * drySample) + (wetMix * shiftedSample)));
        }

        for (auto& voice : voices)
        {
            voice.phase += phaseStep;
            while (voice.phase >= 1.0)
                voice.phase -= 1.0;

            const auto sweep = delayStep >= 0.0 ? voice.phase : 1.0 - voice.phase;
            voice.readOffset = static_cast<double> (baseDelaySamples) + (sweep * maxOffset);
        }

        writePosition = (writePosition + 1) % delayLineSize;
    }
}

void MartyPitchShifterAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    if (auto state = parameters.copyState(); state.isValid())
    {
        std::unique_ptr<juce::XmlElement> xml (state.createXml());
        copyXmlToBinary (*xml, destData);
    }
}

void MartyPitchShifterAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xmlState (getXmlFromBinary (data, sizeInBytes));

    if (xmlState != nullptr && xmlState->hasTagName (parameters.state.getType()))
        parameters.replaceState (juce::ValueTree::fromXml (*xmlState));
}

juce::AudioProcessorEditor* MartyPitchShifterAudioProcessor::createEditor()
{
    return new MartyPitchShifterAudioProcessorEditor (*this);
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new MartyPitchShifterAudioProcessor();
}
