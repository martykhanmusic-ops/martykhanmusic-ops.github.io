#include "PluginProcessor.h"
#include "PluginEditor.h"

namespace
{
constexpr auto pitchParamId = "pitch";
constexpr auto mixParamId = "mix";
constexpr auto grainParamId = "grain";
constexpr float maxDelaySeconds = 0.25f;
constexpr float minDelaySamples = 8.0f;

float semitonesToRatio (float semitones) noexcept
{
    return std::pow (2.0f, semitones / 12.0f);
}

float equalPowerWindow (float phase) noexcept
{
    return std::sin (juce::MathConstants<float>::pi * juce::jlimit (0.0f, 1.0f, phase));
}

float wrapPhase (float value) noexcept
{
    value -= std::floor (value);
    return value;
}
} // namespace

MartyPitchShiftAudioProcessor::MartyPitchShiftAudioProcessor()
    : AudioProcessor (BusesProperties()
                          .withInput ("Input", juce::AudioChannelSet::stereo(), true)
                          .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      parameters (*this, nullptr, "PARAMETERS", createParameterLayout())
{
}

juce::AudioProcessorValueTreeState::ParameterLayout MartyPitchShiftAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    params.push_back (std::make_unique<juce::AudioParameterFloat> (
        juce::ParameterID { pitchParamId, 1 }, "Pitch", juce::NormalisableRange<float> { -24.0f, 24.0f, 0.01f }, 0.0f,
        juce::AudioParameterFloatAttributes().withLabel ("st")));

    params.push_back (std::make_unique<juce::AudioParameterFloat> (
        juce::ParameterID { mixParamId, 1 }, "Mix", juce::NormalisableRange<float> { 0.0f, 100.0f, 0.1f }, 100.0f,
        juce::AudioParameterFloatAttributes().withLabel ("%")));

    params.push_back (std::make_unique<juce::AudioParameterFloat> (
        juce::ParameterID { grainParamId, 1 }, "Grain", juce::NormalisableRange<float> { 20.0f, 180.0f, 1.0f }, 90.0f,
        juce::AudioParameterFloatAttributes().withLabel ("ms")));

    return { params.begin(), params.end() };
}

void MartyPitchShiftAudioProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    juce::ignoreUnused (samplesPerBlock);
    currentSampleRate = sampleRate;
    maxDelaySamples = juce::roundToInt (maxDelaySeconds * static_cast<float> (currentSampleRate));
    resizeDelayBuffers();
    phase = 0.0f;
}

void MartyPitchShiftAudioProcessor::releaseResources()
{
    delayBuffers.clear();
    writePositions.clear();
}

bool MartyPitchShiftAudioProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto& mainInput = layouts.getMainInputChannelSet();
    const auto& mainOutput = layouts.getMainOutputChannelSet();

    return mainInput == mainOutput && (mainOutput == juce::AudioChannelSet::mono() || mainOutput == juce::AudioChannelSet::stereo());
}

void MartyPitchShiftAudioProcessor::resizeDelayBuffers()
{
    const auto channels = juce::jmax (1, getTotalNumInputChannels());
    delayBuffers.resize (static_cast<size_t> (channels));
    writePositions.assign (static_cast<size_t> (channels), 0);

    for (auto& buffer : delayBuffers)
    {
        buffer.setSize (1, maxDelaySamples + 4, false, false, true);
        buffer.clear();
    }
}

float MartyPitchShiftAudioProcessor::readInterpolatedSample (int channel, float delayInSamples) const noexcept
{
    const auto& buffer = delayBuffers[static_cast<size_t> (channel)];
    const auto bufferSize = buffer.getNumSamples();
    const auto writePosition = writePositions[static_cast<size_t> (channel)];

    auto readPosition = static_cast<float> (writePosition) - delayInSamples;
    while (readPosition < 0.0f)
        readPosition += static_cast<float> (bufferSize);
    while (readPosition >= static_cast<float> (bufferSize))
        readPosition -= static_cast<float> (bufferSize);

    const auto index0 = static_cast<int> (readPosition);
    const auto index1 = (index0 + 1) % bufferSize;
    const auto fraction = readPosition - static_cast<float> (index0);
    const auto* data = buffer.getReadPointer (0);

    return juce::jmap (fraction, data[index0], data[index1]);
}

