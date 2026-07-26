import test from 'node:test';
import assert from 'node:assert/strict';

import { generateAiPromptWithAnthropic } from '../features/ai-prompt/ai-prompt-anthropic.js';

const DEFAULTS = Object.freeze({
    aiPromptThinkingBudget: 2048,
    aiPromptThinkingEffort: 'medium',
    aiPromptThinkingMode: 'default',
});

const SILENT_LOGGER = Object.freeze({
    info() {},
    warn() {},
});

function createSettings(overrides = {}) {
    return {
        apiKey: 'test-api-key',
        apiModel: 'claude-test-model',
        apiTimeout: 1000,
        apiUrl: 'https://api.anthropic.test',
        instruction: 'Return only the final image prompt.',
        responseLength: 100,
        thinkingBudget: 2048,
        thinkingEffort: 'medium',
        thinkingMode: 'default',
        webSearchEnabled: false,
        webSearchMaxCalls: 3,
        ...overrides,
    };
}

function createWebSearchTool(execute = async ({ query }) => `result for ${query}`) {
    return {
        name: 'web_search',
        description: 'Search the public web.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string' },
            },
            required: ['query'],
            additionalProperties: false,
        },
        execute,
    };
}

function createHarness(responses, { webSearchTool } = {}) {
    const requests = [];
    let responseIndex = 0;

    async function makeRequest(options) {
        const body = JSON.parse(options.data);
        requests.push({ body, options });

        assert.ok(responseIndex < responses.length, `Unexpected request #${responseIndex + 1}`);
        const response = responses[responseIndex++];
        const payload = typeof response === 'function'
            ? await response({ body, options, requestIndex: responseIndex - 1 })
            : response;

        return {
            status: 200,
            responseText: JSON.stringify(payload),
        };
    }

    return {
        deps: {
            defaults: { ...DEFAULTS },
            logger: SILENT_LOGGER,
            makeRequest,
            webSearchTool,
        },
        requests,
    };
}

function finalResponse(text = 'final image prompt') {
    return {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text }],
    };
}

function toolUseResponse(calls, prefix = []) {
    return {
        stop_reason: 'tool_use',
        content: [
            ...prefix,
            ...calls.map(call => ({
                type: 'tool_use',
                id: call.id,
                name: call.name || 'web_search',
                input: call.input || { query: call.query },
            })),
        ],
    };
}

test('returns a normal Anthropic response without registering tools', async () => {
    const settings = createSettings();
    const { deps, requests } = createHarness([finalResponse('plain result')]);

    const result = await generateAiPromptWithAnthropic(settings, 'quiet prompt', deps);

    assert.equal(result.text, 'plain result');
    assert.equal(result.attempts, 1);
    assert.equal(result.toolCalls, 0);
    assert.equal(result.toolRounds, 0);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].body.tools, undefined);
    assert.deepEqual(requests[0].body.messages, [
        { role: 'user', content: 'quiet prompt' },
    ]);
});

test('sends configured drawing rules only through the Anthropic system field', async () => {
    const settings = createSettings({ instruction: 'SYSTEM_DRAWING_RULE_SENTINEL' });
    const { deps, requests } = createHarness([finalResponse('plain result')]);

    await generateAiPromptWithAnthropic(settings, 'USER_CHAT_DATA_SENTINEL', deps);

    assert.match(requests[0].body.system, /SYSTEM_DRAWING_RULE_SENTINEL/);
    assert.doesNotMatch(requests[0].body.system, /USER_CHAT_DATA_SENTINEL/);
    assert.deepEqual(requests[0].body.messages, [
        { role: 'user', content: 'USER_CHAT_DATA_SENTINEL' },
    ]);
});

