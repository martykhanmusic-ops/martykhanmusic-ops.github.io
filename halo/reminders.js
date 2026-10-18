export function dueReminders(reminders, at = Date.now()) {
  return reminders.filter(item => item.status === 'pending' && Date.parse(item.dueAt) <= at);
}

export function createReminders(store, { NotificationClass = globalThis.Notification } = {}) {
  const $ = selector => document.querySelector(selector);
  let lastList, lastKey;
  const status = message => { const el = $('#reminder-status'); if (el) el.textContent = message; };
  const formatted = date => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  function render(state = store.get()) {
    const due = dueReminders(state.reminders);
    const badge = $('#reminder-badge');
    badge.hidden = !due.length;
    badge.textContent = `${due.length} reminder${due.length === 1 ? '' : 's'} due`;
    const list = $('#reminder-list');
    if (!list) return;
    const key = JSON.stringify(state.reminders) + '|' + due.length;
    if (list === lastList && key === lastKey) return;
    lastList = list; lastKey = key;
    const items = [...state.reminders].sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || Date.parse(a.dueAt) - Date.parse(b.dueAt));
    list.replaceChildren(...items.map(item => {
      const row = document.createElement('article');
      row.className = 'reminder-row';
      const content = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = item.title;
      const detail = document.createElement('small');
      detail.textContent = `${item.status === 'pending' && Date.parse(item.dueAt) <= Date.now() ? 'Due now' : item.status} · ${formatted(item.dueAt)}`;
      content.append(title, detail);
      const actions = document.createElement('div'); actions.className = 'reminder-actions';
      for (const [action, label] of item.status === 'pending' ? [['done','Done'],['cancelled','Cancel']] : [['remove','Remove']]) {
        const button = document.createElement('button');
        button.type = 'button'; button.dataset.reminderAction = action; button.dataset.reminderId = item.id; button.textContent = label;
        actions.append(button);
      }
      row.append(content, actions);
      return row;
    }));
    if (!items.length) { const empty = document.createElement('p'); empty.className = 'muted'; empty.textContent = 'No reminders yet.'; list.append(empty); }
  }

  async function enableAlerts() {
    if (!NotificationClass?.requestPermission) { status('Browser notifications are unavailable. Due reminders will still appear in Halo while it is open.'); return; }
    try {
      const permission = await NotificationClass.requestPermission();
      status(permission === 'granted' ? 'Browser alerts enabled while Halo is open.' : 'Browser alerts were not enabled. Due reminders remain visible in Halo.');
      tick();
    } catch { status('Browser alerts could not be enabled. Due reminders remain visible in Halo.'); }
  }

  function tick() {
    const due = dueReminders(store.get().reminders);
    render();
    if (NotificationClass?.permission !== 'granted') return;
    for (const item of due.filter(reminder => !reminder.alertedAt)) {
      try {
        new NotificationClass('Halo reminder', { body: item.title, tag: `halo-reminder-${item.id}` });
        store.markReminderAlerted(item.id);
      } catch (error) { status(`Browser alert failed: ${error.message}`); }
    }
  }

  function bind() {
    $('#reminder-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      const title = form.elements.title.value;
      const localTime = form.elements.due.value;
      try {
        store.addReminder(title, new Date(localTime).toISOString());
        form.reset();
        status('Reminder saved. Halo will check it while this page is open.');
        tick();
      } catch (error) { status(error.message); }
    });
    $('#reminder-alerts')?.addEventListener('click', enableAlerts);
    $('#reminder-list')?.addEventListener('click', event => {
      const button = event.target.closest('[data-reminder-action]');
      if (!button) return;
      const { reminderAction: action, reminderId: id } = button.dataset;
      if (action === 'remove' && !confirm('Remove this reminder from Halo?')) return;
      try {
        if (action === 'remove') store.removeReminder(id);
        else store.setReminderStatus(id, action);
        status(action === 'done' ? 'Reminder marked done.' : action === 'cancelled' ? 'Reminder cancelled.' : 'Reminder removed.');
      } catch (error) { status(error.message); }
    });
  }

  function start() {
    tick();
    setInterval(tick, 15000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  }
  return { bind, render, start, tick };
}