float MartyPitchShiftAudioProcessor::processPitchSample (int channel, float input, float pitchRatio, float grainSamples, float wet) noexcept
{
    auto& buffer = delayBuffers[static_cast<size_t> (channel)];
    auto& writePosition = writePositions[static_cast<size_t> (channel)];
    buffer.setSample (0, writePosition, input);

    if (std::abs (pitchRatio - 1.0f) < 0.0001f)
    {
        writePosition = (writePosition + 1) % buffer.getNumSamples();
        return input;
    }

    const auto phaseA = phase;
    const auto phaseB = wrapPhase (phase + 0.5f);
    const auto delayA = pitchRatio > 1.0f ? (1.0f - phaseA) * grainSamples : phaseA * grainSamples;
    const auto delayB = pitchRatio > 1.0f ? (1.0f - phaseB) * grainSamples : phaseB * grainSamples;
    const auto tapA = readInterpolatedSample (channel, delayA + minDelaySamples);
    const auto tapB = readInterpolatedSample (channel, delayB + minDelaySamples);
    const auto gainA = equalPowerWindow (phaseA);
    const auto gainB = equalPowerWindow (phaseB);
    const auto shifted = (tapA * gainA + tapB * gainB) / juce::jmax (0.001f, gainA + gainB);

    writePosition = (writePosition + 1) % buffer.getNumSamples();
    return input + (shifted - input) * wet;
}

void MartyPitchShiftAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ignoreUnused (midiMessages);
    juce::ScopedNoDenormals noDenormals;

    const auto totalInputChannels = getTotalNumInputChannels();
    const auto totalOutputChannels = getTotalNumOutputChannels();

    for (auto channel = totalInputChannels; channel < totalOutputChannels; ++channel)
        buffer.clear (channel, 0, buffer.getNumSamples());

    if (delayBuffers.size() != static_cast<size_t> (totalInputChannels) || maxDelaySamples <= 0)
        resizeDelayBuffers();

    const auto pitchSemitones = parameters.getRawParameterValue (pitchParamId)->load();
    const auto wet = parameters.getRawParameterValue (mixParamId)->load() * 0.01f;
    const auto grainMs = parameters.getRawParameterValue (grainParamId)->load();
    const auto pitchRatio = semitonesToRatio (pitchSemitones);
    const auto grainSamples = juce::jlimit (minDelaySamples, static_cast<float> (maxDelaySamples - 2), grainMs * 0.001f * static_cast<float> (currentSampleRate));
    const auto phaseIncrement = std::abs (pitchRatio - 1.0f) / grainSamples;

    for (auto sample = 0; sample < buffer.getNumSamples(); ++sample)
    {
        for (auto channel = 0; channel < totalInputChannels; ++channel)
        {
            const auto input = buffer.getSample (channel, sample);
            buffer.setSample (channel, sample, processPitchSample (channel, input, pitchRatio, grainSamples, wet));
        }

        phase = wrapPhase (phase + phaseIncrement);
    }
}

void MartyPitchShiftAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    if (auto state = parameters.copyState(); state.isValid())
    {
        std::unique_ptr<juce::XmlElement> xml (state.createXml());
        copyXmlToBinary (*xml, destData);
    }
}

void MartyPitchShiftAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xmlState (getXmlFromBinary (data, sizeInBytes));

    if (xmlState != nullptr && xmlState->hasTagName (parameters.state.getType()))
        parameters.replaceState (juce::ValueTree::fromXml (*xmlState));
}

juce::AudioProcessorEditor* MartyPitchShiftAudioProcessor::createEditor()
{
    return new MartyPitchShiftAudioProcessorEditor (*this);
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new MartyPitchShiftAudioProcessor();
}