test('executes one tool_use and returns its tool_result on the next request', async () => {
    const settings = createSettings({ webSearchEnabled: true });
    const assistantContent = [
        { type: 'text', text: 'I will search.' },
        {
            type: 'tool_use',
            id: 'toolu_one',
            name: 'web_search',
            input: { query: 'Anthropic tools' },
        },
    ];
    let receivedContext;
    const webSearchTool = createWebSearchTool(async (args, context) => {
        assert.deepEqual(args, { query: 'Anthropic tools' });
        receivedContext = context;
        return 'official result';
    });
    const { deps, requests } = createHarness([
        { stop_reason: 'tool_use', content: assistantContent },
        finalResponse(),
    ], { webSearchTool });

    const result = await generateAiPromptWithAnthropic(settings, 'quiet prompt', deps);

    assert.equal(result.toolCalls, 1);
    assert.equal(result.toolRounds, 1);
    assert.equal(receivedContext.settings, settings);
    assert.deepEqual(requests[0].body.tools, [{
        name: webSearchTool.name,
        description: webSearchTool.description,
        input_schema: webSearchTool.parameters,
    }]);
    assert.deepEqual(requests[1].body.messages[1], {
        role: 'assistant',
        content: assistantContent,
    });
    assert.deepEqual(requests[1].body.messages[2], {
        role: 'user',
        content: [{
            type: 'tool_result',
            tool_use_id: 'toolu_one',
            content: 'official result',
        }],
    });
});

test('merges multiple same-round tool results into one user content array', async () => {
    const settings = createSettings({ webSearchEnabled: true });
    const webSearchTool = createWebSearchTool(async ({ query }) => `found:${query}`);
    const { deps, requests } = createHarness([
        toolUseResponse([
            { id: 'toolu_a', query: 'query a' },
            { id: 'toolu_b', query: 'query b' },
        ]),
        finalResponse(),
    ], { webSearchTool });

    const result = await generateAiPromptWithAnthropic(settings, 'quiet prompt', deps);
    const resultMessage = requests[1].body.messages[2];

    assert.equal(result.toolCalls, 2);
    assert.equal(result.toolRounds, 1);
    assert.equal(requests[1].body.messages.length, 3);
    assert.deepEqual(resultMessage, {
        role: 'user',
        content: [
            {
                type: 'tool_result',
                tool_use_id: 'toolu_a',
                content: 'found:query a',
            },
            {
                type: 'tool_result',
                tool_use_id: 'toolu_b',
                content: 'found:query b',
            },
        ],
    });
});

test('replays thinking and signature content unchanged before tool results', async () => {
    const settings = createSettings({ webSearchEnabled: true });
    const assistantContent = [
        {
            type: 'thinking',
            thinking: 'Need current information.',
            signature: 'signed-thinking-block',
        },
        { type: 'text', text: 'Searching now.' },
        {
            type: 'tool_use',
            id: 'toolu_thinking',
            name: 'web_search',
            input: { query: 'current information' },
        },
    ];
    const { deps, requests } = createHarness([
        { stop_reason: 'tool_use', content: assistantContent },
        finalResponse(),
    ], { webSearchTool: createWebSearchTool() });

    await generateAiPromptWithAnthropic(settings, 'quiet prompt', deps);

    assert.deepEqual(requests[1].body.messages[1].content, assistantContent);
});

test('returns tool execution failures with Anthropic is_error', async () => {
    const settings = createSettings({ webSearchEnabled: true });
    const webSearchTool = createWebSearchTool(async () => {
        throw new Error('search backend unavailable');
    });
    const { deps, requests } = createHarness([
        toolUseResponse([{ id: 'toolu_error', query: 'failing query' }]),
        finalResponse('recovered result'),
    ], { webSearchTool });

    const result = await generateAiPromptWithAnthropic(settings, 'quiet prompt', deps);
    const toolResult = requests[1].body.messages[2].content[0];

    assert.equal(result.text, 'recovered result');
    assert.equal(result.toolCalls, 1);
    assert.equal(toolResult.tool_use_id, 'toolu_error');
    assert.equal(toolResult.is_error, true);
    assert.match(toolResult.content, /search backend unavailable/);
});

