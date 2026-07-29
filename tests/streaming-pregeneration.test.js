import test from 'node:test';
import assert from 'node:assert/strict';
import { createStreamingPregeneration } from '../features/ai-prompt/streaming-pregeneration.js';

test('streaming pregeneration consumes only an unchanged stable snapshot', async () => {
    const node = { key: 'm1', text: 'a'.repeat(20) };
    const service = createStreamingPregeneration({
        generateDraft: async () => 'prepared prompt',
        getSettings: async () => ({ enabled: true, maxConcurrent: 1, minChars: 10 }),
        getMessageText: value => value.text,
        getMessageKey: value => value.key,
    });
    assert.equal(await service.maybeStart(node), true);
    assert.equal(service.consume(node), 'prepared prompt');

    const changed = { key: 'm2', text: 'b'.repeat(20) };
    await service.maybeStart(changed);
    changed.text += ' changed';
    assert.equal(service.consume(changed), '');
});
