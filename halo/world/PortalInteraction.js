const NEXT = Object.freeze({
  idle: ['near','preview'], near: ['idle','preview'], preview: ['requested','returning'],
  requested: ['transitioning','returning'], transitioning: ['open','returning'],
  open: ['returning'], returning: ['idle','near']
});

export function createPortalInteraction(onChange = () => {}) {
  let state = 'idle', portalId = null;
  function transition(next, id = portalId) {
    if (!NEXT[state]?.includes(next)) return false;
    state = next;
    portalId = next === 'idle' ? null : id;
    onChange({ state, portalId });
    return true;
  }
  return {
    get: () => ({ state, portalId }),
    transition,
    proximity(id) {
      if (!['idle','near'].includes(state)) return false;
      if (id === portalId && state === 'near') return true;
      if (!id && state === 'idle') return true;
      if (state === 'near' && id) transition('idle');
      return transition(id ? 'near' : 'idle', id);
    }
  };
}
