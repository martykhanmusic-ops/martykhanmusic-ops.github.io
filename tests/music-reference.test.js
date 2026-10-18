import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMusicResults } from '../halo/music-reference.js';

test('music reference accepts bounded artist metadata and discards unsafe IDs', () => {
  const result = parseMusicResults({ artists: [
    { id: '0383dadf-2a4e-4d10-a46a-e9e041da8eb3', name: '<Artist>', type: 'Person', country: 'US', score: 99 },
    { id: 'javascript:alert(1)', name: 'Bad' }
  ] }, 'artists');
  assert.deepEqual(result, [{ id: '0383dadf-2a4e-4d10-a46a-e9e041da8eb3', name: '<Artist>', detail: 'Person · US', href: 'https://musicbrainz.org/artist/0383dadf-2a4e-4d10-a46a-e9e041da8eb3' }]);
  assert.throws(() => parseMusicResults({ error: 'unavailable' }, 'artists'), /invalid response/);
});
test('recording and release groups show bounded credits and fixed MusicBrainz links', () => {
  const id = '0383dadf-2a4e-4d10-a46a-e9e041da8eb3';
  const recording = parseMusicResults({ recordings: [{ id, title: 'Song', 'artist-credit': [{ name: 'Singer' }], 'first-release-date': '2020-01-01' }] }, 'recordings')[0];
  assert.deepEqual(recording, { id, name: 'Song', detail: 'Singer · 2020-01-01', href: `https://musicbrainz.org/recording/${id}` });
  const release = parseMusicResults({ 'release-groups': [{ id, title: 'Album', 'artist-credit': [{ name: 'Singer' }], 'primary-type': 'Album' }] }, 'releases')[0];
  assert.deepEqual(release, { id, name: 'Album', detail: 'Singer · Album', href: `https://musicbrainz.org/release-group/${id}` });
  assert.throws(() => parseMusicResults({}, 'unknown'), /invalid response/);
});