test('rejects max_tokens responses instead of accepting truncated text', async () => {
    const settings = createSettings();
    const { deps, requests } = createHarness([{
        stop_reason: 'max_tokens',
        content: [{ type: 'text', text: 'partial output' }],
    }]);

    await assert.rejects(
        generateAiPromptWithAnthropic(settings, 'quiet prompt', deps),
        /max_tokens/,
    );
    assert.equal(requests.length, 1);
});

test('rejects tool_use stop reasons that contain no tool_use block', async () => {
    const settings = createSettings({ webSearchEnabled: true });
    const { deps, requests } = createHarness([{
        stop_reason: 'tool_use',
        content: [{ type: 'text', text: 'Malformed tool response.' }],
    }], { webSearchTool: createWebSearchTool() });

    await assert.rejects(
        generateAiPromptWithAnthropic(settings, 'quiet prompt', deps),
        /tool_use/,
    );
    assert.equal(requests.length, 1);
});

test('rejects pause_turn explicitly', async () => {
    const settings = createSettings({ webSearchEnabled: true });
    const { deps } = createHarness([{
        stop_reason: 'pause_turn',
        content: [],
    }], { webSearchTool: createWebSearchTool() });

    await assert.rejects(
        generateAiPromptWithAnthropic(settings, 'quiet prompt', deps),
        /pause_turn/,
    );
});

test('enforces the configured call limit and reports excess calls as errors', async () => {
    const settings = createSettings({
        webSearchEnabled: true,
        webSearchMaxCalls: 1,
    });
    let executions = 0;
    const webSearchTool = createWebSearchTool(async ({ query }) => {
        executions += 1;
        return `found:${query}`;
    });
    const { deps, requests } = createHarness([
        toolUseResponse([
            { id: 'toolu_limit_1', query: 'first' },
            { id: 'toolu_limit_2', query: 'second' },
        ]),
        finalResponse(),
    ], { webSearchTool });

    const result = await generateAiPromptWithAnthropic(settings, 'quiet prompt', deps);
    const toolResults = requests[1].body.messages[2].content;

    assert.equal(executions, 1);
    assert.equal(result.toolCalls, 1);
    assert.equal(result.toolRounds, 1);
    assert.equal(toolResults[0].is_error, undefined);
    assert.equal(toolResults[1].is_error, true);
    assert.match(toolResults[1].content, /tool-call limit/);
});

test('stops after the shared tool round limit', async () => {
    const settings = createSettings({
        webSearchEnabled: true,
        webSearchMaxCalls: 8,
    });
    let executions = 0;
    const webSearchTool = createWebSearchTool(async () => {
        executions += 1;
        return 'round result';
    });
    const responses = Array.from({ length: 4 }, (_, index) => toolUseResponse([{
        id: `toolu_round_${index + 1}`,
        query: `round ${index + 1}`,
    }]));
    const { deps, requests } = createHarness(responses, { webSearchTool });

    await assert.rejects(
        generateAiPromptWithAnthropic(settings, 'quiet prompt', deps),
        /超过 3 个回合/,
    );
    assert.equal(requests.length, 4);
    assert.equal(executions, 3);
});

test('preserves the existing second attempt for an empty terminal response', async () => {
    const settings = createSettings();
    const { deps, requests } = createHarness([
        { stop_reason: 'end_turn', content: [] },
        finalResponse('retry result'),
    ]);

    const result = await generateAiPromptWithAnthropic(settings, 'quiet prompt', deps);

    assert.equal(result.text, 'retry result');
    assert.equal(result.attempts, 2);
    assert.equal(result.toolCalls, 0);
    assert.equal(result.toolRounds, 0);
    assert.equal(requests.length, 2);
    assert.match(requests[1].body.messages[0].content, /quiet prompt/);
    assert.notEqual(requests[1].body.messages[0].content, 'quiet prompt');
});
