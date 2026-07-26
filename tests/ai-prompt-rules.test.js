import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getAiPromptMaxTokens,
    normalizeAiPromptOutputCapacity,
} from '../features/ai-prompt/ai-prompt-rules.js';

const DEFAULTS = Object.freeze({
    aiPromptResponseLength: 4096,
    aiPromptThinkingBudget: 2048,
});

test('output capacity maps to provider tokens without a word-to-token multiplier', () => {
    assert.equal(getAiPromptMaxTokens({
        responseLength: 4096,
        thinkingMode: 'default',
    }, DEFAULTS), 4096);

    assert.equal(getAiPromptMaxTokens({
        responseLength: 4096,
        thinkingMode: 'enabled',
        thinkingBudget: 2048,
    }, DEFAULTS), 6144);
});

test('legacy low response lengths migrate to the output-capacity floor', () => {
    assert.equal(normalizeAiPromptOutputCapacity(350, DEFAULTS), 4096);
    assert.equal(normalizeAiPromptOutputCapacity(4096, DEFAULTS), 4096);
    assert.equal(normalizeAiPromptOutputCapacity(12000, DEFAULTS), 12000);
});
