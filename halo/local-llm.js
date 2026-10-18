const SUPPORTED = new Set(['add_task', 'append_note', 'summarize']);

export function parseSuggestion(raw) {
  if (typeof raw !== 'string' || raw.length > 10000) throw new Error('The model returned an invalid draft.');
  let value;
  try { value = JSON.parse(raw.trim()); } catch { throw new Error('The model did not return a valid JSON draft.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value) || !SUPPORTED.has(value.action)) throw new Error('The model suggested an unsupported action.');
  if (typeof value.input !== 'string' || value.input.length > 10000 || (value.action === 'add_task' && value.input.length > 300) || (value.action !== 'summarize' && !value.input.trim())) throw new Error('The model returned invalid draft text.');
  return { action: value.action, input: value.action === 'summarize' ? '' : value.input.trim() };
}

export function createLocalLlm(store, fetcher = fetch) {
  let busy = false;
  const status = message => { const el = document.querySelector('#llm-status'); if (el) el.textContent = message; };
  const chatStatus = message => { const el = document.querySelector('#chat-status'); if (el) el.textContent = message; };
  function renderChat(messages) {
    const log = document.querySelector('#chat-log');
    if (!log) return;
    log.replaceChildren(...messages.map(message => {
      const article = document.createElement('article');
      article.className = `chat-message chat-${message.role}`;
      const label = document.createElement('strong');
      label.textContent = message.role === 'user' ? 'You' : 'Jarvis · local model';
      const body = document.createElement('p');
      body.textContent = message.text;
      article.append(label, body);
      return article;
    }));
    if (!messages.length) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = 'No messages yet. Find a model and start the conversation.';
      log.append(empty);
    }
    log.scrollTop = log.scrollHeight;
  }
  async function models() {
    try {
      const response = await fetcher('/local-llm/models');
      if (!response.ok) throw new Error();
      const data = await response.json();
      const names = (Array.isArray(data.models) ? data.models : []).map(model => model.name).filter(name => typeof name === 'string' && /^[\w.:-]{1,120}$/.test(name) && !/cloud/i.test(name));
      for (const selector of ['#llm-model', '#chat-model']) {
        const select = document.querySelector(selector);
        const prior = select?.value;
        if (!select) continue;
        select.replaceChildren(...names.map(name => new Option(name, name)));
        if (names.includes(prior)) select.value = prior;
      }
      status(names.length ? `${names.length} local model(s) available. Choose one to draft a plan.` : 'The local service is running, but no model is installed.');
      chatStatus(names.length ? `${names.length} local model(s) available. Chat stays on this computer.` : 'The local service is running, but no model is installed.');
    } catch { status('Local LLM unavailable. Start Ollama and install a model to use draft suggestions.'); chatStatus('Local model is unavailable. Your saved chat remains here.'); }
  }
  async function sendChat(event) {
    event.preventDefault();
    if (busy) return;
    const model = document.querySelector('#chat-model')?.value;
    const input = document.querySelector('#chat-input');
    const prompt = input?.value.trim();
    if (!model || !prompt) { chatStatus('Choose a local model and enter a message.'); return; }
    const prior = store.get().chat.slice(-6).map(message => ({ role: message.role, content: message.text.slice(0, 900) }));
    busy = true;
    const button = document.querySelector('#chat-send');
    button.disabled = true;
    chatStatus('Jarvis is thinking locally. No tool or plan is running.');
    try {
      const response = await fetcher('/local-llm/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, stream: false, messages: [
        { role: 'system', content: 'You are Jarvis in Halo, a local conversational assistant. Answer clearly and briefly. You have no tool access. Do not claim to create plans, change projects, inspect the computer, or run actions. If asked to do one, explain that the user must use the separate Jarvis plan and permission controls.' },
        ...prior, { role: 'user', content: prompt }
      ] }) });
      if (!response.ok) throw new Error(`Local model returned HTTP ${response.status}.`);
      const data = await response.json();
      const reply = data?.message?.content;
      if (typeof reply !== 'string' || !reply.trim() || reply.length > 4000) throw new Error('The local model returned an invalid reply.');
      store.addChatExchange(prompt, reply);
      if (input?.isConnected) input.value = '';
      chatStatus('Reply saved in your Halo workspace. Chat has not run a tool.');
    } catch (error) { chatStatus(`${error.message || 'Chat failed.'} Your message is still in the box; try again when the model is ready.`); }
    finally { busy = false; if (button?.isConnected) button.disabled = false; }
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
      const response = await fetcher('/local-llm/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, stream: false, format: 'json', messages: [
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
  return { renderChat, bind() {
    document.querySelector('#llm-refresh')?.addEventListener('click', models);
    document.querySelector('#chat-models')?.addEventListener('click', models);
    document.querySelector('#chat-form')?.addEventListener('submit', sendChat);
    document.querySelector('#chat-use-voice')?.addEventListener('click', () => {
      const text = document.querySelector('#voice-text')?.value.trim() || '';
      if (!text) { chatStatus('Record or type voice text first.'); return; }
      document.querySelector('#chat-input').value = text.slice(0, 2000);
      chatStatus('Voice text copied to chat. Review it before sending.');
    });
    document.querySelector('#chat-to-voice')?.addEventListener('click', () => {
      const latest = [...store.get().chat].reverse().find(message => message.role === 'assistant');
      if (!latest) { chatStatus('There is no Jarvis reply to speak yet.'); return; }
      const text = document.querySelector('#voice-text');
      text.value = latest.text;
      text.dispatchEvent(new Event('input', { bubbles: true }));
      chatStatus('Latest reply copied to the voice box. Choose Speak with Voicebox when ready.');
    });
    document.querySelector('#chat-clear')?.addEventListener('click', () => {
      if (busy) { chatStatus('Wait for the current reply before clearing chat.'); return; }
      if (!store.get().chat.length) return;
      if (confirm('Clear the saved Jarvis chat? Export a Halo backup first if you want to keep it.')) {
        try { store.clearChat(); chatStatus('Saved Jarvis chat cleared.'); } catch (error) { chatStatus(error.message); }
      }
    });
    document.querySelector('#llm-suggest')?.addEventListener('click', suggest);
    document.querySelector('#llm-use-voice')?.addEventListener('click', () => {
      const text = document.querySelector('#voice-text')?.value.trim() || '';
      if (!text) { status('Record or type voice text first.'); return; }
      document.querySelector('#llm-request').value = text.slice(0, 2000);
      status('Voice text copied into the local model request. Review it before suggesting a draft.');
    });
  } };
}
