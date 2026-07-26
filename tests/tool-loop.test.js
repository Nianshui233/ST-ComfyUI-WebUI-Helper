import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createAiToolBudget,
    runAiToolLoop,
} from '../features/ai-tools/tool-loop.js';

const silentLogger = {
    info() {},
    warn() {},
};

function createTool(execute) {
    return {
        name: 'web_search',
        description: 'Search the web.',
        parameters: { type: 'object' },
        execute,
    };
}

function createHarness(decodedResponses) {
    let requestIndex = 0;
    const appendedRounds = [];

    return {
        appendedRounds,
        get requestCount() {
            return requestIndex;
        },
        requestCompletion: async () => {
            if (requestIndex >= decodedResponses.length) {
                throw new Error('Unexpected completion request');
            }
            return { responseIndex: requestIndex++ };
        },
        decodeResponse: parsed => decodedResponses[parsed.responseIndex],
        appendToolResults: ({ messages, decoded, results }) => {
            appendedRounds.push({ decoded, results });
            messages.push({ role: 'tool', results });
        },
    };
}

async function runWithHarness(harness, overrides = {}) {
    return runAiToolLoop({
        messages: [{ role: 'user', content: 'test' }],
        tools: [createTool(async args => args)],
        requestCompletion: harness.requestCompletion,
        decodeResponse: harness.decodeResponse,
        appendToolResults: harness.appendToolResults,
        logger: silentLogger,
        ...overrides,
    });
}

test('invalid JSON tool arguments become an ordered tool error', async () => {
    let executions = 0;
    const harness = createHarness([
        { text: '', toolCalls: [{ id: 'bad-json', name: 'web_search', arguments: '{"query":' }] },
        { text: 'done', toolCalls: [] },
    ]);

    const result = await runWithHarness(harness, {
        tools: [createTool(async () => {
            executions += 1;
            return 'unexpected';
        })],
    });

    assert.equal(result.text, 'done');
    assert.equal(executions, 0);
    assert.equal(harness.appendedRounds.length, 1);
    assert.equal(harness.appendedRounds[0].results[0].id, 'bad-json');
    assert.equal(harness.appendedRounds[0].results[0].isError, true);
    assert.match(harness.appendedRounds[0].results[0].content, /^Tool error:/);
});

test('unknown tools return a tool error without invoking available tools', async () => {
    let executions = 0;
    const harness = createHarness([
        { text: '', toolCalls: [{ id: 'unknown-1', name: 'missing_tool', arguments: '{}' }] },
        { text: 'continued', toolCalls: [] },
    ]);

    await runWithHarness(harness, {
        tools: [createTool(async () => {
            executions += 1;
            return 'unexpected';
        })],
    });

    const [toolResult] = harness.appendedRounds[0].results;
    assert.equal(executions, 0);
    assert.equal(toolResult.id, 'unknown-1');
    assert.equal(toolResult.name, 'missing_tool');
    assert.equal(toolResult.isError, true);
    assert.match(toolResult.content, /not available/);
});

test('parallel tool execution preserves the model call order', async () => {
    const pending = new Map();
    const harness = createHarness([
        {
            text: '',
            toolCalls: [
                { id: 'first', name: 'web_search', arguments: '{"label":"first"}' },
                { id: 'second', name: 'web_search', arguments: '{"label":"second"}' },
                { id: 'third', name: 'web_search', arguments: '{"label":"third"}' },
            ],
        },
        { text: 'done', toolCalls: [] },
    ]);
    const tool = createTool(args => new Promise(resolve => {
        pending.set(args.label, resolve);
        if (pending.size === 3) {
            pending.get('third')('result-three');
            pending.get('second')('result-two');
            pending.get('first')('result-one');
        }
    }));

    await runWithHarness(harness, { tools: [tool] });

    const results = harness.appendedRounds[0].results;
    assert.deepEqual(results.map(item => item.id), ['first', 'second', 'third']);
    assert.deepEqual(results.map(item => item.content), ['result-one', 'result-two', 'result-three']);
    assert.deepEqual(results.map(item => item.isError), [false, false, false]);
});

test('tool results longer than 12000 characters are truncated', async () => {
    const harness = createHarness([
        { text: '', toolCalls: [{ id: 'large', name: 'web_search', arguments: '{}' }] },
        { text: 'done', toolCalls: [] },
    ]);

    await runWithHarness(harness, {
        tools: [createTool(async () => 'x'.repeat(13000))],
    });

    const [toolResult] = harness.appendedRounds[0].results;
    assert.equal(toolResult.isError, false);
    assert.equal(toolResult.content.length, 12000);
    assert.ok(toolResult.content.startsWith('x'.repeat(100)));
    assert.match(toolResult.content, /\[工具结果已截断\]$/);
});

