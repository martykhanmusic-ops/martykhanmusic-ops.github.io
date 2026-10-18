const API = '/voicebox';
const MAX_AUDIO_BYTES = 12_000_000;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function json(response) {
  if (!response.ok) {
    let detail = '';
    try { const body = await response.json(); detail = typeof body.detail === 'string' ? body.detail : body.detail?.message || ''; } catch {}
    throw new Error(detail || `Voicebox returned HTTP ${response.status}.`);
  }
  return response.json();
}

export function createJarvisVoice({ fetcher = fetch, mediaDevices = navigator.mediaDevices, Recorder = window.MediaRecorder, AudioPlayer = window.Audio } = {}) {
  let recorder = null, stream = null, chunks = [], player = null, audioUrl = null, generation = 0;
  const status = message => { const el = document.querySelector('#voice-status'); if (el) el.textContent = message; };
  const controls = () => {
    const record = document.querySelector('#voice-record'), stop = document.querySelector('#voice-stop'), speak = document.querySelector('#voice-speak');
    if (record) record.disabled = Boolean(recorder);
    if (stop) stop.disabled = !recorder;
    if (speak) speak.disabled = !document.querySelector('#voice-text')?.value.trim();
  };
  function stopPlayback() {
    generation++;
    window.speechSynthesis?.cancel();
    if (player) { player.pause(); player.src = ''; player = null; }
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
    status('Playback stopped.');
  }
  function cancelRecording() {
    if (recorder && recorder.state !== 'inactive') { recorder.onstop = null; recorder.stop(); }
    stream?.getTracks().forEach(track => track.stop());
    recorder = null; stream = null; chunks = []; controls();
  }
  async function check() {
    try {
      await json(await fetcher(`${API}/health`, { mode: 'cors' }));
      status('Voicebox is connected on this computer.');
    } catch { status('Voicebox is unavailable. Start the local Voicebox backend for microphone transcription and speech.'); }
  }
  async function record() {
    if (recorder) return;
    if (!mediaDevices?.getUserMedia || !Recorder) { status('Microphone recording is unavailable in this browser. Type in Jarvis instead.'); return; }
    try {
      stream = await mediaDevices.getUserMedia({ audio: true });
      recorder = new Recorder(stream, Recorder.isTypeSupported?.('audio/webm') ? { mimeType: 'audio/webm' } : undefined);
      chunks = [];
      recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
      recorder.onerror = () => { status('Microphone recording failed.'); cancelRecording(); };
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
        stream?.getTracks().forEach(track => track.stop());
        recorder = null; stream = null; chunks = []; controls();
        if (!blob.size) { status('No audio was captured.'); return; }
        if (blob.size > MAX_AUDIO_BYTES) { status('Recording is too large. Try a shorter message.'); return; }
        status('Transcribing with local Voicebox…');
        try {
          const form = new FormData(); form.append('file', blob, blob.type.includes('webm') ? 'jarvis.webm' : 'jarvis.wav');
          const result = await json(await fetcher(`${API}/transcribe`, { method: 'POST', mode: 'cors', body: form }));
          const text = document.querySelector('#voice-text');
          if (text && typeof result.text === 'string') { text.value = result.text.trim(); text.dispatchEvent(new Event('input', { bubbles: true })); }
          status(result.text?.trim() ? 'Transcript ready. Review it before using it in a plan.' : 'Voicebox returned an empty transcript.');
        } catch (error) { status(error.message.includes('being downloaded') ? `Voicebox is preparing its transcription model. ${error.message}` : `Transcription failed: ${error.message}`); }
      };
      recorder.start(); controls(); status('Listening. Press Stop when you finish.');
    } catch (error) { cancelRecording(); status(`Microphone unavailable: ${error.message}`); }
  }
  function stopRecording() { if (recorder?.state === 'recording') { status('Finishing recording…'); recorder.stop(); } }
  async function speak() {
    const text = document.querySelector('#voice-text')?.value.trim();
    if (!text) { status('Enter text to speak first.'); return; }
    stopPlayback();
    const current = generation;
    const profile = document.querySelector('#voice-profile')?.value.trim();
    status('Voicebox is generating speech…');
    try {
      const request = { text: text.slice(0, 10000), personality: false };
      if (profile) request.profile = profile;
      const created = await json(await fetcher(`${API}/speak`, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }));
      if (!/^[a-f0-9-]{36}$/i.test(created.id || '')) throw new Error('Voicebox returned an invalid generation ID.');
      for (let attempt = 0; attempt < 300 && current === generation; attempt++) {
        const item = await json(await fetcher(`${API}/history/${created.id}`, { mode: 'cors' }));
        if (item.status === 'failed') throw new Error(item.error || 'Voice generation failed.');
        if (item.status === 'completed') {
          const audio = await fetcher(`${API}/audio/${created.id}`, { mode: 'cors' });
          if (!audio.ok) throw new Error('Voicebox audio was unavailable.');
          const blob = await audio.blob();
          if (current !== generation) return;
          audioUrl = URL.createObjectURL(blob);
          player = new AudioPlayer(audioUrl);
          player.onended = () => { status('Speech finished.'); if (audioUrl) URL.revokeObjectURL(audioUrl); audioUrl = null; player = null; };
          await player.play(); status('Speaking through Voicebox.'); return;
        }
        await wait(1000);
      }
      if (current === generation) throw new Error('Voicebox took too long. Try again.');
    } catch (error) { if (current === generation) status(`Speech failed: ${error.message}`); }
  }
  function speakInBrowser() {
    const text = document.querySelector('#voice-text')?.value.trim();
    if (!text) { status('Enter text to speak first.'); return; }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { status('Browser speech is unavailable here.'); return; }
    stopPlayback();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 10000));
    utterance.onend = () => status('Browser speech finished.');
    utterance.onerror = () => status('Browser speech failed.');
    window.speechSynthesis.speak(utterance);
    status('Speaking with the browser voice.');
  }
  return {
    bind(getLatestResult) {
      document.querySelector('#voice-check')?.addEventListener('click', check);
      document.querySelector('#voice-record')?.addEventListener('click', record);
      document.querySelector('#voice-stop')?.addEventListener('click', stopRecording);
      document.querySelector('#voice-speak')?.addEventListener('click', speak);
      document.querySelector('#voice-browser')?.addEventListener('click', speakInBrowser);
      document.querySelector('#voice-stop-playback')?.addEventListener('click', stopPlayback);
      document.querySelector('#voice-text')?.addEventListener('input', controls);
      document.querySelector('#voice-use')?.addEventListener('click', () => {
        const transcript = document.querySelector('#voice-text')?.value.trim();
        const target = document.querySelector('#plan-input');
        if (!target || !transcript) { status('Record or type a transcript first.'); return; }
        document.querySelector('#plan-action').value = 'add_task';
        document.querySelector('#plan-action').dispatchEvent(new Event('change'));
        target.value = transcript.slice(0, 300); target.focus();
        status('Copied into the task plan. Review it, then generate a plan.');
      });
      document.querySelector('#voice-result')?.addEventListener('click', () => {
        const result = getLatestResult?.();
        if (!result) { status('Jarvis has no verified result to speak yet.'); return; }
        const text = document.querySelector('#voice-text'); text.value = result; controls(); speak();
      });
      controls();
    },
    stopPlayback,
    cancelRecording
  };
}
