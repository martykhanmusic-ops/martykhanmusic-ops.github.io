const SUPPORTED = new Set(['add_task', 'append_note', 'summarize']);

export function parseSuggestion(raw) {
  if (typeof raw !== 'string' || raw.length > 10000) throw new Error('The model returned an invalid draft.');
  let value;
  try { value = JSON.parse(raw.trim()); } catch { throw new Error('The model did not return a valid JSON draft.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value) || !SUPPORTED.has(value.action)) throw new Error('The model suggested an unsupported action.');
  if (typeof value.input !== 'string' || value.input.length > 10000 || (value.action === 'add_task' && value.input.length > 300) || (value.action !== 'summarize' && !value.input.trim())) throw new Error('The model returned invalid draft text.');
  return { action: value.action, input: value.action === 'summarize' ? '' : value.input.trim() };
}

export function createLocalLlm(fetcher = fetch) {
  let busy = false;
  const status = message => { const el = document.querySelector('#llm-status'); if (el) el.textContent = message; };
  async function models() {
    try {
      const response = await fetcher('/local-llm/models');
      if (!response.ok) throw new Error();
      const data = await response.json();
      const names = (Array.isArray(data.models) ? data.models : []).map(model => model.name).filter(name => typeof name === 'string' && /^[\w.:-]{1,120}$/.test(name));
      const select = document.querySelector('#llm-model');
      select.replaceChildren(...names.map(name => new Option(name, name)));
      status(names.length ? `${names.length} local model(s) available. Choose one to draft a plan.` : 'The local service is running, but no model is installed.');
    } catch { status('Local LLM unavailable. Start Ollama and install a model to use draft suggestions.'); }
  }
  async function suggest() {
    if (busy) return;
    const model = document.querySelector('#llm-model')?.value;
    const prompt = document.querySelector('#llm-request')?.value.trim();
    if (!model || !prompt) { status('Choose a local model and enter a request.'); return; }
    busy = true;
    document.querySelector('#llm-suggest').disabled = true;
    status('Asking the local model for a draft. No Jarvis plan or action has been created.');
    try {
      const response = await fetcher('/local-llm/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, stream: false, messages: [
        { role: 'system', content: 'Return only a JSON object with action and input. Allowed actions: add_task (task title, max 300 characters), append_note (note text), summarize (empty input). Do not execute actions. If the request is outside these actions, return {"action":"summarize","input":""}.' },
        { role: 'user', content: prompt.slice(0, 2000) }
      ] }) });
      if (!response.ok) throw new Error(`Local model returned HTTP ${response.status}.`);
      const data = await response.json();
      const draft = parseSuggestion(data?.message?.content);
      const action = document.querySelector('#plan-action');
      action.value = draft.action;
      action.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('#plan-input').value = draft.input;
      status('Draft copied into the Jarvis form. Review and edit it, then choose Generate plan. Nothing has run.');
      action.focus();
    } catch (error) { status(error.message || 'The local model could not draft a plan.'); }
    finally { busy = false; const button = document.querySelector('#llm-suggest'); if (button) button.disabled = false; }
  }
  return { bind() {
    document.querySelector('#llm-refresh')?.addEventListener('click', models);
    document.querySelector('#llm-suggest')?.addEventListener('click', suggest);
    document.querySelector('#llm-use-voice')?.addEventListener('click', () => {
      const text = document.querySelector('#voice-text')?.value.trim() || '';
      if (!text) { status('Record or type voice text first.'); return; }
      document.querySelector('#llm-request').value = text.slice(0, 2000);
      status('Voice text copied into the local model request. Review it before suggesting a draft.');
    });
  } };
}
