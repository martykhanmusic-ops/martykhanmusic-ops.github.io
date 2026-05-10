const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('daysuDesktop', {
  platform: process.platform,
  isDesktop: true
});

window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dataset.platform = process.platform;
  document.documentElement.dataset.runtime = 'desktop';
});
