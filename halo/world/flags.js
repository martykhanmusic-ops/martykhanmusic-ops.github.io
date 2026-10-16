export function worldEnabled(location, storage) {
  if (new URLSearchParams(location.search).get('world') === '1') return true;
  try { return storage.getItem('halo.world.enabled.v1') === 'true'; } catch { return false; }
}
