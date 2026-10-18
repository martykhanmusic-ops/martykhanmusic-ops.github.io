import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSuggestion } from '../halo/local-llm.js';

test('local model suggestions accept only supported draft fields', () => {
  assert.deepEqual(parseSuggestion('{"action":"add_task","input":"Record vocals"}'), { action: 'add_task', input: 'Record vocals' });
  assert.deepEqual(parseSuggestion('{"action":"summarize","input":"ignored"}'), { action: 'summarize', input: '' });
  for (const text of ['{"action":"delete_completed","input":"all"}', '{"action":"run_shell","input":"cmd"}', '{"action":"add_task","input":""}', 'not json']) {
    assert.throws(() => parseSuggestion(text));
  }
});
