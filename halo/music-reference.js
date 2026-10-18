export function parseArtistResults(payload) {
  if (!payload || !Array.isArray(payload.artists)) throw new Error('Music reference returned an invalid response.');
  return payload.artists.slice(0, 8).filter(item => item && typeof item.id === 'string' && /^[0-9a-f-]{36}$/i.test(item.id) && typeof item.name === 'string').map(item => ({
    id: item.id,
    name: item.name.slice(0, 160),
    type: typeof item.type === 'string' ? item.type.slice(0, 50) : '',
    country: typeof item.country === 'string' ? item.country.slice(0, 8) : '',
    score: Number.isFinite(item.score) ? item.score : null
  }));
}

export function createMusicReference({ fetcher = fetch } = {}) {
  let controller;
  function bind() {
    const form = document.querySelector('#artist-search');
    if (!form) return;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const query = form.elements.name.value.trim();
      const status = document.querySelector('#artist-status');
      const results = document.querySelector('#artist-results');
      if (query.length < 2 || query.length > 80) { status.textContent = 'Enter an artist name with 2–80 characters.'; return; }
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      status.textContent = 'Searching MusicBrainz…';
      results.replaceChildren();
      try {
        const response = await fetcher(`/public-data/artists?name=${encodeURIComponent(query)}`, { signal: current.signal });
        if (!response.ok) throw new Error(response.status === 429 ? 'Please wait a moment before searching again.' : response.status === 503 ? 'MusicBrainz is unavailable. Try again later.' : 'Artist search failed. Try again later.');
        const artists = parseArtistResults(await response.json());
        if (current !== controller || !results.isConnected) return;
        status.textContent = artists.length ? `${artists.length} artist matches. Reference only; nothing was saved to your projects.` : 'No artist matches found.';
        for (const artist of artists) {
          const row = document.createElement('article');
          row.className = 'artist-row';
          const link = document.createElement('a');
          link.href = `https://musicbrainz.org/artist/${artist.id}`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = artist.name;
          const detail = document.createElement('small');
          detail.textContent = [artist.type, artist.country].filter(Boolean).join(' · ');
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
