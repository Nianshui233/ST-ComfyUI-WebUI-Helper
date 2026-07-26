import assert from 'node:assert/strict';
import test from 'node:test';

import { generateAiPromptWithOpenAICompatible } from '../features/ai-prompt/ai-prompt-openai-compatible.js';
import { createAiToolBudget } from '../features/ai-tools/tool-loop.js';

const DEFAULTS = Object.freeze({
    aiPromptApiTimeout: 1000,
    aiPromptThinkingBudget: 2048,
    aiPromptThinkingEffort: 'medium',
    aiPromptThinkingMode: 'default',
    aiPromptThinkingStrategy: 'auto',
});

function createSettings(overrides = {}) {
    return {
        apiKey: 'test-key',
        apiModel: 'test-model',
        apiTemperature: 0.4,
        apiTimeout: 1000,
        apiUrl: 'https://example.test/v1',
        instruction: 'Return a concise image prompt.',
        responseLength: 120,
        thinkingBudget: 2048,
        thinkingEffort: 'medium',
        thinkingMode: 'default',
        thinkingStrategy: 'auto',
        webSearchEnabled: true,
        webSearchMaxCalls: 3,
        ...overrides,
    };
}

function createToolCall(id, query = 'test query') {
    return {
        id,
        type: 'function',
        function: {
            name: 'search_web',
            arguments: JSON.stringify({ query }),
        },
    };
}

function createToolResponse(calls, message = {}) {
    return {
        choices: [{
            finish_reason: 'tool_calls',
            message: {
                role: 'assistant',
                content: null,
                tool_calls: calls,
                ...message,
            },
        }],
    };
}

function createTextResponse(content, finishReason = 'stop') {
    return {
        choices: [{
            finish_reason: finishReason,
            message: {
                role: 'assistant',
                content,
            },
        }],
    };
}

function createHarness(responses, execute = async ({ query }) => ({ query, results: [] })) {
    const queue = [...responses];
    const requests = [];
    const executions = [];
    const webSearchTool = {
        name: 'search_web',
        description: 'Search the web.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string' },
            },
            required: ['query'],
            additionalProperties: false,
        },
        async execute(args, context) {
            executions.push({ args, context });
            return execute(args, context);
        },
    };
    const deps = {
        defaults: DEFAULTS,
        webSearchTool,
        logger: {
            info() {},
            warn() {},
        },
        async makeRequest(options) {
            assert.ok(queue.length, 'unexpected extra completion request');
            requests.push({
                ...options,
                body: JSON.parse(options.data),
            });
            const next = queue.shift();
            if (next instanceof Error) throw next;
            return {
                status: 200,
                responseText: JSON.stringify(next),
            };
        },
    };

    return { deps, executions, requests };
}

test('returns a normal completion without enabling tools', async () => {
    const harness = createHarness([createTextResponse('plain image prompt')]);

    const result = await generateAiPromptWithOpenAICompatible(
        createSettings({ webSearchEnabled: false }),
        'Describe the scene.',
        harness.deps,
    );

    assert.equal(result.text, 'plain image prompt');
    assert.equal(result.attempts, 1);
    assert.equal(result.toolCalls, 0);
    assert.equal(result.toolRounds, 0);
    assert.equal(harness.executions.length, 0);
    assert.equal('tools' in harness.requests[0].body, false);
    assert.equal('tool_choice' in harness.requests[0].body, false);
});

test('sends configured drawing rules only in the system message', async () => {
    const harness = createHarness([createTextResponse('plain image prompt')]);

    await generateAiPromptWithOpenAICompatible(
        createSettings({
            instruction: 'SYSTEM_DRAWING_RULE_SENTINEL',
            webSearchEnabled: false,
        }),
        'USER_CHAT_DATA_SENTINEL',
        harness.deps,
    );

    const [systemMessage, userMessage] = harness.requests[0].body.messages;
    assert.equal(systemMessage.role, 'system');
    assert.match(systemMessage.content, /SYSTEM_DRAWING_RULE_SENTINEL/);
    assert.doesNotMatch(systemMessage.content, /USER_CHAT_DATA_SENTINEL/);
    assert.deepEqual(userMessage, {
        role: 'user',
        content: 'USER_CHAT_DATA_SENTINEL',
    });
});

