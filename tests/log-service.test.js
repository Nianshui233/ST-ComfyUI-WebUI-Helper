import assert from 'node:assert/strict';
import test from 'node:test';

import { createLogStore } from '../features/logs/log-service.js';

test('formats terminal entries with milliseconds, fixed-width levels, and no blank separators', () => {
    const store = createLogStore();
    const firstTime = new Date(2026, 6, 27, 1, 2, 3, 4).getTime();
    const secondTime = new Date(2026, 6, 27, 1, 2, 4, 5).getTime();

    const text = store.formatEntriesForText([
        { time: firstTime, level: 'info', source: 'runtime', message: 'first', details: '' },
        { time: secondTime, level: 'warning', source: 'warn', message: 'second', details: '' },
        { time: secondTime, level: 'success', source: 'runtime', message: 'third', details: '' },
    ]);

    assert.equal(text, [
        '[2026-07-27 01:02:03.004] [INFO ] [runtime] first',
        '[2026-07-27 01:02:04.005] [WARN ] [warn] second',
        '[2026-07-27 01:02:04.005] [SUCC ] [runtime] third',
    ].join('\n'));
    assert.equal(text.includes('\n\n'), false);
});

test('indents multiline details and nested JSON in terminal output', () => {
    const store = createLogStore();
    const entry = store.info('completed', {
        note: 'line one\nline two',
        nested: { enabled: true },
    });

    assert.equal(entry.details, [
        'note :',
        '  line one',
        '  line two',
        'nested :',
        '  {',
        '    "enabled": true',
        '  }',
    ].join('\n'));
    assert.match(store.formatEntriesForText([{
        ...entry,
        time: new Date(2026, 6, 27, 1, 2, 3, 4).getTime(),
    }]), /\n    note :\n      line one\n      line two\n    nested :\n      \{\n        "enabled": true\n      \}/);
});

test('redacts sensitive fields and token-like strings before terminal formatting', () => {
    const store = createLogStore();
    const entry = store.info('Bearer abcdefghijkl', {
        apiKey: 'sk-abcdefghijklmnop',
        detail: 'provider key sk-qrstuvwxyzabcdef',
    });
    const text = store.formatEntriesForText([entry]);

    assert.match(text, /Bearer \*\*\*/);
    assert.match(text, /apiKey : \[redacted\]/);
    assert.match(text, /sk-qrs\*\*\*/);
    assert.equal(text.includes('abcdefghijkl'), false);
    assert.equal(text.includes('qrstuvwxyzabcdef'), false);
});

test('keeps the most recent 600 entries by default', () => {
    const store = createLogStore();
    for (let index = 0; index <= 600; index++) {
        store.info(`entry-${index}`);
    }

    const entries = store.getEntries();
    assert.equal(entries.length, 600);
    assert.equal(entries[0].message, 'entry-1');
    assert.equal(entries.at(-1).message, 'entry-600');
});

test('plugin logger keeps routine output internal and forwards errors only', () => {
    const forwarded = [];
    const baseLogger = {
        info: (...args) => forwarded.push(['info', ...args]),
        error: (...args) => forwarded.push(['error', ...args]),
    };
    const store = createLogStore({ logger: baseLogger });
    const logger = store.createLogger(baseLogger);
    logger.info('routine');
    logger.error('failure');
    assert.deepEqual(forwarded, [['error', 'failure']]);
    assert.deepEqual(store.getEntries().map(entry => entry.message), ['routine', 'failure']);
});
