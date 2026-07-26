import assert from 'node:assert/strict';
import test from 'node:test';

import { createImagePromptProviderAdapter } from '../features/ai-prompt/image-prompt-provider-adapter.js';

test('OpenAI adapter maps structured system and user content without mixing them', async () => {
    const calls = [];
    const serviceDeps = { marker: 'service-deps' };
    const adapter = createImagePromptProviderAdapter({
        generateQuietPrompt: async () => {
            throw new Error('unexpected SillyTavern call');
        },
        getAiPromptServiceDeps: () => serviceDeps,
        generateOpenAICompatible: async (settings, userText, deps) => {
            calls.push({ settings, userText, deps });
            return { text: 'result' };
        },
        generateAnthropic: async () => {
            throw new Error('unexpected Anthropic call');
        },
    });
    const settings = {
        provider: 'openai_compatible',
        instruction: 'old instruction',
        responseLength: 350,
        webSearchMaxCalls: 3,
    };
    const runState = adapter.createRunState(settings);

    const result = await adapter.complete({
        settings,
        systemText: 'SYSTEM_TEXT_ONLY',
        userText: 'USER_TEXT_ONLY',
        responseLength: 8192,
        runState,
        task: 'single',
    });

    assert.equal(result.text, 'result');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].settings.instruction, 'SYSTEM_TEXT_ONLY');
    assert.equal(calls[0].settings.responseLength, 8192);
    assert.equal(calls[0].userText, 'USER_TEXT_ONLY');
    assert.equal(calls[0].deps.marker, 'service-deps');
    assert.equal(calls[0].deps.toolBudget, runState.toolBudget);
});

test('SillyTavern adapter uses the isolated raw-generation system and user fields', async () => {
    const calls = [];
    const adapter = createImagePromptProviderAdapter({
        generateRaw: async (...args) => {
            const [options] = args;
            calls.push(options);
            return 'SillyTavern result';
        },
        generateQuietPrompt: async () => {
            throw new Error('unexpected legacy quiet generation call');
        },
        getAiPromptServiceDeps: () => ({}),
    });
    const settings = {
        provider: 'sillytavern',
        webSearchMaxCalls: 3,
    };

    const result = await adapter.complete({
        settings,
        systemText: 'SYSTEM_TEXT_ONLY',
        userText: 'USER_TEXT_ONLY',
        responseLength: 8192,
        task: 'single',
    });

    assert.equal(result.text, 'SillyTavern result');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].responseLength, 8192);
    assert.equal(calls[0].systemPrompt, 'SYSTEM_TEXT_ONLY');
    assert.deepEqual(calls[0].prompt, [{ role: 'user', content: 'USER_TEXT_ONLY' }]);
    assert.equal(calls[0].trimNames, false);
});

test('SillyTavern adapter falls back when generateRaw still has a positional signature', async () => {
    const quietCalls = [];
    let positionalCalls = 0;
    const adapter = createImagePromptProviderAdapter({
        generateRaw: async function legacyGenerateRaw(_prompt, _api) {
            positionalCalls += 1;
            return 'wrong legacy path';
        },
        generateQuietPrompt: async options => {
            quietCalls.push(options);
            return 'legacy fallback result';
        },
        getAiPromptServiceDeps: () => ({}),
    });

    const result = await adapter.complete({
        settings: { provider: 'sillytavern', webSearchMaxCalls: 3 },
        systemText: 'SYSTEM_TEXT_ONLY',
        userText: 'USER_TEXT_ONLY',
        responseLength: 4096,
        task: 'single',
    });

    assert.equal(result.text, 'legacy fallback result');
    assert.equal(positionalCalls, 0);
    assert.equal(quietCalls.length, 1);
});

test('SillyTavern adapter keeps an explicitly partitioned legacy fallback', async () => {
    const calls = [];
    const adapter = createImagePromptProviderAdapter({
        generateQuietPrompt: async options => {
            calls.push(options);
            return 'legacy SillyTavern result';
        },
        getAiPromptServiceDeps: () => ({}),
    });

    const result = await adapter.complete({
        settings: {
            provider: 'sillytavern',
            webSearchMaxCalls: 3,
        },
        systemText: 'SYSTEM_TEXT_ONLY',
        userText: 'USER_TEXT_ONLY',
        responseLength: 4096,
        task: 'single',
    });

    assert.equal(result.text, 'legacy SillyTavern result');
    assert.equal(calls.length, 1);
    assert.match(calls[0].quietPrompt, /BEGIN_CONFIGURED_SYSTEM_INSTRUCTIONS\nSYSTEM_TEXT_ONLY/);
    assert.match(calls[0].quietPrompt, /BEGIN_UNTRUSTED_USER_DATA\nUSER_TEXT_ONLY/);
    assert.equal(calls[0].skipWIAN, true);
    assert.equal(calls[0].responseLength, 4096);
});

test('provider truncation errors are normalized to a stable engine error code', async () => {
    const adapter = createImagePromptProviderAdapter({
        generateQuietPrompt: async () => '',
        getAiPromptServiceDeps: () => ({}),
        generateOpenAICompatible: async () => {
            throw new Error('AI 绘图 API 输出被截断（finish_reason=length）');
        },
    });

    await assert.rejects(
        adapter.complete({
            settings: {
                provider: 'openai_compatible',
                webSearchMaxCalls: 3,
            },
            systemText: 'system',
            userText: 'user',
            responseLength: 4096,
            task: 'single',
        }),
        error => error?.code === 'OUTPUT_TRUNCATED',
    );
});