test('backfills an assistant tool call and matching tool result', async () => {
    const call = createToolCall('call_1', 'OpenAI tools');
    const harness = createHarness([
        createToolResponse([call]),
        createTextResponse('final image prompt'),
    ], async ({ query }) => ({ query, answer: 'found' }));

    const result = await generateAiPromptWithOpenAICompatible(
        createSettings(),
        'Search first.',
        harness.deps,
    );

    assert.equal(result.text, 'final image prompt');
    assert.equal(result.toolCalls, 1);
    assert.equal(result.toolRounds, 1);
    assert.equal(harness.requests[0].body.tools[0].function.name, 'search_web');
    assert.equal(harness.requests[0].body.tool_choice, 'auto');
    assert.deepEqual(harness.requests[1].body.messages.slice(-2), [
        {
            role: 'assistant',
            content: null,
            tool_calls: [call],
        },
        {
            role: 'tool',
            tool_call_id: 'call_1',
            content: JSON.stringify({ query: 'OpenAI tools', answer: 'found' }),
        },
    ]);
});

test('preserves DeepSeek reasoning fields exactly during tool backfill', async () => {
    const call = createToolCall('deepseek_1', 'DeepSeek tools');
    const reasoningContent = '  keep this reasoning exactly\n';
    const reasoningDetails = [{ type: 'reasoning.text', text: 'raw detail' }];
    const harness = createHarness([
        createToolResponse([call], {
            content: 'I will search.',
            reasoning_content: reasoningContent,
            reasoning_details: reasoningDetails,
        }),
        createTextResponse('DeepSeek final prompt'),
    ]);

    await generateAiPromptWithOpenAICompatible(
        createSettings({ apiModel: 'deepseek-reasoner', thinkingStrategy: 'deepseek' }),
        'Search first.',
        harness.deps,
    );

    const assistant = harness.requests[1].body.messages.at(-2);
    assert.equal(assistant.role, 'assistant');
    assert.equal(assistant.content, 'I will search.');
    assert.deepEqual(assistant.tool_calls, [call]);
    assert.equal(assistant.reasoning_content, reasoningContent);
    assert.deepEqual(assistant.reasoning_details, reasoningDetails);
});

test('preserves each DeepSeek reasoning block across multiple tool rounds', async () => {
    const firstCall = createToolCall('deepseek_round_1', 'first round');
    const secondCall = createToolCall('deepseek_round_2', 'second round');
    const harness = createHarness([
        createToolResponse([firstCall], { reasoning_content: 'reasoning one' }),
        createToolResponse([secondCall], { reasoning_content: 'reasoning two' }),
        createTextResponse('DeepSeek final prompt'),
    ]);

    await generateAiPromptWithOpenAICompatible(
        createSettings({ apiModel: 'deepseek-reasoner', thinkingStrategy: 'deepseek' }),
        'Search twice.',
        harness.deps,
    );

    const finalMessages = harness.requests[2].body.messages;
    const assistantMessages = finalMessages.filter(message => message.role === 'assistant');
    assert.equal(assistantMessages.length, 2);
    assert.equal(assistantMessages[0].reasoning_content, 'reasoning one');
    assert.equal(assistantMessages[1].reasoning_content, 'reasoning two');
});

test('returns an opaque tool call id without trimming it', async () => {
    const opaqueId = '  call:special/opaque  ';
    const call = createToolCall(opaqueId, 'opaque id');
    const harness = createHarness([
        createToolResponse([call]),
        createTextResponse('final prompt'),
    ]);

    await generateAiPromptWithOpenAICompatible(createSettings(), 'Search.', harness.deps);

    assert.equal(harness.requests[1].body.messages.at(-1).tool_call_id, opaqueId);
});

test('executes multiple tool calls in one round and preserves their order', async () => {
    const calls = [
        createToolCall('multi_1', 'first'),
        createToolCall('multi_2', 'second'),
    ];
    const harness = createHarness([
        createToolResponse(calls),
        createTextResponse('combined prompt'),
    ], async ({ query }) => `result:${query}`);

    const result = await generateAiPromptWithOpenAICompatible(
        createSettings(),
        'Use both searches.',
        harness.deps,
    );

    assert.equal(result.toolCalls, 2);
    assert.equal(result.toolRounds, 1);
    assert.deepEqual(harness.executions.map(item => item.args.query), ['first', 'second']);
    assert.deepEqual(harness.requests[1].body.messages.slice(-2), [
        { role: 'tool', tool_call_id: 'multi_1', content: 'result:first' },
        { role: 'tool', tool_call_id: 'multi_2', content: 'result:second' },
    ]);
});

