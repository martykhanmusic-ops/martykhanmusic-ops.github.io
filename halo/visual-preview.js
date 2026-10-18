const KEY = 'halo.visual-package.v1';
const sheet = document.querySelector('#halo-visual-package');
const dialog = document.querySelector('#visual-dialog');
const choices = [...dialog.querySelectorAll('input[name="visual-package"]')];
let saved = 'orbital';

try {
  saved = localStorage.getItem(KEY) === 'classic' ? 'classic' : 'orbital';
} catch { /* Storage can be unavailable; the default remains usable. */ }

function showPackage(value) {
  sheet.disabled = value === 'classic';
  document.documentElement.dataset.visualPackage = value;
}

function closePreview() {
  showPackage(saved);
  dialog.close();
}

showPackage(saved);
document.querySelector('#visual-settings').addEventListener('click', () => {
  choices.find(choice => choice.value === saved).checked = true;
  dialog.showModal();
});
choices.forEach(choice => choice.addEventListener('change', () => showPackage(choice.value)));
document.querySelector('#visual-cancel').addEventListener('click', closePreview);
dialog.addEventListener('cancel', event => { event.preventDefault(); closePreview(); });
document.querySelector('#visual-apply').addEventListener('click', () => {
  const selected = choices.find(choice => choice.checked)?.value || saved;
  try {
    localStorage.setItem(KEY, selected);
  } catch {
    document.querySelector('#status').textContent = 'Appearance preview could not be saved in this browser.';
    closePreview();
    return;
  }
  saved = selected;
  showPackage(saved);
  dialog.close();
});
