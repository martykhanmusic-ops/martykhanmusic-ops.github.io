const kinds = Object.freeze({ artists: 'artists', recordings: 'recordings', releases: 'release-groups' });
const resources = Object.freeze({ artists: 'artist', recordings: 'recording', releases: 'release-group' });
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function credit(item) {
  if (!Array.isArray(item['artist-credit'])) return '';
  return item['artist-credit'].filter(part => part && typeof part.name === 'string').map(part => part.name).join(', ').slice(0, 160);
}

export function parseMusicResults(payload, kind) {
  const key = kinds[kind];
  if (!key || !payload || !Array.isArray(payload[key])) throw new Error('Music reference returned an invalid response.');
  return payload[key].slice(0, 8).filter(item => item && typeof item.id === 'string' && idPattern.test(item.id) && typeof (kind === 'artists' ? item.name : item.title) === 'string').map(item => {
    const name = (kind === 'artists' ? item.name : item.title).slice(0, 160);
    const detail = kind === 'artists'
      ? [item.type, item.country].filter(value => typeof value === 'string').join(' · ')
      : kind === 'recordings'
        ? [credit(item), item['first-release-date']].filter(value => typeof value === 'string' && value).join(' · ')
        : [credit(item), item['primary-type'], item['first-release-date']].filter(value => typeof value === 'string' && value).join(' · ');
    return { id: item.id, name, detail: detail.slice(0, 240), href: `https://musicbrainz.org/${resources[kind]}/${item.id}` };
  });
}

export function createMusicReference({ fetcher = fetch } = {}) {
  let controller;
  function bind() {
    const form = document.querySelector('#music-search');
    if (!form) return;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const query = form.elements.name.value.trim();
      const kind = form.elements.kind.value;
      const status = document.querySelector('#music-status');
      const results = document.querySelector('#music-results');
      if (query.length < 2 || query.length > 80) { status.textContent = 'Enter a search term with 2–80 characters.'; return; }
      if (!Object.hasOwn(kinds, kind)) { status.textContent = 'Choose a supported search type.'; return; }
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      status.textContent = 'Searching MusicBrainz…';
      results.replaceChildren();
      try {
        const response = await fetcher(`/public-data/${kind}?name=${encodeURIComponent(query)}`, { signal: current.signal });
        if (!response.ok) throw new Error(response.status === 429 ? 'Please wait a moment before searching again.' : response.status === 503 ? 'MusicBrainz is unavailable. Try again later.' : 'Music search failed. Try again later.');
        const matches = parseMusicResults(await response.json(), kind);
        if (current !== controller || !results.isConnected) return;
        status.textContent = matches.length ? `${matches.length} ${kind} found. Reference only; nothing was saved to your projects.` : `No ${kind} found.`;
        for (const match of matches) {
          const row = document.createElement('article');
          row.className = 'artist-row';
          const link = document.createElement('a');
          link.href = match.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = match.name;
          const detail = document.createElement('small');
          detail.textContent = match.detail;
          row.append(link, detail);
          results.append(row);
        }
      } catch (error) {
        if (current !== controller || !results.isConnected || error.name === 'AbortError') return;
        status.textContent = error.message;
      }
    });
  }
  return { bind };
}