test('returns a tool error to the model and continues the loop', async () => {
    const harness = createHarness([
        createToolResponse([createToolCall('error_1')]),
        createTextResponse('recovered prompt'),
    ], async () => {
        throw new Error('search unavailable');
    });

    const result = await generateAiPromptWithOpenAICompatible(
        createSettings(),
        'Try a search.',
        harness.deps,
    );

    assert.equal(result.text, 'recovered prompt');
    assert.equal(result.toolCalls, 1);
    assert.match(harness.requests[1].body.messages.at(-1).content, /^Tool error: search unavailable$/);
});

test('enforces the configured tool-call limit within a round', async () => {
    const calls = [
        createToolCall('limit_1', 'one'),
        createToolCall('limit_2', 'two'),
        createToolCall('limit_3', 'three'),
    ];
    const harness = createHarness([
        createToolResponse(calls),
        createTextResponse('limited prompt'),
    ], async ({ query }) => `result:${query}`);

    const result = await generateAiPromptWithOpenAICompatible(
        createSettings({ webSearchMaxCalls: 2 }),
        'Search several sources.',
        harness.deps,
    );

    assert.equal(result.toolCalls, 2);
    assert.equal(result.toolRounds, 1);
    assert.equal(harness.executions.length, 2);
    const toolMessages = harness.requests[1].body.messages.slice(-3);
    assert.equal(toolMessages[2].tool_call_id, 'limit_3');
    assert.match(toolMessages[2].content, /tool-call limit has been reached/);
});

test('stops after the maximum number of tool rounds', async () => {
    const responses = [1, 2, 3, 4].map(index => createToolResponse([
        createToolCall(`round_${index}`, `query ${index}`),
    ]));
    const harness = createHarness(responses, async ({ query }) => `result:${query}`);

    await assert.rejects(
        generateAiPromptWithOpenAICompatible(
            createSettings({ webSearchMaxCalls: 8 }),
            'Keep searching.',
            harness.deps,
        ),
        /工具调用超过 3 个回合/,
    );

    assert.equal(harness.requests.length, 4);
    assert.equal(harness.executions.length, 3);
});

test('rejects a length finish reason even when partial text exists', async () => {
    const harness = createHarness([
        createTextResponse('partial prompt', 'length'),
    ]);

    await assert.rejects(
        generateAiPromptWithOpenAICompatible(
            createSettings({ webSearchEnabled: false }),
            'Describe the scene.',
            harness.deps,
        ),
        /finish_reason=length/,
    );

    assert.equal(harness.requests.length, 1);
    assert.equal(harness.executions.length, 0);
});

test('empty-response retry cannot reset the search-call budget', async () => {
    const harness = createHarness([
        createToolResponse([createToolCall('first_attempt', 'first query')]),
        createTextResponse(''),
        createToolResponse([createToolCall('second_attempt', 'second query')]),
        createTextResponse('retry prompt'),
    ], async ({ query }) => `result:${query}`);

    const result = await generateAiPromptWithOpenAICompatible(
        createSettings({ webSearchMaxCalls: 1 }),
        'Search with a strict budget.',
        harness.deps,
    );

    assert.equal(result.text, 'retry prompt');
    assert.equal(result.attempts, 2);
    assert.equal(result.toolCalls, 1);
    assert.deepEqual(harness.executions.map(item => item.args.query), ['first query']);
    assert.match(harness.requests[3].body.messages.at(-1).content, /tool-call limit has been reached/);
});

test('reports searches consumed before a transient loop restart', async () => {
    const harness = createHarness([
        createToolResponse([createToolCall('before_restart', 'first query')]),
        new Error('network error'),
        createTextResponse('recovered prompt'),
    ]);
    harness.deps.toolBudget = createAiToolBudget({ maxCalls: 2 });

    await assert.rejects(
        generateAiPromptWithOpenAICompatible(createSettings(), 'Search.', harness.deps),
        /network error/,
    );
    const result = await generateAiPromptWithOpenAICompatible(
        createSettings(),
        'Search.',
        harness.deps,
    );

    assert.equal(result.text, 'recovered prompt');
    assert.equal(result.toolCalls, 1);
    assert.equal(result.toolRounds, 1);
});
