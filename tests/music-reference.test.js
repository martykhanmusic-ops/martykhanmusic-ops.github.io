import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArtistResults } from '../halo/music-reference.js';

test('music reference accepts bounded artist metadata and discards unsafe IDs', () => {
  const result = parseArtistResults({ artists: [
    { id: '0383dadf-2a4e-4d10-a46a-e9e041da8eb3', name: '<Artist>', type: 'Person', country: 'US', score: 99 },
    { id: 'javascript:alert(1)', name: 'Bad' }
  ] });
  assert.deepEqual(result, [{ id: '0383dadf-2a4e-4d10-a46a-e9e041da8eb3', name: '<Artist>', type: 'Person', country: 'US', score: 99 }]);
  assert.throws(() => parseArtistResults({ error: 'unavailable' }), /invalid response/);
});
