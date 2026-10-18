import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSuggestion, projectChatContext } from '../halo/local-llm.js';

test('local model suggestions accept only supported draft fields', () => {
  assert.deepEqual(parseSuggestion('{"action":"add_task","input":"Record vocals"}'), { action: 'add_task', input: 'Record vocals' });
  assert.deepEqual(parseSuggestion('{"action":"summarize","input":"ignored"}'), { action: 'summarize', input: '' });
  for (const text of ['{"action":"delete_completed","input":"all"}', '{"action":"run_shell","input":"cmd"}', '{"action":"add_task","input":""}', 'not json']) {
    assert.throws(() => parseSuggestion(text));
  }
});
test('Jarvis project context is bounded and excludes local file paths and note bodies', () => {
  const context = projectChatContext({ activeProjectId: 'p', projects: [{ id: 'p', name: 'Album', description: 'Working on the chorus', notes: 'Private full draft', tasks: [{ title: 'Record vocals', done: false }], musicResources: [{ kind: 'daw-project', name: 'Beat', root: 'C:\\Private', relative: 'secret.als' }], sessions: [{ focus: 'Mix', recap: 'Balance the bass', endedAt: null }] }] });
  assert.match(context, /Record vocals/);
  assert.match(context, /Balance the bass/);
  assert.doesNotMatch(context, /Private full draft|C:\\Private|secret.als/);
});