test('duplicate tool call IDs execute once and retain result order', async () => {
    let executions = 0;
    const harness = createHarness([
        {
            text: '',
            toolCalls: [
                { id: 'same-id', name: 'web_search', arguments: '{"query":"first"}' },
                { id: 'same-id', name: 'web_search', arguments: '{"query":"second"}' },
            ],
        },
        { text: 'done', toolCalls: [] },
    ]);

    const result = await runWithHarness(harness, {
        tools: [createTool(async args => {
            executions += 1;
            return args.query;
        })],
    });

    const results = harness.appendedRounds[0].results;
    assert.equal(executions, 1);
    assert.equal(result.toolCalls, 2);
    assert.equal(result.parsed.responseIndex, 1);
    assert.deepEqual(results.map(item => item.id), ['same-id', 'same-id']);
    assert.equal(results[0].content, 'first');
    assert.equal(results[0].isError, false);
    assert.equal(results[1].isError, true);
    assert.match(results[1].content, /duplicate tool call id/);
});

test('the tool-call limit returns an error for excess calls', async () => {
    let executions = 0;
    const harness = createHarness([
        {
            text: '',
            toolCalls: [
                { id: 'allowed', name: 'web_search', arguments: '{}' },
                { id: 'blocked', name: 'web_search', arguments: '{}' },
            ],
        },
        { text: 'done', toolCalls: [] },
    ]);

    const result = await runWithHarness(harness, {
        maxCalls: 1,
        tools: [createTool(async () => {
            executions += 1;
            return 'ok';
        })],
    });

    const results = harness.appendedRounds[0].results;
    assert.equal(executions, 1);
    assert.equal(result.toolCalls, 1);
    assert.equal(results[0].isError, false);
    assert.equal(results[1].isError, true);
    assert.match(results[1].content, /limit has been reached/);
});

test('the tool-round limit stops a repeated tool loop', async () => {
    let executions = 0;
    const harness = createHarness([
        { text: '', toolCalls: [{ id: 'round-one', name: 'web_search', arguments: '{}' }] },
        { text: '', toolCalls: [{ id: 'round-two', name: 'web_search', arguments: '{}' }] },
    ]);

    await assert.rejects(runWithHarness(harness, {
        maxRounds: 1,
        tools: [createTool(async () => {
            executions += 1;
            return 'ok';
        })],
    }));

    assert.equal(executions, 1);
    assert.equal(harness.requestCount, 2);
    assert.equal(harness.appendedRounds.length, 1);
});

test('a shared budget survives restarted tool loops', async () => {
    let executions = 0;
    const budget = createAiToolBudget({ maxCalls: 1, maxRounds: 3 });
    const firstHarness = createHarness([
        { text: '', toolCalls: [{ id: 'first-loop', name: 'web_search', arguments: '{}' }] },
        { text: 'first done', toolCalls: [] },
    ]);
    const secondHarness = createHarness([
        { text: '', toolCalls: [{ id: 'second-loop', name: 'web_search', arguments: '{}' }] },
        { text: 'second done', toolCalls: [] },
    ]);
    const tool = createTool(async () => {
        executions += 1;
        return 'ok';
    });

    const first = await runWithHarness(firstHarness, { budget, tools: [tool] });
    const second = await runWithHarness(secondHarness, { budget, tools: [tool] });

    assert.equal(first.toolCalls, 1);
    assert.equal(second.toolCalls, 0);
    assert.equal(executions, 1);
    assert.equal(budget.usedCalls, 1);
    assert.equal(budget.usedRounds, 2);
    assert.equal(secondHarness.appendedRounds[0].results[0].isError, true);
    assert.match(secondHarness.appendedRounds[0].results[0].content, /limit has been reached/);
});

test('a shared total-result budget truncates later results in call order', async () => {
    const budget = createAiToolBudget({
        maxCalls: 2,
        maxResultCharacters: 15,
    });
    const harness = createHarness([
        {
            text: '',
            toolCalls: [
                { id: 'result-one', name: 'web_search', arguments: '{"value":"x"}' },
                { id: 'result-two', name: 'web_search', arguments: '{"value":"y"}' },
            ],
        },
        { text: 'done', toolCalls: [] },
    ]);

    await runWithHarness(harness, {
        budget,
        tools: [createTool(async ({ value }) => value.repeat(10))],
    });

    const results = harness.appendedRounds[0].results;
    assert.equal(results[0].content, 'x'.repeat(10));
    assert.equal(results[1].content.length, 5);
    assert.equal(results[0].content.length + results[1].content.length, 15);
    assert.equal(budget.usedResultCharacters, 15);
});
